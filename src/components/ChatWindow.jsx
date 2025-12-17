
import React, { useState, useEffect, useRef } from 'react';
import { IconSearch } from './Icons';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

// Config
const MCP_URL = import.meta.env.VITE_MCP_SERVER_URL || "https://mcp.sifter.dev/v1/stylus";
const SYSTEM_PROMPT = import.meta.env.VITE_LLM_SYSTEM_PROMPT || "You are a helpful assistant for Arbitrum Stylus developers. If the user asks a technical question, USE THE AVAILABLE TOOLS to find the answer. Do not hallucinate Stylus APIs. Always cite your sources if the tool provides them.";
const MODEL = import.meta.env.VITE_LLM_MODEL || "google/gemini-2.0-flash-exp";

const ChatWindow = () => {
    // State
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi, how can I help you? I have access to the latest Arbitrum Stylus documentation and resources.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // MCP State
    const [mcpReady, setMcpReady] = useState(false);
    const [mcpTools, setMcpTools] = useState([]);
    const [postEndpoint, setPostEndpoint] = useState(null);
    const requestCounter = useRef(0);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const eventSourceRef = useRef(null);

    // Animation trigger on mount
    useEffect(() => {
        // Small delay to ensure render before animation starts
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    // MCP Connection (DISABLED)
    useEffect(() => {
        // Disabled for now as per user request
        const MCP_ENABLED = false;
        if (!MCP_ENABLED) return;

        let isCtxMounted = true;
        console.log('Connecting to MCP SSE:', MCP_URL);

        try {
            const es = new EventSource(MCP_URL);
            eventSourceRef.current = es;

            es.onopen = () => {
                console.log('MCP SSE Connected');
            };

            es.addEventListener('endpoint', (event) => {
                if (!isCtxMounted) return;
                try {
                    const data = JSON.parse(event.data || '{}'); // Standard MCP might just send the string or JSON
                    // The spec says `endpoint` event carries the URI to POST to. 
                    // It can be a relative or absolute URL.
                    // If event.data is just the string URL:
                    const endpoint = data.uri || event.data;
                    console.log('MCP Post Endpoint received:', endpoint);

                    // Resolve relative URL if needed
                    const resolvedEndpoint = new URL(endpoint, MCP_URL).toString();
                    setPostEndpoint(resolvedEndpoint);

                    // Once we have the endpoint, initialize
                    initializeMcp(resolvedEndpoint);
                } catch (e) {
                    console.error('Error parsing endpoint event:', e);
                }
            });

            es.onerror = (err) => {
                console.error('MCP SSE Error:', err);
                // Simple retry logic or just leave it
                es.close();
            };

        } catch (e) {
            console.error('Failed to create EventSource:', e);
        }

        return () => {
            isCtxMounted = false;
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Helper: JSON-RPC Call
    const rpcCall = async (endpoint, method, params = {}) => {
        const id = requestCounter.current++;
        const payload = {
            jsonrpc: "2.0",
            id,
            method,
            params
        };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`MCP RPC ${method} failed: ${res.status} `);
            return await res.json();
        } catch (error) {
            console.error('RPC Error:', error);
            return null;
        }
    };

    // Initialize MCP
    const initializeMcp = async (endpoint) => {
        console.log('Initializing MCP...');
        const initResult = await rpcCall(endpoint, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: { listChanged: false },
                sampling: {}
            },
            clientInfo: {
                name: "SifterWebClient",
                version: "1.0.0"
            }
        });

        if (initResult?.result) {
            // Confirm initialization
            await rpcCall(endpoint, 'notifications/initialized');
            console.log('MCP Initialized.');
            setMcpReady(true);

            // List Tools
            const toolsResult = await rpcCall(endpoint, 'tools/list');
            if (toolsResult?.result?.tools) {
                console.log('MCP Tools Found:', toolsResult.result.tools);
                setMcpTools(toolsResult.result.tools);
            }
        }
    };



    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Error: No OpenAI/OpenRouter API key configured.' }]);
                setLoading(false);
                return;
            }

            // Prepare tools for LLM
            const toolsForLlm = mcpTools.length > 0 ? mcpTools.map(tool => ({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema
                }
            })) : undefined;

            await processLlmTurn(newMessages, toolsForLlm, apiKey);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
        } finally {
            setLoading(false);
        }
    };

    const processLlmTurn = async (currentMessages, tools, apiKey) => {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey} `,
                'Content-Type': 'application/json',
                // 'HTTP-Referer': window.location.origin,
            },
            body: JSON.stringify({
                model: MODEL, // Configured model
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    ...currentMessages
                ],
                tools: tools,
                tool_choice: tools ? 'auto' : undefined
            })
        });

        if (!response.ok) throw new Error('LLM request failed');
        const data = await response.json();
        const choice = data.choices[0];
        const message = choice.message;

        // Add assistant message (which might be null content if it's a tool call)
        const updatedMessages = [...currentMessages, message];

        // Handle logic
        if (message.tool_calls && message.tool_calls.length > 0 && postEndpoint) {
            // Execute tool calls
            // Note: Parallel execution if multiple
            // For now, we only support one turn of tools per user input to prevent loops
            // setMessages(prev => [...prev, message]); // Show the "thinking" or tool use intermediate state? Maybe not necessary for UI.

            for (const toolCall of message.tool_calls) {
                console.log('Executing Tool:', toolCall.function.name);

                // Add to history so LLM knows it called
                // (Already added in updatedMessages)

                // Execute on MCP
                let result = "Error: Tool execution failed";
                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    const mcpRes = await rpcCall(postEndpoint, 'tools/call', {
                        name: toolCall.function.name,
                        arguments: args
                    });

                    if (mcpRes?.result) {
                        // MCP results usually have { content: [{ type: 'text', text: '...' }] }
                        const content = mcpRes.result.content || [];
                        result = content.map(c => c.text).join('\n');
                    } else if (mcpRes?.error) {
                        result = `Error: ${mcpRes.error.message} `;
                    }
                } catch (err) {
                    result = `Error executing tool: ${err.message} `;
                }

                // Add tool result to chat history
                updatedMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: result
                });
            }

            // Recurse: Call LLM again with tool results
            await processLlmTurn(updatedMessages, tools, apiKey);

        } else {
            // Final response
            setMessages(prev => [...prev, { role: 'assistant', content: message.content }]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
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
                height: '500px'
            }}
        >
            {/* Header */}
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: mcpReady ? '#10b981' : '#f59e0b',
                        boxShadow: `0 0 10px ${mcpReady ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'} `
                    }} />
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Sifter AI</span>
                    {!mcpReady && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>(Connecting to Knowledge Base...)</span>}
                </div>
                <button
                    onClick={() => setMessages([{ role: 'assistant', content: 'Hi, how can I help you? I have access to the latest Arbitrum Stylus documentation and resources.' }])}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.75rem',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                    }}
                >
                    Reset
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                style={{
                    flex: 1,
                    padding: '1.5rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: '#ffffff'
                }}>
                {messages.map((msg, index) => {
                    if (msg.role === 'tool' || msg.tool_calls) return null;
                    return (
                        <div
                            key={index}
                            style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                animation: 'fadeIn 0.3s ease-out'
                            }}
                        >
                            {msg.role === 'assistant' && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem', marginLeft: '0.5rem' }}>
                                    Sifter
                                </div>
                            )}
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: msg.role === 'user'
                                    ? 'linear-gradient(135deg, var(--color-stylus-cyan), #3b82f6)'
                                    : 'var(--color-surface)',
                                color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
                                lineHeight: 1.5,
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', marginLeft: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-border)',
                background: '#ffffff'
            }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={mcpReady ? "Ask about Arbitrum Stylus..." : "Connecting to knowledge base..."}
                        disabled={!mcpReady && loading}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '0.8rem 1rem',
                            color: 'var(--color-text-primary)',
                            outline: 'none',
                            fontSize: '0.95rem'
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
                            alignItems: 'center'
                        }}
                    >
                        Ask
                    </button>
                </div>
            </div>

            <style>{`
@keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
}
                .typing-indicator {
    display: flex;
    gap: 4px;
}
                .typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--color-text-secondary);
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
}
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}
`}</style>
        </div>
    );
};

export default ChatWindow;
