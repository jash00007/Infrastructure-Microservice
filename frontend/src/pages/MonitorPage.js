import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MonitorPage = () => {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('');
  const [activeUsers, setActiveUsers] = useState('');
  const [duration, setDuration] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  const [utilizationData, setUtilizationData] = useState([]);
  const [popularLabs, setPopularLabs] = useState([]);

  useEffect(() => {
    // Fetch lab list
    axios.get('http://localhost:3003/monitor/labs') // assuming your lab-service runs here
      .then(res => setLabs(res.data))
      .catch(err => console.error("Error fetching labs:", err));

    // Fetch monitoring data
    fetchMonitoringData();
  }, []);

  const fetchMonitoringData = () => {
    // Fetch monitoring data (lab utilization and popular labs)
    axios.get('http://localhost:3003/monitor/labs/over-under-utilized')
      .then(res => setUtilizationData(res.data))
      .catch(err => console.error("Error fetching utilization data:", err));

    axios.get('http://localhost:3003/monitor/labs/popular')
      .then(res => setPopularLabs(res.data))
      .catch(err => console.error("Error fetching popular labs:", err));
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://localhost:3003/simulate/${labId}`, {
        active_users: Number(activeUsers),
        duration_minutes: Number(duration)
      });

      setSimulationResult(res.data.usage);
      
      // After simulation, fetch updated utilization and popular labs data
      fetchMonitoringData();
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📊 Lab Monitoring Dashboard</h2>

      <form onSubmit={handleSimulate} style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <h3>🧪 Simulate Lab Usage</h3>
        <label>
          Select Lab:
          <select value={labId} onChange={e => setLabId(e.target.value)} required>
            <option value="">-- Choose a lab --</option>
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name}</option>
            ))}
          </select>
        </label>
        <br /><br />
        <label>
          Active Users:
          <input
            type="number"
            value={activeUsers}
            onChange={e => setActiveUsers(e.target.value)}
            required
          />
        </label>
        <br /><br />
        <label>
          Duration (minutes):
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
          />
        </label>
        <br /><br />
        <button type="submit">Simulate</button>
      </form>

      {simulationResult && (
        <div style={{ marginBottom: '2rem' }}>
          <h4>📈 Simulated Resource Usage</h4>
          <ul>
            <li>CPU: {simulationResult.cpu}</li>
            <li>Memory: {simulationResult.memory}</li>
            <li>Disk: {simulationResult.disk}</li>
          </ul>
        </div>
      )}

      <div>
        <h3>📉 Lab Utilization</h3>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Lab</th>
              <th>Estimated Users</th>
              <th>Average Users</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {utilizationData.map(lab => (
              <tr key={lab.lab_id}>
                <td>{lab.name}</td>
                <td>{lab.estimated_users}</td>
                <td>{lab.avg_users}</td>
                <td>{lab.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3>🔥 Most Popular Labs</h3>
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Lab</th>
              <th>Total Sessions</th>
              <th>Total User Minutes</th>
            </tr>
          </thead>
          <tbody>
            {popularLabs.map(lab => (
              <tr key={lab.lab_id}>
                <td>{lab.name}</td>
                <td>{lab.total_sessions}</td>
                <td>{lab.total_user_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorPage;
