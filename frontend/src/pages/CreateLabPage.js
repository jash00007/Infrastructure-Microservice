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
      alert(err?.response?.data?.message || 'Error creating lab');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '30px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>
          Create New Lab
        </h2>

        {['name', 'estimated_users', 'estimated_cpu', 'estimated_memory', 'estimated_disk'].map(field => (
          <div key={field} style={{ marginBottom: '20px' }}>
            <label
              htmlFor={field}
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}
            >
              {field.replace(/_/g, ' ').toUpperCase()}
            </label>
            <input
              type={field === 'name' ? 'text' : 'number'}
              name={field}
              value={form[field]}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: '20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Create Lab
        </button>
      </form>
    </div>
  );
};

export default CreateLabPage;
