import React from 'react';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  return (
    <div className="section" style={{ paddingTop: '7rem' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1rem' }}>Skill-first chat</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Select a skill and run it directly. No heuristic auto-routing.
        </p>
        <ChatWindow isChatPage={true} />
      </div>
    </div>
  );
};

export default Chat;
