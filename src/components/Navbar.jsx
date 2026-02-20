import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const GITHUB_URL = import.meta.env.VITE_PROJECT_GITHUB_URL || 'https://github.com/placeholder';
const X_URL = import.meta.env.VITE_PROJECT_X_URL || 'https://x.com/placeholder';

const Navbar = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 70) {
                // Scrolling down & past navbar height
                setIsVisible(false);
            } else {
                // Scrolling up
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <nav style={{
            position: 'fixed',
            top: isVisible ? '2rem' : '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1000px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: '100px',
            boxShadow: '0 8px 32px rgb(0 0 0 / 0.08)',
            zIndex: 100,
            transition: 'top 0.3s ease-in-out'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', padding: '0 2rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                    <img src={logo} alt="Sifter Logo" style={{ height: '48px', width: 'auto' }} />
                    <span>Sifter</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        style={{ color: 'var(--color-text-primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M12 .5A12 12 0 0 0 0 12.7a12 12 0 0 0 8.2 11.6c.6.1.8-.3.8-.6v-2.3c-3.3.8-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.8 0-.8 0-.8 1.1.1 1.8 1.1 1.8 1.1 1 1.8 2.7 1.3 3.3 1 .1-.7.4-1.2.7-1.5-2.6-.3-5.4-1.4-5.4-6.1 0-1.4.5-2.5 1.2-3.4-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.4 1.3a11.5 11.5 0 0 1 6.2 0c2.3-1.6 3.3-1.3 3.3-1.3.7 1.6.3 2.9.2 3.2.8.9 1.2 2 1.2 3.4 0 4.7-2.8 5.8-5.5 6.1.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 24 12.7 12 12 0 0 0 12 .5Z" />
                        </svg>
                    </a>
                    <a
                        href={X_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="X"
                        style={{ color: 'var(--color-text-primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.9-6.4L6.2 22H3l7.3-8.3L1 2h6.4l4.4 5.9L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
                        </svg>
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
