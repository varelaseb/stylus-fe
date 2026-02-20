import React, { useEffect, useRef, useState } from 'react';
import {
  IconBook,
  IconCheck,
  IconCompass,
  IconDatabase,
  IconSearch,
  IconShield,
} from '../components/Icons';
import CodeSnippet from '../components/CodeSnippet';
import ChatWindow from '../components/ChatWindow';
import { appEnv } from '../config/env';

const INSTALL_ALL_SKILLS_COMMAND = `npx ${appEnv.skillsInstallerPackage} \\
  --repo ${appEnv.skillsInstallRepo}`;

const Landing = () => {
  const connectSectionRef = useRef(null);
  const connectHeadingRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
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
    const centeredY = absoluteTop - window.innerHeight / 2 + rect.height / 2 - navbarOffset / 2;

    window.scrollTo({
      top: Math.max(0, centeredY),
      behavior: 'smooth',
    });
  };

  return (
    <div className="landing-page" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          background:
            'radial-gradient(600px circle at var(--cursor-x) var(--cursor-y), rgba(224, 68, 56, 0.04), transparent 40%)',
          transform: 'translateZ(0)',
        }}
      />

      <section
        style={{
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '8rem 2rem 2rem',
          background:
            'radial-gradient(120% 100% at 50% -20%, rgba(224, 68, 56, 0.1) 0%, rgba(249, 198, 98, 0.1) 50%, transparent 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            width: '1200px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(249, 198, 98, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            zIndex: 0,
          }}
        ></div>

        <div className="container" style={{ maxWidth: '960px', position: 'relative', zIndex: 1 }}>
          <h1
            className="animate-fade-in"
            style={{
              fontSize: 'clamp(2.25rem, 4.6vw, 3rem)',
              letterSpacing: '-0.02em',
              fontWeight: 800,
              maxWidth: '920px',
              margin: '0 auto 1rem',
              marginBottom: '1rem',
              lineHeight: 1.1,
            }}
          >
            <>
              Understand the Stylus ecosystem.
              <br />
              Decide what's worth porting.
            </>
          </h1>

          <p
            className="animate-fade-in delay-100"
            style={{
              fontSize: '1.25rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '3rem',
              maxWidth: '680px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            Two skills, two jobs: one tracks the Stylus ecosystem, one tells you whether a contract is worth porting.
          </p>

          <div
            className="animate-fade-in delay-200"
            style={{ width: '100%', maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}
          >
            <ChatWindow />
          </div>
        </div>
      </section>

      <section id="install-sifter-skills" ref={connectSectionRef} className="section" style={{ paddingTop: '0' }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 ref={connectHeadingRef} style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Connect to Sifter from your IDE
            </h2>
          </div>

          <div className="card" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="animate-fade-in">
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Install skills</p>
              <CodeSnippet code={INSTALL_ALL_SKILLS_COMMAND} language="bash" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'white' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                marginTop: '0.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Save days of research
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '4rem 2rem',
            }}
          >
            <BenefitCard
              icon={<IconSearch />}
              title="Faster Research"
              text="No more digging through changelogs, Discord threads, and half-stale tutorials."
            />
            <BenefitCard
              icon={<IconBook />}
              title="Proven Patterns"
              text="Battle-tested approaches from teams that have already shipped on Stylus."
            />
            <BenefitCard
              icon={<IconShield />}
              title="Porting Impact"
              text="Separate high-upside Stylus candidates from low-impact ports quickly."
            />
            <BenefitCard
              icon={<IconCompass />}
              title="Stay Current"
              text="Flags what's still valid vs. what's outdated as Stylus evolves."
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Porting Auditor
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.75rem', lineHeight: 1.6 }}>
              Purpose-built for the hybrid question: should this contract stay in Solidity, or move to Stylus?
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <FeaturePill
              icon={<IconShield />}
              title="What It Answers"
              desc={
                <>
                  Whether a contract is likely <code>high_stylus_benefit</code> or <code>low_stylus_impact</code>.
                </>
              }
            />
            <FeaturePill
              icon={<IconCheck />}
              title="How It Responds"
              desc={
                <>
                  It gives a stance first (<code>port now</code>, <code>pilot first</code>, or <code>defer</code>), then evidence and caveats.
                </>
              }
            />
            <FeaturePill
              icon={<IconCompass />}
              title="Best Input"
              desc={
                <>
                  Pass a repo URL or contract path when possible, so the verdict is specific to your actual code.
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="section" style={{ overflow: 'visible' }}>
        <div className="container">
          <div
            style={{
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            <h2
              style={{
                fontSize: '2.5rem',
                marginBottom: '3rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
              }}
            >
              We keep the pulse on Stylus so you can build with confidence
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '2rem',
                textAlign: 'left',
              }}
            >
              <FeaturePill
                icon={<IconSearch />}
                title="Sift"
                desc="Continuously indexed official docs, repos, and community resources — not a one-time snapshot."
              />
              <FeaturePill
                icon={<IconDatabase />}
                title="Digest"
                desc="Version-aware, semantically structured data across the full Stylus ecosystem."
              />
              <FeaturePill
                icon={<IconCheck />}
                title="Answer"
                desc="Every response is grounded with links to source code, docs, and real project references."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2
            style={{
              fontSize: '2rem',
              marginBottom: '3rem',
              textAlign: 'center',
              textShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
            }}
          >
            FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <FAQItem
              question="What is sift-stylus-research?"
              answer="It is the research skill. Use it for ecosystem questions like tooling, docs, deployment references, and what teams are using now. It is optimized for source-backed answers with links."
            />
            <FAQItem
              question="What is sift-stylus-porting-auditor?"
              answer="It is the candidacy judgment skill. Use it when you want a verdict on whether porting a Solidity contract to Stylus is high benefit or low impact in a hybrid Solidity + Rust architecture."
            />
            <FAQItem
              question="When should I use research vs auditor?"
              answer="Use Research when the question is informational and reference-driven. Use Porting Auditor when the question is evaluative and you need a go/no-go style impact judgment for porting."
            />
            <FAQItem
              question="Will this change my workflow?"
              answer="Not much. You keep building the same way; Sifter now slots in as installable skills instead of requiring direct MCP endpoint setup."
            />
            <FAQItem
              question="Does Sifter write code for me?"
              answer="By default, no. It prioritizes references, practical guidance, and porting impact judgments."
            />
            <FAQItem
              question="What can I ask it?"
              answer="Anything like: ‘is this a good Stylus candidate?’, ‘what tools are teams using now?’, or ‘what changed recently that affects my setup?’"
            />
          </div>
          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <button
              onClick={scrollToConnectSection}
              className="btn btn-primary"
              style={{ cursor: 'pointer' }}
            >
              Install Sifter skills
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const BenefitCard = ({ icon, title, text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
    <div
      style={{
        color: 'var(--color-stylus-cyan)',
        marginBottom: '1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '0.75rem',
        borderRadius: '12px',
        display: 'inline-flex',
      }}
    >
      {icon}
    </div>
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {title}
    </h3>
    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>{text}</p>
  </div>
);

const FeaturePill = ({ icon, title, desc }) => {
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="feature-pill" onMouseMove={handleMouseMove}>
      <div className="feature-header">
        <div className="feature-icon">{React.cloneElement(icon, { width: 22, height: 22 })}</div>
        <h3 className="feature-title">{title}</h3>
      </div>
      <p className="feature-desc">{desc}</p>
    </div>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

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
          color: 'var(--color-text-primary)',
        }}
      >
        {question}
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 400,
            lineHeight: 1,
            color: 'var(--color-text-secondary)',
          }}
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div
        style={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          maxHeight: isOpen ? '200px' : '0',
          transition: 'all 0.2s ease-out',
          overflow: 'hidden',
        }}
      >
        <p style={{ paddingBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
          {answer}
        </p>
      </div>
    </div>
  );
};

export default Landing;
