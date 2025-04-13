// resource-allocation-service/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Helper to get available capacity on a server
function getAvailable(server) {
  return {
    cpu: server.max_cpu - server.cpu_usage,
    memory: server.max_memory - server.memory_usage,
    disk: server.max_disk - server.disk_usage
  };
}

// Get all labs
app.get('/labs', (req, res) => {
  pool.query('SELECT * FROM labs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Get all servers
app.get('/servers', (req, res) => {
  pool.query('SELECT * FROM servers', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Get current lab-server allocations
app.get('/allocations', (req, res) => {
  const sql = `
    SELECT ls.id, l.name AS lab_name, s.id AS server_id
    FROM lab_server ls
    JOIN labs l ON ls.lab_id = l.id
    JOIN servers s ON ls.server_id = s.id
  `;
  pool.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Logic to reallocate lab to a suitable server
function reallocateLab(lab, callback) {
  pool.query('SELECT * FROM servers', (err, servers) => {
    if (err) return callback(err);

    const suitable = servers.find(server => {
      const available = getAvailable(server);
      return (
        available.cpu >= lab.estimated_cpu &&
        available.memory >= lab.estimated_memory &&
        available.disk >= lab.estimated_disk
      );
    });

    if (!suitable) return callback(null, null); // No suitable server

    // Clear old allocation
    pool.query('DELETE FROM lab_server WHERE lab_id = ?', [lab.id], err => {
      if (err) return callback(err);

      // Set new allocation
      pool.query('INSERT INTO lab_server (lab_id, server_id) VALUES (?, ?)', [lab.id, suitable.id], err => {
        if (err) return callback(err);

        // Update server resource usage
        pool.query(
          'UPDATE servers SET cpu_usage = cpu_usage + ?, memory_usage = memory_usage + ?, disk_usage = disk_usage + ? WHERE id = ?',
          [lab.estimated_cpu, lab.estimated_memory, lab.estimated_disk, suitable.id],
          err => {
            if (err) return callback(err);
            callback(null, suitable.id);
          }
        );
      });
    });
  });
}

// POST /allocate (used by React frontend)
app.post('/allocate', (req, res) => {
  const labId = req.body.lab_id;
  if (!labId) return res.status(400).send('Missing lab_id');

  pool.query('SELECT * FROM labs WHERE id = ?', [labId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Lab not found');
    }

    const lab = results[0];

    reallocateLab(lab, (err, newServerId) => {
      if (err) return res.status(500).send(err);
      if (!newServerId) return res.send({ message: 'No better allocation found — already optimal.' });

      res.send({ message: `Lab allocated to server ${newServerId}` });
    });
  });
});

// Optional: Reallocation via URL
app.post('/reallocate/:labId', (req, res) => {
  const labId = parseInt(req.params.labId);

  pool.query('SELECT * FROM labs WHERE id = ?', [labId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Lab not found');
    }

    const lab = results[0];

    reallocateLab(lab, (err, newServerId) => {
      if (err) return res.status(500).send(err);
      if (!newServerId) return res.send({ message: 'No better allocation found — already optimal.' });

      res.send({ message: `Reallocated to server ${newServerId}` });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Resource Allocation Service running at http://localhost:${PORT}`);
});
