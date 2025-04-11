import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
        <h1>🏠 Home Page</h1> {/* Add this line */}
      <h2>Infrastructure Dashboard</h2>
      <button onClick={() => navigate('/performance')}>Performance of Servers</button><br /><br />
      <button onClick={() => navigate('/monitoring')}>Lab Usage Monitoring</button><br /><br />
      <button onClick={() => navigate('/create-lab')}>Creation of Labs</button><br /><br />
      <button onClick={() => navigate('/delete-lab')}>Deletion of Labs</button><br /><br />
      <button onClick={() => navigate('/allocate-resources')}>Allocation of Resources for Labs</button>
    </div>
  );
};

export default Home;
