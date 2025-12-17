import React, { useState } from 'react';
import { IconCopy, IconCheck } from './Icons';

const CopyModule = ({ text, copyValue, label }) => {
    const [copied, setCopied] = useState(false);
    const valueToCopy = copyValue || text;

    const handleCopy = (e) => {
        // Stop bubbling if nested (though we usually won't nest clickable inside clickable)
        e.stopPropagation();

        navigator.clipboard.writeText(valueToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ margin: '1rem 0' }}>
            {label && <p style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>{label}</p>}
            <div
                onClick={handleCopy}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                    maxWidth: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-stylus-cyan)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
            >
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                    {text}
                </div>

                <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        color: copied ? '#10b981' : 'var(--color-text-secondary)',
                        transition: 'color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px'
                    }}>
                        {copied ? (
                            <div className="animate-fade-in" style={{ display: 'flex' }}><IconCheck /></div>
                        ) : (
                            <div style={{ display: 'flex' }}><IconCopy /></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopyModule;
