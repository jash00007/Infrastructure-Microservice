// pages/ResourceAllocationPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ResourceAllocationPage = () => {
  const [labs, setLabs] = useState([]);
  const [servers, setServers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [isAllocating, setIsAllocating] = useState(false);

  const fetchData = async () => {
    try {
      const [labsRes, serversRes, allocRes] = await Promise.all([
        axios.get('http://localhost:3005/labs'),
        axios.get('http://localhost:3005/servers'),
        axios.get('http://localhost:3005/allocations'),
      ]);
      setLabs(labsRes.data);
      setServers(serversRes.data);
      setAllocations(allocRes.data);
    } catch (err) {
      console.error('Failed to fetch resource data', err);
    }
  };

  const handleAllocate = async () => {
    if (!selectedLabId) return;
    try {
      setIsAllocating(true);
      await axios.post('http://localhost:3005/allocate', { lab_id: selectedLabId });
      await fetchData();
    } catch (err) {
      console.error('Allocation failed', err);
    } finally {
      setIsAllocating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Resource Allocation</h2>

      <div className="mb-6">
        <label className="block font-medium mb-2">Select Lab to Allocate:</label>
        <select
          onChange={e => setSelectedLabId(Number(e.target.value))}
          className="p-2 border rounded w-full max-w-md"
        >
          <option value="">-- Choose a Lab --</option>
          {labs.map(lab => (
            <option key={lab.id} value={lab.id}>
              {lab.name} (Users: {lab.estimated_users}, CPU: {lab.estimated_cpu}, RAM: {lab.estimated_memory})
            </option>
          ))}
        </select>

        <button
          onClick={handleAllocate}
          disabled={!selectedLabId || isAllocating}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isAllocating ? 'Allocating...' : 'Allocate Resources'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Servers</h3>
          {servers.map(server => (
            <div key={server.id} className="border p-4 mb-2 rounded shadow">
              <p><strong>ID:</strong> {server.id}</p>
              <p><strong>IP:</strong> {server.ip_address}</p>
              <p><strong>CPU:</strong> {server.cpu_usage?.toFixed(1)} / {server.max_cpu}</p>
              <p><strong>RAM:</strong> {server.memory_usage?.toFixed(1)} / {server.max_memory}</p>
              <p><strong>Disk:</strong> {server.disk_usage?.toFixed(1)} / {server.max_disk}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Current Lab-Server Allocations</h3>
          {allocations.map(alloc => (
            <div key={alloc.id} className="border p-4 mb-2 rounded shadow">
              <p><strong>Lab:</strong> {alloc.lab_name}</p>
              <p><strong>Server:</strong> #{alloc.server_id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocationPage;
