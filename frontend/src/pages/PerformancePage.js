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
import { useParams } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PerformancePage = () => {
  const { id } = useParams(); // Server ID from URL
  const [serverStats, setServerStats] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `http://localhost:3004/performance/servers${id ? `/${id}` : ''}/stats`;

    // Fetch server stats (all or single)
    axios.get(url)
      .then(response => {
        setServerStats(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching server stats:', err);
        setLoading(false);
      });

    // Fetch peak access times for a specific server
    if (id) {
      axios.get(`http://localhost:3004/performance/servers/${id}/peaks`)
        .then(response => {
          setPeakTimes(response.data);
        })
        .catch(err => {
          console.error('Error fetching peak times:', err);
        });
    }
  }, [id]);

  const formatStatsForChart = (stats) => {
    const sorted = [...stats].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const labels = sorted.map(stat => stat.recorded_at);
    const cpuData = sorted.map(stat => stat.cpu_usage);
    const memoryData = sorted.map(stat => stat.memory_usage);
    const diskData = sorted.map(stat => stat.disk_usage);

    return {
      labels,
      datasets: [
        {
          label: 'CPU Usage',
          data: cpuData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
        },
        {
          label: 'Memory Usage',
          data: memoryData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
        },
        {
          label: 'Disk Usage',
          data: diskData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
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

  return (
    <div className="performance-page" style={{ padding: '20px' }}>
      <h1>Server Performance</h1>

      {loading ? (
        <p>Loading server performance data...</p>
      ) : (
        <div>
          {/* View for all servers */}
          {!id ? (
            <>
              <h2>All Server Stats</h2>
              {Object.entries(groupStatsByServer(serverStats)).map(([serverId, stats]) => (
                <div key={serverId} style={{ marginBottom: '40px' }}>
                  <h3>Server ID: {serverId}</h3>
                  <Line data={formatStatsForChart(stats)} />
                </div>
              ))}
            </>
          ) : (
            <>
              {/* View for a single server */}
              <h2>Server Usage Over Time</h2>
              <Line data={formatStatsForChart(serverStats)} />

              <h2>Peak Access Times</h2>
              {peakTimes.length > 0 ? (
                <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #ccc', padding: '8px' }}>Time</th>
                      <th style={{ border: '1px solid #ccc', padding: '8px' }}>Total Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakTimes.map((peak, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{peak.time}</td>
                        <td style={{ border: '1px solid #ccc', padding: '8px' }}>{peak.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No peak times available.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformancePage;
