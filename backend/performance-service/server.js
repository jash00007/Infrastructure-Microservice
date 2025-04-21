const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const moment = require('moment');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// CORS configuration
app.use(cors());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Helper to simulate load based on access logs
function simulateLoad(estimatedCpu, estimatedMemory, estimatedDisk, estimatedUsers, userCount, duration) {
  const timeFactor = duration / 10;
  const rawFactor = (userCount * timeFactor) / (estimatedUsers || 1); // Avoid divide by 0
  const factor = Math.min(rawFactor, 3); // Cap at 3x load

  const variance = 1 + (Math.random() * 0.1 - 0.05); // ±5%

  return {
    cpu: estimatedCpu * factor * variance,
    memory: estimatedMemory * factor * variance,
    disk: estimatedDisk * factor * variance
  };
}

// Function to update stats based on access logs
function updateStats() {
  pool.query('SELECT * FROM servers', (err, servers) => {
    if (err) return console.error(err);

    servers.forEach(server => {
      // Get the labs associated with this server
      pool.query(`
        SELECT l.*, lab_server.server_id
        FROM labs l
        JOIN lab_server ON l.id = lab_server.lab_id
        WHERE lab_server.server_id = ?
      `, [server.id], (err, labs) => {
        if (err) return console.error(err);

        let totalCpu = 0, totalMem = 0, totalDisk = 0;

        labs.forEach(lab => {
          // Get the lab access logs for this lab
          pool.query(`
            SELECT * FROM lab_access_log 
            WHERE lab_id = ?
            ORDER BY accessed_at
          `, [lab.id], (err, accessLogs) => {
            if (err) return console.error(err);

            let cpuUsage = 0, memoryUsage = 0, diskUsage = 0;

            accessLogs.forEach(log => {
              const { user_count, duration_minutes } = log;
              const usage = simulateLoad(
                lab.estimated_cpu,
                lab.estimated_memory,
                lab.estimated_disk,
                lab.estimated_users,
                user_count,
                duration_minutes
              );
              
              cpuUsage += usage.cpu;
              memoryUsage += usage.memory;
              diskUsage += usage.disk;
            });

            // Ensure usage doesn't exceed server's max capacity
            totalCpu += Math.min(cpuUsage, server.max_cpu);
            totalMem += Math.min(memoryUsage, server.max_memory);
            totalDisk += Math.min(diskUsage, server.max_disk);

            // Update server stats and insert into server_stats
            pool.query(`
              UPDATE servers 
              SET cpu_usage = ?, memory_usage = ?, disk_usage = ?, last_checked = NOW()
              WHERE id = ?
            `, [totalCpu, totalMem, totalDisk, server.id]);

            pool.query(`
              INSERT INTO server_stats (server_id, cpu_usage, memory_usage, disk_usage, recorded_at)
              VALUES (?, ?, ?, ?, NOW())
            `, [server.id, totalCpu, totalMem, totalDisk]);
          });
        });
      });
    });
  });
}

// Update stats every 10 minutes
setInterval(updateStats, 10 * 60 * 1000); // every 10 mins
updateStats();

// Route to get stats for all servers
app.get('/performance/servers/stats', (req, res) => {

  pool.query('SELECT * FROM server_stats', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Route to get server stats for a specific server
app.get('/performance/servers/:id/stats', (req, res) => {
  
  const { id } = req.params;

  pool.query('SELECT * FROM server_stats WHERE server_id = ?', [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.get('/performance/servers/:id/peaks', (req, res) => {
  const { id } = req.params;
  pool.query(`
    SELECT accessed_at, SUM(user_count) AS total_users
    FROM lab_access_log
    JOIN labs ON labs.id = lab_access_log.lab_id
    JOIN lab_server ON labs.id = lab_server.lab_id
    WHERE lab_server.server_id = ?
    GROUP BY accessed_at
    ORDER BY accessed_at
  `, [id], (err, results) => {
    if (err) return res.status(500).send(err);

    const peakTimes = results.map(log => ({
      time: moment(log.accessed_at).format('YYYY-MM-DD HH:mm:ss'),
      users: log.total_users
    }));

    res.json(peakTimes);
  });
});


// Start the server on port 3004
const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Performance Service is running at http://localhost:${PORT}`);
});
