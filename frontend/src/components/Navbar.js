import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => (
  <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
    <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
    <Link to="/performance" style={{ marginRight: '1rem' }}>Performance</Link>
    <Link to="/monitoring" style={{ marginRight: '1rem' }}>Lab Monitoring</Link>
    <Link to="/create-lab" style={{ marginRight: '1rem' }}>Create Lab</Link>
    <Link to="/delete-lab" style={{ marginRight: '1rem' }}>Delete Lab</Link>
    <Link to="/allocate-resources">Allocate Resources</Link>
  </nav>
);

export default Navbar;
