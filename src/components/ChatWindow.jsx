import React, { useEffect, useMemo, useRef, useState } from 'react';
import Prism from 'prismjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'prismjs/themes/prism-tomorrow.css';

import {
  DEFAULT_SKILL_ID,
  SKILL_OPTIONS,
  buildInitialAssistantMessage,
  getSkillById,
  getSuggestedPromptsForSkill,
} from '../skills/catalog';
import { getKnowledgeBaseHealth } from '../services/backendClient';
import { runSkillConversation } from '../services/chatRuntime';
import { linkifyPlainUrls, normalizeReferenceFormatting } from '../utils/messageFormatting';

const ChatWindow = () => {
  const [messages, setMessages] = useState([buildInitialAssistantMessage(DEFAULT_SKILL_ID)]);
  const [activeSkillId, setActiveSkillId] = useState(DEFAULT_SKILL_ID);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [kbReady, setKbReady] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = useMemo(
    () => getSuggestedPromptsForSkill(activeSkillId),
    [activeSkillId]
  );

  const activeSkillLabel = getSkillById(activeSkillId).shortLabel;

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

    const checkHealth = async () => {
      try {
        const response = await getKnowledgeBaseHealth();
        if (mounted) {
          setKbReady(response.ok);
        }
      } catch {
        if (mounted) {
          setKbReady(false);
        }
      }
    };

    checkHealth();
    const timer = setInterval(checkHealth, 10000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setMessages((currentMessages) => {
      if (currentMessages.length !== 1) {
        return currentMessages;
      }
      return [buildInitialAssistantMessage(activeSkillId)];
    });
  }, [activeSkillId]);

  const submitPrompt = async (promptText) => {
    const normalized = String(promptText || '').trim();
    if (!normalized || loading) return;

    const resolvedSkillId = activeSkillId;
    const userMessage = { role: 'user', content: normalized, skillId: resolvedSkillId };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setThinkingStatus(`Running ${getSkillById(resolvedSkillId).label}...`);

    try {
      const updatedMessages = await runSkillConversation({
        messages: nextMessages,
        skillId: resolvedSkillId,
        onStatus: setThinkingStatus,
      });
      setMessages(updatedMessages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          skillId: resolvedSkillId,
          content: `Error: ${message}`,
        },
      ]);
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

  const renderAssistantLabel = (skillId) => {
    const skill = getSkillById(skillId);
    return `Sifter • ${skill.shortLabel}`;
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
          gap: '1rem',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>Skill</span>
          <select
            value={activeSkillId}
            onChange={(event) => setActiveSkillId(event.target.value)}
            disabled={loading}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.28rem 0.5rem',
              fontSize: '0.78rem',
              color: 'var(--color-text-primary)',
              background: '#fff',
            }}
            title="Choose which skill to run"
          >
            {SKILL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setMessages([buildInitialAssistantMessage(activeSkillId)])}
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
              key={`${msg.role}-${index}`}
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
                  {renderAssistantLabel(msg.skillId)}
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
                        a: ({ ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
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
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => submitPrompt(prompt)}
                title={`Runs ${activeSkillLabel}`}
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
            placeholder={
              kbReady
                ? `Ask about Arbitrum Stylus (${activeSkillLabel})...`
                : 'Connecting to knowledge base...'
            }
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
