// pages/DeleteLabPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeleteLabPage = () => {
  const [labs, setLabs] = useState([]);
  const [labId, setLabId] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3002/delete-lab').then(res => setLabs(res.data));
  }, []);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3002/delete/${labId}`);
      alert('Lab deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete lab');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Delete Lab</h2>
      <select onChange={e => setLabId(e.target.value)} className="border p-2 mb-4 w-full">
        <option value="">Select a lab</option>
        {labs.map(lab => (
          <option key={lab.id} value={lab.id}>{lab.name}</option>
        ))}
      </select>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete Lab</button>
    </div>
  );
};

export default DeleteLabPage;
