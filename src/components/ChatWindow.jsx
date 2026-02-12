import React, { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'prismjs/themes/prism-tomorrow.css';

const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL || '/stylus-chat';
const OPENROUTER_PROXY_URL =
  import.meta.env.VITE_OPENROUTER_PROXY_URL || '/openrouter/chat/completions';
const MODEL = import.meta.env.VITE_LLM_MODEL || 'google/gemini-2.0-flash-exp';
const FALLBACK_MODEL = import.meta.env.VITE_LLM_FALLBACK_MODEL || 'openai/gpt-4o-mini';
const SYSTEM_PROMPT =
  import.meta.env.VITE_LLM_SYSTEM_PROMPT ||
  [
    'You are Sifter, a research assistant for Arbitrum Stylus developers.',
    'Use search_stylus_docs for technical Stylus questions before final answers.',
    'Do not generate contract or application code.',
    'Answer references-first: links/repositories/docs first, concise guidance second.',
    'Format references as markdown hyperlinks whenever possible.',
    'If retrieval is insufficient, say so clearly.',
  ].join(' ');
const MAX_TOOL_ROUNDS = 3;
const SUGGESTED_PROMPTS = [
  'What are the newest Stylus tools and what do they do?',
  'I need references for test patterns in Stylus smart contracts.',
  'How do teams usually deploy and verify Stylus contracts now?',
  'What community projects are active in the Stylus ecosystem?',
];
const INITIAL_ASSISTANT_MESSAGE = {
  role: 'assistant',
  content:
    'Hi, how can I help you? I focus on Stylus ecosystem research and can return source links first.',
};

const URL_REGEX = /(^|[\s(])((https?:\/\/[^\s)<]+))/g;
const MARKDOWN_LINK_TOKEN_PREFIX = '__md_link_token_';

const linkifyPlainUrls = (text) => {
  const source = String(text ?? '');
  const preserved = [];

  const masked = source.replace(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g, (match) => {
    const token = `${MARKDOWN_LINK_TOKEN_PREFIX}${preserved.length}__`;
    preserved.push(match);
    return token;
  });

  const linked = masked.replace(URL_REGEX, (_full, prefix, url) => {
    const cleaned = url.replace(/[),.;!?]+$/, '');
    const trailing = url.slice(cleaned.length);
    return `${prefix}[${cleaned}](${cleaned})${trailing}`;
  });

  return linked.replace(
    new RegExp(`${MARKDOWN_LINK_TOKEN_PREFIX}(\\d+)__`, 'g'),
    (_token, index) => preserved[Number(index)] || _token
  );
};

const normalizeReferenceFormatting = (text) => {
  const source = String(text ?? '');
  const lines = source.split('\n');

  const transformed = lines.map((line) => {
    // "- Name - https://url - description"
    let match = line.match(/^(\s*[-*]\s+)([^-\n][^-]*?)\s+-\s+(https?:\/\/\S+)(\s+-\s+.*)?$/);
    if (match) {
      const prefix = match[1];
      const name = match[2].trim();
      const url = match[3].trim().replace(/[),.;!?]+$/, '');
      const desc = (match[4] || '').trim();
      return `${prefix}[${name}](${url})${desc ? ` ${desc}` : ''}`;
    }

    // "1. Name - https://url - description"
    match = line.match(/^(\s*\d+\.\s+)([^-\n][^-]*?)\s+-\s+(https?:\/\/\S+)(\s+-\s+.*)?$/);
    if (match) {
      const prefix = match[1];
      const name = match[2].trim();
      const url = match[3].trim().replace(/[),.;!?]+$/, '');
      const desc = (match[4] || '').trim();
      return `${prefix}[${name}](${url})${desc ? ` ${desc}` : ''}`;
    }

    return line;
  });

  return transformed.join('\n');
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
  const source = String(text ?? '');
  if (!references.length) return source;

  const hasInlineLink = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/i.test(source);
  const hasPlainUrl = /https?:\/\/\S+/i.test(source);
  if (hasInlineLink || hasPlainUrl) return source;

  const lines = references.slice(0, 6).map((ref) => `- [${ref.title}](${ref.url})`);
  return `${source}\n\nReferences:\n${lines.join('\n')}`;
};

