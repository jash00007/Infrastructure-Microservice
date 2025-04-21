import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeleteLabPage = () => {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3002/delete-lab')
      .then(res => setLabs(res.data))
      .catch(err => console.error("Failed to fetch labs:", err));
  }, []);

  const handleDelete = async () => {
    if (!labId) return alert('Please select a lab to delete');
    try {
      await axios.delete(`http://localhost:3002/delete/${labId}`);
      alert('Lab deleted');
      setLabs(labs.filter(lab => lab.id !== labId)); // remove from dropdown
      setLabId('');
    } catch (err) {
      console.error(err);
      alert('Failed to delete lab');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', marginBottom: '1rem' }}>Delete Lab</h2>

      <div style={{ marginBottom: '1rem' }}>
        <select
          value={labId}
          onChange={e => setLabId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="">Select a lab</option>
          {labs.map(lab => (
            <option key={lab.id} value={lab.id}>{lab.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleDelete}
        style={{
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '10px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Delete Lab
      </button>
    </div>
  );
};

export default DeleteLabPage;
