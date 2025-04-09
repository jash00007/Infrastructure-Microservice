import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/servers/1/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Server Stats</h1>
      <ul>
        {stats.map((row, i) => (
          <li key={i}>
            Time: {row.recorded_at} | CPU: {row.cpu_usage}% | Mem: {row.memory_usage}% | Disk: {row.disk_usage}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