const SEARCH_TOOL = {
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

const ChatWindow = () => {
  const [messages, setMessages] = useState([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [kbReady, setKbReady] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      });
    }
    Prism.highlightAll();
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    const healthUrl = SEARCH_API_URL.replace(/\/stylus-chat$/, '/health');

    const checkHealth = async () => {
      try {
        const res = await fetch(healthUrl, { method: 'GET' });
        if (mounted) setKbReady(res.ok);
      } catch {
        if (mounted) setKbReady(false);
      }
    };

    checkHealth();
    const timer = setInterval(checkHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const runLocalSearchTool = async (query) => {
    try {
      setThinkingStatus('Searching Stylus knowledge base...');
      const response = await fetch(SEARCH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        return `Search API error (${response.status})`;
      }

      const payload = await response.json();
      return JSON.stringify(payload);
    } catch (error) {
      return `Search API error: ${error.message}`;
    }
  };

  const callOpenRouter = async (model, payload) =>
    fetch(OPENROUTER_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, ...payload }),
    });

  const processLlmTurn = async (currentMessages, depth = 0) => {
    if (depth > MAX_TOOL_ROUNDS) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I hit a tool-call loop while gathering sources. Please rephrase your request and I will retry with a narrower scope.',
        },
      ]);
      return;
    }

    setThinkingStatus(depth > 0 ? 'Drafting final response...' : 'Querying model...');
    const basePayload = {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...currentMessages],
      tools: [SEARCH_TOOL],
      tool_choice: 'auto',
    };

    let response = await callOpenRouter(MODEL, basePayload);
    if (!response.ok) {
      const body = await response.text();
      const shouldFallback =
        response.status === 404 && MODEL !== FALLBACK_MODEL && body.includes('No endpoints found');

      if (shouldFallback) {
        setThinkingStatus('Primary model unavailable, trying fallback...');
        response = await callOpenRouter(FALLBACK_MODEL, basePayload);
      }

      if (!response.ok) {
        const retryBody = shouldFallback ? await response.text() : body;
        throw new Error(`LLM request failed (${response.status}): ${retryBody.slice(0, 200)}`);
      }
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message;
    if (!message) {
      throw new Error('LLM returned no message.');
    }

    const updatedMessages = [...currentMessages, message];

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      setThinkingStatus('Using tools to gather references...');

      for (const toolCall of message.tool_calls) {
        let result = `Error: unsupported tool '${toolCall?.function?.name || 'unknown'}'`;

        try {
          const args = JSON.parse(toolCall?.function?.arguments || '{}');
          if (toolCall?.function?.name === 'search_stylus_docs') {
            const query = args.query || '';
            result = await runLocalSearchTool(query);
          }
        } catch (error) {
          result = `Error executing tool: ${error.message}`;
        }

        updatedMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      await processLlmTurn(updatedMessages, depth + 1);
      return;
    }

    const extractedRefs = extractReferencesFromMessages(updatedMessages);
    const safeContent = ensureClickableReferences(message.content, extractedRefs);
    setMessages((prev) => [...prev, { role: 'assistant', content: safeContent }]);
  };

  const submitPrompt = async (promptText) => {
    const normalized = String(promptText || '').trim();
    if (!normalized || loading) return;

    const userMessage = { role: 'user', content: normalized };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setThinkingStatus('Understanding your request...');

    try {
      await processLlmTurn(newMessages, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${message}` }]);
    } finally {
      setLoading(false);
      setThinkingStatus('');
    }
  };

  const handleSend = async () => {
    await submitPrompt(input);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitPrompt(input);
    }
  };

  return (
    <div
      className="chat-window-container"
      style={{
        maxWidth: '800px',
        margin: '2rem auto 4rem',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
        transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
      }}
    >
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: kbReady ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 10px ${kbReady ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
            }}
          />
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Sifter AI</span>
          {!kbReady && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              (Connecting to Knowledge Base...)
            </span>
          )}
        </div>
        <button
          onClick={() => setMessages([INITIAL_ASSISTANT_MESSAGE])}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '0.25rem 0.75rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            transition: 'all 0.2s',
          }}
        >
          Reset
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#ffffff',
        }}
      >
        {messages.map((msg, index) => {
          if (msg.role === 'tool' || msg.tool_calls) return null;
          return (
            <div
              key={index}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.25rem',
                    marginLeft: '0.5rem',
                  }}
                >
                  Sifter
                </div>
              )}
              <div
                style={{
                  padding: msg.role === 'assistant' ? '0.8rem 1rem 0.8rem 1.3rem' : '0.75rem 1rem',
                  borderRadius: '12px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--color-stylus-cyan), #3b82f6)'
                      : 'var(--color-surface)',
                  color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                  lineHeight: 1.5,
                  borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                  borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                  border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {msg.role === 'assistant' ? (
                  <div className="assistant-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        code: ({ inline, className, children, ...props }) => {
                          if (inline) {
                            return (
                              <code className="md-inline-code" {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="md-code-block">
                              <code className={className || ''} {...props}>
                                {String(children).replace(/\n$/, '')}
                              </code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {normalizeReferenceFormatting(linkifyPlainUrls(msg.content))}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ alignSelf: 'flex-start', marginLeft: '0.5rem', marginTop: '0.5rem' }}>
            {thinkingStatus && (
              <div
                style={{
                  marginBottom: '0.45rem',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {thinkingStatus}
              </div>
            )}
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {!loading && messages.length <= 1 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submitPrompt(prompt)}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '999px',
                  padding: '0.35rem 0.75rem',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  transition: 'all 0.2s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'var(--color-surface)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={kbReady ? 'Ask about Arbitrum Stylus...' : 'Connecting to knowledge base...'}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '0.8rem 1rem',
              color: 'var(--color-text-primary)',
              outline: 'none',
              fontSize: '0.95rem',
            }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 1rem',
              color: input.trim() ? 'var(--color-stylus-cyan)' : 'var(--color-text-secondary)',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'color 0.2s',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
