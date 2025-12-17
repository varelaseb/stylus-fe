import React from 'react';

const Chat = () => {
    return (
        <div className="section">
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Chat Demo</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    This feature is currently under development. <br />
                    Please check back later or use the <a href="/" style={{ textDecoration: 'underline' }}>Landing page</a> to get the MCP server.
                </p>
            </div>
        </div>
    );
};

export default Chat;
