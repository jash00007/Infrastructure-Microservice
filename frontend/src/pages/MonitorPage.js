import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';

const MonitorPage = () => {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('');
  const [activeUsers, setActiveUsers] = useState('');
  const [duration, setDuration] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  const [utilizationData, setUtilizationData] = useState([]);
  const [popularLabs, setPopularLabs] = useState([]);

  useEffect(() => {
    axios.get(`${config.MONITOR_URL}/monitor/labs`)
      .then(res => setLabs(res.data))
      .catch(err => console.error("Error fetching labs:", err));

    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = () => {
    axios.get(`${config.MONITOR_URL}/monitor/labs/over-under-utilized`)
      .then(res => setUtilizationData(res.data))
      .catch(err => console.error("Error fetching utilization data:", err));

    axios.get(`${config.MONITOR_URL}/monitor/labs/popular`)
      .then(res => setPopularLabs(res.data))
      .catch(err => console.error("Error fetching popular labs:", err));
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${config.MONITOR_URL}/simulate/${labId}`, {
        active_users: Number(activeUsers),
        duration_minutes: Number(duration)
      });

      setSimulationResult(res.data.usage);
      fetchMonitoringData();
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    marginBottom: '20px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff'
  };

  const thTdStyle = {
    border: '1px solid #ccc',
    padding: '12px',
    textAlign: 'left'
  };

  const sectionStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f9f9f9'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>Lab Monitoring Dashboard</h2>

      <form onSubmit={handleSimulate} style={{ ...sectionStyle, padding: '20px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Simulate Lab Usage</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Select Lab:</label>
          <select value={labId} onChange={e => setLabId(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
            <option value="">-- Choose a lab --</option>
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Active Users:</label>
          <input
            type="number"
            value={activeUsers}
            onChange={e => setActiveUsers(e.target.value)}
            required
            style={{ width: '98%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Duration (minutes):</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
            style={{ width: '98%', padding: '8px' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Simulate
        </button>
      </form>

      {simulationResult && (
        <div style={sectionStyle}>
          <h4 style={{ fontSize: '18px', marginBottom: '8px' }}>Simulated Resource Usage</h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li>CPU: {simulationResult.cpu}</li>
            <li>Memory: {simulationResult.memory}</li>
            <li>Disk: {simulationResult.disk}</li>
          </ul>
        </div>
      )}

      <div style={sectionStyle}>
        <h3 style={{ fontSize: '20px' }}>Lab Utilization</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Lab</th>
              <th style={thTdStyle}>Estimated Users</th>
              <th style={thTdStyle}>Average Users</th>
              <th style={thTdStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {utilizationData.map(lab => (
              <tr key={lab.lab_id}>
                <td style={thTdStyle}>{lab.name}</td>
                <td style={thTdStyle}>{lab.estimated_users}</td>
                <td style={thTdStyle}>{lab.avg_users}</td>
                <td style={thTdStyle}>{lab.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={sectionStyle}>
        <h3 style={{ fontSize: '20px' }}>Most Popular Labs</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thTdStyle}>Lab</th>
              <th style={thTdStyle}>Total Sessions</th>
              <th style={thTdStyle}>Total User Minutes</th>
            </tr>
          </thead>
          <tbody>
            {popularLabs.map(lab => (
              <tr key={lab.lab_id}>
                <td style={thTdStyle}>{lab.name}</td>
                <td style={thTdStyle}>{lab.total_sessions}</td>
                <td style={thTdStyle}>{lab.total_user_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorPage;
