import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  const navLinkClass = ({ isActive }) =>
    `nav-link fw-semibold px-3 py-2 rounded-2 ${isActive ? 'active' : ''}`;

  return (
    <nav
      className={`navbar navbar-expand-lg fixed-top transition-all ${
        scrolled ? 'navbar-scrolled shadow' : 'navbar-transparent'
      }`}
      style={{
        transition: 'all .35s ease',
        background: scrolled ? 'rgba(255,255,255,.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #e5e7eb' : 'none',
        padding: scrolled ? '8px 0' : '16px 0',
      }}
    >
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width:42, height:42, background:'linear-gradient(135deg,#1a3c6e,#2563eb)', flexShrink:0 }}
          >
            <i className="bi bi-mortarboard-fill text-white" style={{ fontSize:'1.1rem' }}/>
          </div>
          <div>
            <div className={`fw-bold lh-1 ${scrolled ? 'text-dark' : 'text-white'}`}
                 style={{ fontSize:'1.1rem' }}>
              Nenasala
            </div>
            <div className={`lh-1 ${scrolled ? 'text-primary' : 'text-warning'}`}
                 style={{ fontSize:'.7rem', letterSpacing:'.05em' }}>
              INSTITUTE
            </div>
          </div>
        </Link>

        {/* Hamburger */}
        <button
          className="navbar-toggler border-0 shadow-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ color: scrolled ? '#1a3c6e' : '#fff' }}
        >
          <i className={`bi bi-${menuOpen ? 'x-lg' : 'list'} fs-4`}/>
        </button>

        {/* Links */}
        <div className={`navbar-collapse ${menuOpen ? 'd-block' : 'd-none d-lg-flex'}`}
             style={{ background: menuOpen ? 'rgba(255,255,255,.98)' : 'transparent',
                      borderRadius: menuOpen ? 12 : 0, padding: menuOpen ? '12px 16px' : 0,
                      marginTop: menuOpen ? 8 : 0 }}>
          <ul className="navbar-nav mx-auto d-flex gap-1">
            {[
              { to: '/',        label: 'Home'    },
              { to: '/about',   label: 'About'   },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <li key={to} className="nav-item">
                <NavLink to={to} end className={navLinkClass}
                  style={({ isActive }) => ({
                    color: isActive
                      ? '#2563eb'
                      : scrolled || menuOpen ? '#374151' : 'rgba(255,255,255,.9)',
                    background: isActive ? '#eff6ff' : 'transparent',
                  })}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            <Link to="/login"
              className="btn btn-outline-primary btn-sm fw-semibold px-4 rounded-pill"
              style={{ borderColor: scrolled || menuOpen ? '#2563eb' : 'rgba(255,255,255,.6)',
                       color:       scrolled || menuOpen ? '#2563eb' : '#fff' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
