import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CopyModule from '../components/CopyModule';
import { IconSearch, IconDatabase, IconCheck, IconZap, IconTrendingUp, IconShield, IconBook, IconTool, IconCompass } from '../components/Icons';
import CodeSnippet from '../components/CodeSnippet';


import ChatWindow from '../components/ChatWindow';

const Landing = () => {
    const [activeTab, setActiveTab] = useState('claude'); // 'claude', 'codexCli', 'cursor', 'antigravity', 'codexIde'
    const mcpUrl = import.meta.env.VITE_MCP_SERVER_URL || "https://mcp.sifter.dev/v1/stylus";
    const connectSectionRef = useRef(null);
    const connectHeadingRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const scrollToConnectSection = () => {
        const target = connectHeadingRef.current || connectSectionRef.current;
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;
        const navbarOffset = 90;
        const centeredY = absoluteTop - (window.innerHeight / 2) + (rect.height / 2) - (navbarOffset / 2);

        window.scrollTo({
            top: Math.max(0, centeredY),
            behavior: 'smooth',
        });
    };

    return (
        <div className="landing-page" style={{ position: 'relative' }}>
            {/* Mouse follower cloud */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    pointerEvents: 'none',
                    zIndex: 0,
                    background: 'radial-gradient(600px circle at var(--cursor-x) var(--cursor-y), rgba(224, 68, 56, 0.04), transparent 40%)',
                    transform: 'translateZ(0)',
                }}
            />

            {/* Hero */}
            <section style={{
                minHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '8rem 2rem 2rem', /* increased top padding further */
                background: 'radial-gradient(120% 100% at 50% -20%, rgba(224, 68, 56, 0.1) 0%, rgba(249, 198, 98, 0.1) 50%, transparent 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative mesh */}
                <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translate(-50%, 0)', width: '1200px', height: '600px', background: 'radial-gradient(circle, rgba(249, 198, 98, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

                <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>

                    <div className="animate-fade-in" style={{
                        marginBottom: '2rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        borderRadius: '100px',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 500
                    }}>
                        <span>Shaped in the <span style={{ color: 'var(--color-stylus-cyan)', fontWeight: 600 }}>Stylus Sprint</span></span>
                    </div>

                    <h1 className="animate-fade-in" style={{
                        fontSize: '3.5rem',
                        letterSpacing: '-0.02em',
                        fontWeight: 800,
                        marginBottom: '1rem',
                        lineHeight: 1.1
                    }}>
                        Research assistant for <span className="text-gradient">Arbitrum Stylus</span>
                    </h1>

                    <p className="animate-fade-in delay-100" style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '3rem',
                        maxWidth: '600px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.6
                    }}>
                        We sift through official and community resources to surface answers with references
                    </p>

                    <div className="animate-fade-in delay-200" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
                        <ChatWindow />
                    </div>

                </div>
            </section>

            {/* Installation Instructions */}
            <section id="connect-sifter" ref={connectSectionRef} className="section" style={{ paddingTop: '0' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                        <h2 ref={connectHeadingRef} style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Connect to Sifter from your IDE</h2>
                    </div>

                    {/* Tabs - Segmented Control */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            background: '#e2e8f0',
                            padding: '4px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            gap: '4px',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}>
                            <TabButton label="Claude Code" isActive={activeTab === 'claude'} onClick={() => setActiveTab('claude')} />
                            <TabButton label="Codex CLI" isActive={activeTab === 'codexCli'} onClick={() => setActiveTab('codexCli')} />
                            <div style={{
                                width: '1px',
                                alignSelf: 'stretch',
                                background: 'linear-gradient(180deg, rgba(148, 163, 184, 0), rgba(148, 163, 184, 0.5), rgba(148, 163, 184, 0))',
                                margin: '2px 8px'
                            }} />
                            <TabButton label="Cursor" isActive={activeTab === 'cursor'} onClick={() => setActiveTab('cursor')} />
                            <TabButton label="Antigravity" isActive={activeTab === 'antigravity'} onClick={() => setActiveTab('antigravity')} />
                            <TabButton label="Codex IDE" isActive={activeTab === 'codexIde'} onClick={() => setActiveTab('codexIde')} />
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="card" style={{ minHeight: '300px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', textAlign: 'left' }}>

                        {/* CLAUDE CODE */}
                        {activeTab === 'claude' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>1. Open your configuration file</p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Open your terminal
                                    </p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Edit <code>~/.claude.json</code> (MacOS/Linux) or <code>%APPDATA%\Claude\claude.json</code> (Windows)
                                    </p>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>2. Add this snippet inside "mcpServers"</p>
                                    <CodeSnippet
                                        code={`"sifter": {
  "url": "${mcpUrl}",
  "transport": "sse"
}`}
                                        language="json"
                                    />
                                </div>
                            </div>
                        )}

                        {/* CODEX CLI */}
                        {activeTab === 'codexCli' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>1. Open your configuration file</p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Open your terminal
                                    </p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Edit <code>~/.codex/config.toml</code>
                                    </p>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>2. Append this block</p>
                                    <CodeSnippet
                                        code={`[mcpServers.sifter]
url = "${mcpUrl}"
transport = "sse"`}
                                        language="toml"
                                    />
                                </div>
                            </div>
                        )}

                        {/* CODEX IDE */}
                        {activeTab === 'codexIde' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>1. Open Codex settings</p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Open Codex and go to <strong>Settings</strong> → <strong>MCP Servers</strong>
                                    </p>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>2. Add an SSE MCP server</p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Name: <code>sifter</code> | Transport: <code>sse</code> | URL:
                                    </p>
                                    <CopyModule text={mcpUrl} />
                                </div>
                            </div>
                        )}

                        {/* CURSOR */}
                        {activeTab === 'cursor' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <ol style={{ paddingLeft: '1.5rem', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <li>Navigate to <strong>Cursor Settings</strong> (top right gear icon) → <strong>Features</strong> → <strong>MCP Services</strong></li>
                                        <li>Click <strong>+ Add New MCP Server</strong></li>
                                        <li>Set Type to <strong>SSE</strong></li>
                                        <li>Paste the URL below:</li>
                                    </ol>
                                    <CopyModule text={mcpUrl} />
                                </div>
                            </div>
                        )}

                        {/* ANTIGRAVITY */}
                        {activeTab === 'antigravity' && (
                            <div className="animate-fade-in">
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>1. Open MCP Settings</p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Click the <strong>MCP Store</strong> icon in the sidebar
                                    </p>
                                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        Click <strong>Manage Servers</strong> then select <strong>Edit mcp_config.json</strong>
                                    </p>
                                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>2. Add to your config object</p>
                                    <CodeSnippet
                                        code={`"sifter": {
  "url": "${mcpUrl}",
  "transport": "sse"
}`}
                                        language="json"
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="section" style={{ background: 'white' }}>
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            marginTop: '0.5rem',
                            letterSpacing: '-0.02em'
                        }}>
                            Save days of research
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem 2rem' }}>
                        <BenefitCard
                            icon={<IconSearch />}
                            title="Faster Research"
                            text="Stop slewthing GitHub, docs, and release notes"
                        />
                        <BenefitCard
                            icon={<IconBook />}
                            title="Proven Patterns"
                            text="Find proven approaches and tools for your exact task"
                        />
                        <BenefitCard
                            icon={<IconShield />}
                            title="Find Inefficiencies"
                            text="Find Solidity inefficiencies to migrate to Stylus"
                        />
                        <BenefitCard
                            icon={<IconCompass />}
                            title="Stay Current"
                            text="Know what’s current and stale in the Stylus toolchain"
                        />
                    </div>
                </div>
            </section>

            {/* How it works (Process Flow) */}
            <section className="section" style={{ overflow: 'visible' }}>
                <div className="container">
                    <div style={{
                        textAlign: 'center',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <h2 style={{
                            fontSize: '2.5rem',
                            marginBottom: '3rem',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            textShadow: '0 4px 12px rgba(15, 23, 42, 0.1)'
                        }}>
                            We keep the pulse on Stylus so you can build with confidence
                        </h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '2rem',
                            textAlign: 'left'
                        }}>
                            <FeaturePill
                                icon={<IconSearch />}
                                title="Sift"
                                desc="Continuously indexed official docs, and high-value community resources."
                            />
                            <FeaturePill
                                icon={<IconDatabase />}
                                title="Digest"
                                desc="Version-aware, and context-aware semantic database of the ecosystem."
                            />
                            <FeaturePill
                                icon={<IconCheck />}
                                title="Answer"
                                desc="Grounded answers, with direct links to source code and verified references."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 style={{
                        fontSize: '2rem',
                        marginBottom: '3rem',
                        textAlign: 'center',
                        textShadow: '0 4px 12px rgba(15, 23, 42, 0.1)'
                    }}>FAQ</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <FAQItem
                            question="Will this change my workflow?"
                            answer="No. You keep crafting your code. Sifter lives in your IDE as an MCP server you can query when you need context."
                        />
                        <FAQItem
                            question="Does Sifter write code for me?"
                            answer="No. Sifter doesn’t generate code. It finds patterns, tools, and up-to-date guidance with sources."
                        />
                        <FAQItem
                            question="What can I ask it?"
                            answer="Anything like: “Is this a good fit for Stylus?”, “What’s the most common approach?”, “What tools are people using now?”, “What changed recently that affects my setup?”"
                        />
                    </div>
                    <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                        <button onClick={scrollToConnectSection} className="btn btn-primary" style={{ cursor: 'pointer' }}>Plug into sifter</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

/* Sub-components */
const SectionHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>{title}</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.15rem' }}>{subtitle}</p>
    </div>
);

const BenefitCard = ({ icon, title, text }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left'
    }}>
        <div style={{
            color: 'var(--color-stylus-cyan)',
            marginBottom: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem',
            borderRadius: '12px',
            display: 'inline-flex'
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>{text}</p>
    </div>
);

const ProcessStep = ({ icon, title, desc }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
            background: 'rgba(255,255,255,0.1)',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white'
        }}>
            {React.cloneElement(icon, { width: 28, height: 28 })}
        </div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 700 }}>{title}</h3>
        <p style={{ color: '#cbd5e1', lineHeight: 1.4, fontSize: '0.9rem' }}>{desc}</p>
    </div>
);

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div style={{ borderBottom: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '1.5rem 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: 'var(--color-text-primary)'
                }}
            >
                {question}
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'var(--color-text-secondary)'
                }}>
                    {isOpen ? '−' : '+'}
                </span>
            </button>
            <div style={{
                height: isOpen ? 'auto' : 0,
                opacity: isOpen ? 1 : 0,
                maxHeight: isOpen ? '200px' : '0',
                transition: 'all 0.2s ease-out',
                overflow: 'hidden'
            }}>
                <p style={{ paddingBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>{answer}</p>
            </div>
        </div>
    );
};

const TabButton = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`tab-btn ${isActive ? 'active' : ''}`}
        data-text={label}
        style={{ minWidth: '80px' }}
    >
        {label}
    </button>
);

const FeaturePill = ({ icon, title, desc }) => {
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
        <div
            className="feature-pill"
            onMouseMove={handleMouseMove}
        >
            <div className="feature-header">
                <div className="feature-icon">
                    {React.cloneElement(icon, { width: 22, height: 22 })}
                </div>
                <h3 className="feature-title">{title}</h3>
            </div>
            <p className="feature-desc">{desc}</p>
        </div>
    );
};

export default Landing;
