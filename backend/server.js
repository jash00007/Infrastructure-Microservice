// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use a connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ✅ Log MySQL connection status once
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Failed to connect to MySQL:', err);
  } else {
    console.log('Connected to MySQL!');
    connection.release();
  }
});

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function simulateServerLoad(labs) {
  let cpu = getRandom(5, 15);
  let mem = getRandom(10, 20);
  let disk = getRandom(5, 10);

  for (const lab of labs) {
    if (lab.status === 'active') {
      if (lab.name.toLowerCase().includes('heap') || lab.name.toLowerCase().includes('cpu')) {
        cpu += getRandom(20, 30);
      } else if (lab.name.toLowerCase().includes('memory') || lab.name.toLowerCase().includes('paging')) {
        mem += getRandom(25, 35);
      } else {
        cpu += getRandom(10, 15);
        mem += getRandom(10, 20);
      }
      disk += getRandom(3, 6);
    }
  }

  return {
    cpu: Math.min(cpu, 100),
    memory: Math.min(mem, 100),
    disk: Math.min(disk, 100)
  };
}

function updateServerStats() {
  pool.query('SELECT * FROM servers', (err, servers) => {
    if (err) return console.error('Failed to fetch servers:', err);

    servers.forEach(server => {
      pool.query(`
        SELECT labs.name, labs.status 
        FROM labs 
        JOIN lab_server ON labs.id = lab_server.lab_id 
        WHERE lab_server.server_id = ?
      `, [server.id], (err, labs) => {
        if (err) return console.error('Failed to get labs for server', server.id, err);

        const activeLabs = labs.filter(lab => lab.status === 'active');
        if (activeLabs.length === 0) return;

        const usage = simulateServerLoad(activeLabs);

        // Update current usage
        pool.query(`
          UPDATE servers SET 
            cpu_usage = ?, 
            memory_usage = ?, 
            disk_usage = ? 
          WHERE id = ?
        `, [usage.cpu, usage.memory, usage.disk, server.id], err => {
          if (err) console.error(`Failed to update server ${server.id}:`, err);
        });

        // Insert into stats history
        pool.query(`
          INSERT INTO server_stats (server_id, cpu_usage, memory_usage, disk_usage, recorded_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [server.id, usage.cpu, usage.memory, usage.disk], err => {
          if (err) console.error(`Failed to insert stats for server ${server.id}:`, err);
        });
      });
    });
  });
}

// ✅ Run on startup + schedule periodic updates
updateServerStats();
setInterval(updateServerStats, 0.5 * 60 * 1000); // every 30 seconds

// Example routes
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/api/servers/:id/stats', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM server_stats WHERE server_id = ?', [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
