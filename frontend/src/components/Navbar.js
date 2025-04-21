import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const navStyle = {
    padding: '1rem 2rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    fontSize: '1rem',
    fontWeight: '500'
  };

  const linkStyle = {
    textDecoration: 'none',
    color: '#1f2937', // neutral dark gray
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    transition: 'background 0.2s'
  };

  const hoverStyle = {
    backgroundColor: '#e5e7eb' // soft hover bg
  };

  return (
    <nav style={navStyle}>
      {[
        { to: '/', label: 'Home' },
        { to: '/server-performance', label: 'Performance' },
        { to: '/lab-monitoring', label: 'Lab Monitoring' },
        { to: '/lab-creation', label: 'Create Lab' },
        { to: '/lab-deletion', label: 'Delete Lab' },
        { to: '/resource-allocation', label: 'Allocate Resources' }
      ].map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          style={linkStyle}
          onMouseEnter={e => Object.assign(e.target.style, hoverStyle)}
          onMouseLeave={e => Object.assign(e.target.style, linkStyle)}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default Navbar;
