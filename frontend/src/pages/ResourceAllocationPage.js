import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function ResourceAllocationPage() {
  const [labs, setLabs] = useState([]);
  const [servers, setServers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [newServer, setNewServer] = useState({ ip_address: '', max_cpu: '', max_memory: '', max_disk: '' });
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [labScaling, setLabScaling] = useState({
    estimated_users: '',
    per_user_cpu: '',
    per_user_memory: '',
    per_user_disk: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [labsRes, serversRes, allocationsRes] = await Promise.all([
      axios.get(`${config.RESOURCE_URL}/labs`),
      axios.get(`${config.RESOURCE_URL}/servers`),
      axios.get(`${config.RESOURCE_URL}/allocations`)
    ]);
    setLabs(labsRes.data);
    setServers(serversRes.data);
    setAllocations(allocationsRes.data);
  };

  const handleAddServer = async () => {
    try {
      await axios.post(`${config.RESOURCE_URL}/servers`, {
        ip_address: newServer.ip_address,
        max_cpu: Number(newServer.max_cpu),
        max_memory: Number(newServer.max_memory),
        max_disk: Number(newServer.max_disk),
      });
      setNewServer({ ip_address: '', max_cpu: '', max_memory: '', max_disk: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add server', err);
    }
  };

  const handleAllocate = async () => {
    fetchData();
  };

  const handleScaleLab = async () => {
    if (!selectedLabId) return;

    const {
      per_user_cpu,
      per_user_memory,
      per_user_disk,
      estimated_users
    } = labScaling;

    try {
      await axios.patch(`${config.RESOURCE_URL}/labs/${selectedLabId}`, {
        per_user_cpu: Number(per_user_cpu),
        per_user_memory: Number(per_user_memory),
        per_user_disk: Number(per_user_disk),
        estimated_users: Number(estimated_users),
      });

      await handleAllocate();
      await fetchData();
    } catch (err) {
      console.error('Failed to scale lab and reallocate', err);
    }
  };

  const sectionStyle = {
    marginBottom: '2rem',
    padding: '1.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f9f9f9'
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const tableCell = {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: "#ffffff"
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
        Lab Infrastructure Manager
      </h1>

      {/* Add Server */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Add New Server</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['ip_address', 'max_cpu', 'max_memory', 'max_disk'].map(key => (
            <input
              key={key}
              type={key === 'ip_address' ? 'text' : 'number'}
              placeholder={key.replace(/_/g, ' ').toUpperCase()}
              value={newServer[key]}
              onChange={e => setNewServer({ ...newServer, [key]: e.target.value })}
              style={{ ...inputStyle, flex: '1 0 200px' }}
            />
          ))}
        </div>
        <button onClick={handleAddServer} style={buttonStyle}>Add Server</button>
      </section>

      {/* Select Lab */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Select a Lab to Scale</h2>
        <select
          onChange={e => setSelectedLabId(e.target.value)}
          value={selectedLabId || ''}
          style={{ ...inputStyle, maxWidth: '300px' }}
        >
          <option value="">-- Select a Lab --</option>
          {labs.map(lab => (
            <option key={lab.id} value={lab.id}>{lab.name}</option>
          ))}
        </select>
      </section>

      {/* Scale Lab */}
      {selectedLabId && (
        <section style={{ ...sectionStyle, backgroundColor: '#fffbea' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Scale Lab Resources</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {['estimated_users', 'per_user_cpu', 'per_user_memory', 'per_user_disk'].map(key => (
              <div key={key} style={{ flex: '1 0 200px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>{key.replace(/_/g, ' ')}</label>
                <input
                  type="number"
                  value={labScaling[key] || ''}
                  onChange={e => setLabScaling({ ...labScaling, [key]: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <button onClick={handleScaleLab} style={{ ...buttonStyle, backgroundColor: '#ca8a04' }}>
            Scale & Reallocate
          </button>
        </section>
      )}

      {/* Labs Overview */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Current Labs</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f7f7f7' }}>
            <tr>
              <th style={tableCell}>Lab Name</th>
              <th style={tableCell}>Estimated Users</th>
              <th style={tableCell}>CPU/user</th>
              <th style={tableCell}>Memory/user</th>
              <th style={tableCell}>Disk/user</th>
            </tr>
          </thead>
          <tbody>
            {labs.map(lab => (
              <tr key={lab.id}>
                <td style={tableCell}>{lab.name}</td>
                <td style={tableCell}>{lab.estimated_users}</td>
                <td style={tableCell}>{lab.estimated_cpu}</td>
                <td style={tableCell}>{lab.estimated_memory}</td>
                <td style={tableCell}>{lab.estimated_disk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Allocations */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Lab-Server Allocations</h2>
        <ul style={{ paddingLeft: '1rem' }}>
          {allocations.map(alloc => (
            <li key={alloc.id} style={{ marginBottom: '4px' }}>
              Lab <strong>{alloc.lab_name}</strong> → Server <strong>{alloc.server_id}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* Server Load */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Current Server Load</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f0f0f0' }}>
            <tr>
              <th style={tableCell}>Server ID</th>
              <th style={tableCell}>IP Address</th>
              <th style={tableCell}>CPU Usage</th>
              <th style={tableCell}>Memory Usage</th>
              <th style={tableCell}>Disk Usage</th>
            </tr>
          </thead>
          <tbody>
            {servers.map(server => (
              <tr key={server.id}>
                <td style={tableCell}>{server.id}</td>
                <td style={tableCell}>{server.ip_address}</td>
                <td style={tableCell}>{server.cpu_usage} / {server.max_cpu}</td>
                <td style={tableCell}>{server.memory_usage} / {server.max_memory}</td>
                <td style={tableCell}>{server.disk_usage} / {server.max_disk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ResourceAllocationPage;
