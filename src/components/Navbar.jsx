import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

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
                    <img src={logo} alt="Sifter Logo" style={{ height: '40px', width: 'auto' }} />
                    <span>Sifter</span>
                </Link>

            </div>
        </nav>
    );
};

export default Navbar;
