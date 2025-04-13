// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();  // Load environment variables from .env file

// Create express app
const app = express();

// Use CORS middleware to allow cross-origin requests
app.use(cors());
app.use(express.json());

// Create MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER,     // MySQL username from .env
  password: process.env.DB_PASS, // MySQL password from .env
  database: process.env.DB_NAME  // MySQL database name from .env
});

// Function to find available servers for a new lab
function findServersForLab(cpu, memory, disk, callback) {
  pool.query('SELECT * FROM servers', (err, servers) => {
    if (err) {
      return callback(err);
    }

    const suitable = servers.filter(server =>
      (server.max_cpu - server.cpu_usage) >= cpu &&
      (server.max_memory - server.memory_usage) >= memory &&
      (server.max_disk - server.disk_usage) >= disk
    );
    callback(null, suitable);
  });
}

// API endpoint to create a new lab
app.post('/create-lab/create', (req, res) => {
  const { name, estimated_users, estimated_cpu, estimated_memory, estimated_disk } = req.body;

  // Check for missing fields
  if (!name || !estimated_users || !estimated_cpu || !estimated_memory || !estimated_disk) {
    return res.status(400).send('Missing required fields');
  }

  // Insert new lab into the database
  pool.query(
    'INSERT INTO labs (name, estimated_users, estimated_cpu, estimated_memory, estimated_disk) VALUES (?, ?, ?, ?, ?)',
    [name, estimated_users, estimated_cpu, estimated_memory, estimated_disk],
    (err, result) => {
      if (err) {
        console.error('Error inserting lab:', err);
        return res.status(500).send({ message: 'Error creating lab' });
      }

      const labId = result.insertId;
      console.log(`Lab created with ID: ${labId}`);

      // Find available servers that meet the lab's resource requirements
      findServersForLab(estimated_cpu, estimated_memory, estimated_disk, (err, availableServers) => {
        if (err) {
          console.error('Error finding available servers:', err);
          return res.status(500).send({ message: 'Error finding available servers' });
        }

        // If no suitable servers found, send error response
        if (availableServers.length === 0) {
          console.error('No suitable servers found for lab creation');
          return res.status(400).send('No suitable servers available');
        }

        // Choose the first suitable server (you can implement a better selection strategy)
        const server = availableServers[0];
        const serverId = server.id;

        // Associate lab with server in the lab_server table
        pool.query(
          'INSERT INTO lab_server (lab_id, server_id) VALUES (?, ?)',
          [labId, serverId],
          (err, result) => {
            if (err) {
              console.error('Error associating lab with server:', err);
              return res.status(500).send({ message: 'Error associating lab with server' });
            }

            // Update server resources (e.g., cpu_usage, memory_usage, disk_usage)
            pool.query(
              'UPDATE servers SET cpu_usage = cpu_usage + ?, memory_usage = memory_usage + ?, disk_usage = disk_usage + ? WHERE id = ?',
              [estimated_cpu, estimated_memory, estimated_disk, serverId],
              (err, result) => {
                if (err) {
                  console.error('Error updating server resources:', err);
                  return res.status(500).send({ message: 'Error updating server resources' });
                }

                // Return success response with labId and serverId
                res.send({
                  message: 'Lab created and server allocated',
                  labId,
                  serverId: server.id
                });
              }
            );
          }
        );
      });
    }
  );
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Create Lab Service is running on port ${PORT}`);
});
