import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PerformancePage = () => {
  const [serverStats, setServerStats] = useState([]);
  const [peakTimes, setPeakTimes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3004/performance/servers/stats`)
      .then(async (response) => {
        const stats = response.data;
        setServerStats(stats);
        const serverIds = [...new Set(stats.map(stat => stat.server_id))];
        const peakData = {};
        for (const id of serverIds) {
          try {
            const res = await axios.get(`http://localhost:3004/performance/servers/${id}/peaks`);
            peakData[id] = res.data;
          } catch (err) {
            console.error(`Error fetching peaks for server ${id}`, err);
            peakData[id] = [];
          }
        }
        setPeakTimes(peakData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching server stats:', err);
        setLoading(false);
      });
  }, []);

  const formatStatsForChart = (stats) => {
    const sorted = [...stats].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const labels = sorted.map(stat => {
      const date = new Date(stat.recorded_at);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    });

    const cpuData = sorted.map(stat => stat.cpu_usage);
    const memoryData = sorted.map(stat => stat.memory_usage);
    const diskData = sorted.map(stat => stat.disk_usage);

    return {
      labels,
      datasets: [
        {
          label: 'CPU Usage',
          data: cpuData,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          fill: true,
        },
        {
          label: 'Memory Usage',
          data: memoryData,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          fill: true,
        },
        {
          label: 'Disk Usage',
          data: diskData,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          fill: true,
        }
      ]
    };
  };

  const groupStatsByServer = (stats) => {
    return stats.reduce((acc, stat) => {
      if (!acc[stat.server_id]) acc[stat.server_id] = [];
      acc[stat.server_id].push(stat);
      return acc;
    }, {});
  };

  const groupedStats = groupStatsByServer(serverStats);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>
        All Server Performance
      </h1>

      {loading ? (
        <p style={{ fontSize: '16px', textAlign: 'center' }}>Loading performance data...</p>
      ) : (
        Object.entries(groupedStats).map(([serverId, stats]) => (
          <div key={serverId} style={{ marginBottom: '64px', padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>
              Server #{serverId}
            </h2>

            <Line data={formatStatsForChart(stats)} />

            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Peak Access Times</h3>

              {peakTimes[serverId] && peakTimes[serverId].length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Time</th>
                      <th style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Total Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakTimes[serverId].map((peak, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #eee', padding: '10px' }}>{peak.time}</td>
                        <td style={{ border: '1px solid #eee', padding: '10px' }}>{peak.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No peak times available.</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PerformancePage;
