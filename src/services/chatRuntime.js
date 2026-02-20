import { SKILL_IDS, getSkillById } from '../skills/catalog';
import { runSkillSearch } from './backendClient';
import { requestAssistantMessage } from './openRouterClient';

export const MAX_TOOL_ROUNDS = 3;

const LOOP_GUARD_MESSAGE =
  'I hit a tool-call loop while gathering sources. Please rephrase your request and I will retry with a narrower scope.';

const RESEARCH_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_stylus_docs',
    description:
      'Retrieves relevant Arbitrum Stylus ecosystem context. Use this before final answers and return links/references first.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing the Stylus research question.',
        },
      },
      required: ['query'],
    },
  },
};

const PORTING_AUDITOR_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_stylus_docs',
    description:
      'Retrieves evidence for Stylus porting judgments (benchmarks, implementation patterns, caveats, and real-world anecdotes). Use this to support a direct contract verdict. Do not return references-only answers.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing the Stylus research question.',
        },
      },
      required: ['query'],
    },
  },
};

const buildSearchTool = (skillId) =>
  skillId === SKILL_IDS.PORTING_AUDITOR ? PORTING_AUDITOR_SEARCH_TOOL : RESEARCH_SEARCH_TOOL;

const PORTING_STANCE_REGEX = /\b(port now|pilot first|defer)\b/i;
const PORTING_IMPACT_REGEX = /\b(high_stylus_benefit|low_stylus_impact)\b/i;

const looksLikeReferenceListOnly = (content) => {
  const text = String(content || '').trim();
  if (!text) return true;

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return true;

  const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
  const linkedBulletLines = bulletLines.filter((line) => /\]\(https?:\/\/|https?:\/\//i.test(line));
  const reasoningSignal =
    /\b(because|therefore|due to|hot path|compute|throughput|state|storage|crypt|proof|risk|bottleneck|latency)\b/i.test(
      text
    );

  return linkedBulletLines.length >= 3 && !reasoningSignal;
};

const shouldRewriteAuditorAnswer = (skillId, content) => {
  if (skillId !== SKILL_IDS.PORTING_AUDITOR) return false;

  const text = String(content || '');
  const hasStance = PORTING_STANCE_REGEX.test(text);
  const hasImpactClass = PORTING_IMPACT_REGEX.test(text);
  const referenceOnly = looksLikeReferenceListOnly(text);

  return !hasStance || !hasImpactClass || referenceOnly;
};

const rewriteAuditorAnswer = async ({ workingMessages, skill, onStatus }) => {
  const rewriteInstruction = {
    role: 'user',
    content: [
      'Rewrite your previous answer as a direct contract analysis verdict.',
      'Do not return a references-only response.',
      'Use exactly this structure:',
      'Stance: <port now | pilot first | defer>',
      'Impact: <high_stylus_benefit | low_stylus_impact>',
      'Drivers:',
      '- <3 to 6 contract-specific reasons>',
      'Risks/Caveats:',
      '- <2 to 4 caveats>',
      'Evidence:',
      '- <linked sources>',
    ].join('\n'),
  };

  onStatus?.('Finalizing contract verdict...');

  return requestAssistantMessage({
    messages: [...workingMessages.map(toLlmMessage), rewriteInstruction],
    tools: [],
    systemPrompt: skill.systemPrompt,
    onStatus,
  });
};

const toLlmMessage = (message) => {
  const normalized = { role: message.role };

  if (Object.prototype.hasOwnProperty.call(message, 'content')) {
    normalized.content = message.content;
  }

  if (message.tool_call_id) {
    normalized.tool_call_id = message.tool_call_id;
  }

  if (Array.isArray(message.tool_calls)) {
    normalized.tool_calls = message.tool_calls;
  }

  return normalized;
};

const extractReferencesFromMessages = (messages) => {
  const collected = [];
  const seen = new Set();

  for (const msg of [...messages].reverse()) {
    if (msg?.role !== 'tool') continue;

    try {
      const payload = JSON.parse(msg.content || '{}');
      const refs = Array.isArray(payload?.references) ? payload.references : [];

      for (const ref of refs) {
        const title = String(ref?.title || 'Reference').trim();
        const url = String(ref?.url || '').trim();

        if (!url.startsWith('http')) continue;
        if (seen.has(url)) continue;

        seen.add(url);
        collected.push({ title, url });
      }
    } catch {
      // Ignore non-JSON tool payloads.
    }
  }

  return collected;
};

const ensureClickableReferences = (text, references) => {
  const source = String(text || '');
  if (!references.length) return source;

  const hasInlineLink = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/i.test(source);
  const hasPlainUrl = /https?:\/\/\S+/i.test(source);

  if (hasInlineLink || hasPlainUrl) {
    return source;
  }

  const lines = references.slice(0, 6).map((ref) => `- [${ref.title}](${ref.url})`);
  return `${source}\n\nReferences:\n${lines.join('\n')}`;
};

const executeSearchToolCall = async (toolCall, skillId, onStatus) => {
  const toolName = toolCall?.function?.name || 'unknown';
  if (toolName !== 'search_stylus_docs') {
    return `Error: unsupported tool '${toolName}'`;
  }

  try {
    const args = JSON.parse(toolCall?.function?.arguments || '{}');
    const query = String(args.query || '').trim();

    onStatus?.('Searching Stylus knowledge base...');
    const payload = await runSkillSearch({ skillId, query });
    return JSON.stringify(payload);
  } catch (error) {
    return `Search API error: ${error.message}`;
  }
};

export const runSkillConversation = async ({ messages, skillId, onStatus }) => {
  const skill = getSkillById(skillId);
  const workingMessages = [...messages];

  for (let depth = 0; depth <= MAX_TOOL_ROUNDS; depth += 1) {
    if (depth > MAX_TOOL_ROUNDS) break;

    onStatus?.(depth > 0 ? 'Drafting final response...' : `Running ${skill.label}...`);

    const assistantMessage = await requestAssistantMessage({
      messages: workingMessages.map(toLlmMessage),
      tools: [buildSearchTool(skillId)],
      systemPrompt: skill.systemPrompt,
      onStatus,
    });

    workingMessages.push(assistantMessage);

    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : [];

    if (!toolCalls.length) {
      let finalizedAssistantMessage = assistantMessage;

      if (shouldRewriteAuditorAnswer(skillId, assistantMessage.content)) {
        try {
          finalizedAssistantMessage = await rewriteAuditorAnswer({
            workingMessages,
            skill,
            onStatus,
          });
        } catch {
          // Keep the original answer if rewrite fails.
        }
      }

      const extractedRefs = extractReferencesFromMessages(workingMessages);
      const safeContent = ensureClickableReferences(finalizedAssistantMessage.content, extractedRefs);

      workingMessages[workingMessages.length - 1] = {
        ...finalizedAssistantMessage,
        role: 'assistant',
        content: safeContent,
        skillId,
      };

      return workingMessages;
    }

    onStatus?.('Using skill tools to gather references...');

    for (const toolCall of toolCalls) {
      const result = await executeSearchToolCall(toolCall, skillId, onStatus);
      workingMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return [
    ...workingMessages,
    {
      role: 'assistant',
      content: LOOP_GUARD_MESSAGE,
      skillId,
    },
  ];
};
