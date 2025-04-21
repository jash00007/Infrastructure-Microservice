// pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '2rem'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    textAlign: 'center'
    
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const cardStyle = (bgColor, hoverColor) => ({
    backgroundColor: bgColor,
    color: '#fff',
    padding: '1.25rem 1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    transition: 'background-color 0.3s',
    fontSize: '1.1rem',
    fontWeight: '500'
  });

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Lab Infrastructure Management</h1>

      <div style={gridStyle}>
        <Link to="/lab-creation" style={cardStyle('#444242')}>
          ➕ Create Lab
        </Link>

        <Link to="/lab-deletion" style={cardStyle('#444242')}>
          🗑️ Delete Lab
        </Link>

        <Link to="/lab-monitoring" style={cardStyle('#444242')}>
          📊 Monitor Labs
        </Link>

        <Link to="/server-performance" style={cardStyle('#444242')}>
          🖥️ Server Performance
        </Link>

        <Link to="/resource-allocation" style={cardStyle('#444242')}>
          ⚙️ Resource Allocation
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
