// pages/CreateLabPage.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateLabPage = () => {
  const [form, setForm] = useState({
    name: '',
    estimated_users: 10,
    estimated_cpu: 10,
    estimated_memory: 20,
    estimated_disk: 5
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/create-lab/create', form);
      alert('Lab created and resources allocated!');
    } catch (err) {
      console.error(err);
      alert('Error creating lab');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-xl font-bold mb-4">Create New Lab</h2>
      {['name', 'estimated_users', 'estimated_cpu', 'estimated_memory', 'estimated_disk'].map(field => (
        <div key={field} className="mb-3">
          <label className="block">{field.replace('_', ' ').toUpperCase()}</label>
          <input type="text" name={field} value={form[field]} onChange={handleChange} className="border p-2 w-full" />
        </div>
      ))}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Lab</button>
    </form>
  );
};

export default CreateLabPage;
