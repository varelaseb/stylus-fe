import { SKILL_IDS, getSkillById } from '../skills/catalog';
import { getSkillSystemPrompt, runSkillSearch } from './backendClient';
import { requestAssistantMessage } from './openRouterClient';

export const MAX_TOOL_ROUNDS = 3;

const LOOP_GUARD_MESSAGE =
  'I hit a tool-call loop while gathering sources. Please rephrase your request and I will retry with a narrower scope.';

const SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_stylus_docs',
    description:
      'Retrieves relevant Arbitrum Stylus ecosystem context. Use this before final answers when evidence is needed.',
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

  const existingUrls = new Set();
  const markdownLinkRegex = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/gi;
  const plainUrlRegex = /https?:\/\/[^\s)\]]+/gi;

  for (const match of source.matchAll(markdownLinkRegex)) {
    existingUrls.add(match[1]);
  }
  for (const match of source.matchAll(plainUrlRegex)) {
    existingUrls.add(match[0]);
  }

  const lines = [];
  const minTotalLinks = 4;
  for (const ref of references) {
    const title = String(ref?.title || 'Reference').trim();
    const url = String(ref?.url || '').trim();
    if (!url.startsWith('http')) continue;
    if (existingUrls.has(url)) continue;

    lines.push(`- [${title}](${url})`);
    existingUrls.add(url);

    if (lines.length >= 6) break;
    if (existingUrls.size >= minTotalLinks && lines.length >= 1) break;
  }

  if (!lines.length) return source;

  const heading = source && existingUrls.size > lines.length ? 'Additional References:' : 'References:';
  return `${source}\n\n${heading}\n${lines.join('\n')}`;
};

const executeSearchToolCall = async (toolCall, skillId, onStatus, seedPrompt = '') => {
  const toolName = toolCall?.function?.name || 'unknown';
  if (toolName !== 'search_stylus_docs') {
    return `Error: unsupported tool '${toolName}'`;
  }

  try {
    const args = JSON.parse(toolCall?.function?.arguments || '{}');
    const query = String(args.query || '').trim();
    const seed = String(seedPrompt || '').trim();
    const effectiveQuery =
      skillId === SKILL_IDS.PORTING_AUDITOR && seed
        ? `${query}\n\nPrimary target context: ${seed}`
        : query;

    onStatus?.('Searching Stylus knowledge base...');
    const payload = await runSkillSearch({ skillId, query: effectiveQuery });
    return JSON.stringify(payload);
  } catch (error) {
    return `Search API error: ${error.message}`;
  }
};

export const runSkillConversation = async ({ messages, skillId, onStatus }) => {
  const skill = getSkillById(skillId);
  const effectiveSystemPrompt = await getSkillSystemPrompt(skillId);
  if (!effectiveSystemPrompt) {
    throw new Error(`Published system prompt is missing for skill '${skillId}'.`);
  }
  const latestUserPrompt =
    [...messages].reverse().find((message) => message?.role === 'user')?.content || '';

  const workingMessages = [...messages];

  for (let depth = 0; depth <= MAX_TOOL_ROUNDS; depth += 1) {
    if (depth > MAX_TOOL_ROUNDS) break;

    onStatus?.(depth > 0 ? 'Drafting final response...' : `Running ${skill.label}...`);

    const assistantMessage = await requestAssistantMessage({
      messages: workingMessages.map(toLlmMessage),
      tools: [SEARCH_TOOL],
      systemPrompt: effectiveSystemPrompt,
      onStatus,
    });

    workingMessages.push(assistantMessage);

    const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : [];

    if (!toolCalls.length) {
      const extractedRefs = extractReferencesFromMessages(workingMessages);
      const safeContent = ensureClickableReferences(assistantMessage.content, extractedRefs);

      workingMessages[workingMessages.length - 1] = {
        ...assistantMessage,
        role: 'assistant',
        content: safeContent,
        skillId,
      };

      return workingMessages;
    }

    onStatus?.('Using skill tools to gather references...');

    for (const toolCall of toolCalls) {
      const result = await executeSearchToolCall(toolCall, skillId, onStatus, latestUserPrompt);
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
