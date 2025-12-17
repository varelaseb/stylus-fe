import React from 'react';

const Footer = () => {
    return (
        <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem 0', marginTop: 'auto' }}>
            <div className="container" style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <p>© {new Date().getFullYear()} Sifter for Stylus.</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    Built by <a href="https://emberai.xyz" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Ember AI</a>
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Not an official Arbitrum product.</p>
            </div>
        </footer>
    );
};

export default Footer;
