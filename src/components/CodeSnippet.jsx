import React, { useState, useEffect } from 'react';
import { IconCopy, IconCheck } from './Icons';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-toml';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme

const CodeSnippet = ({ code, language = 'json' }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        Prism.highlightAll();
    }, [code, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-snippet" style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #0b1220 0%, #111827 58%, #1f2937 100%)',
            borderRadius: '12px',
            border: '1px solid #334155',
            overflow: 'hidden',
            marginBottom: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
            <div style={{
                height: '3px',
                background: 'linear-gradient(90deg, #f97316 0%, #38bdf8 50%, #f472b6 100%)'
            }} />

            {/* Header/Controls */}
            <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                zIndex: 10
            }}>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'rgba(56, 189, 248, 0.18)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        borderRadius: '6px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: copied ? '#4ade80' : '#cbd5e1',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(4px)'
                    }}
                    title="Copy to clipboard"
                >
                    {copied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                </button>
            </div>

            {/* Code Content */}
            <div style={{
                padding: '1.5rem',
                overflowX: 'auto',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-mono)',
                lineHeight: '1.6'
            }}>
                <pre style={{ margin: 0, background: 'transparent' }}>
                    <code className={`language-${language}`}>
                        {code}
                    </code>
                </pre>
            </div>
        </div>
    );
};

export default CodeSnippet;
