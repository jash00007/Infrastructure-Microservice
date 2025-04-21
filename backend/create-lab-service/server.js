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
  host: process.env.DB_HOST,
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

app.post('/create-lab/create', (req, res) => {
  const name = req.body.name;
  const estimated_users = parseInt(req.body.estimated_users);
  const estimated_cpu = parseInt(req.body.estimated_cpu);
  const estimated_memory = parseInt(req.body.estimated_memory);
  const estimated_disk = parseInt(req.body.estimated_disk);

  if (
    !name ||
    isNaN(estimated_users) ||
    isNaN(estimated_cpu) ||
    isNaN(estimated_memory) ||
    isNaN(estimated_disk)
  ) {
    return res.status(400).send('Missing or invalid required fields');
  }

  const total_cpu = estimated_cpu * estimated_users;
  const total_memory = estimated_memory * estimated_users;
  const total_disk = estimated_disk * estimated_users;

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

      pool.query('SELECT * FROM servers', (err, servers) => {
        if (err) {
          console.error('Error fetching servers:', err);
          return res.status(500).send('Error fetching servers');
        }

        let cpuLeft = total_cpu;
        let memLeft = total_memory;
        let diskLeft = total_disk;
        const allocs = [];

        for (let s of servers) {
          if (cpuLeft <= 0 && memLeft <= 0 && diskLeft <= 0) break;

          const availableCPU = Math.max(0, s.max_cpu - s.cpu_usage);
          const availableMem = Math.max(0, s.max_memory - s.memory_usage);
          const availableDisk = Math.max(0, s.max_disk - s.disk_usage);

          const cpuToAlloc = Math.min(cpuLeft, availableCPU);
          const memToAlloc = Math.min(memLeft, availableMem);
          const diskToAlloc = Math.min(diskLeft, availableDisk);

          if (cpuToAlloc > 0 || memToAlloc > 0 || diskToAlloc > 0) {
            allocs.push({
              server_id: s.id,
              cpu: cpuToAlloc,
              memory: memToAlloc,
              disk: diskToAlloc
            });

            cpuLeft -= cpuToAlloc;
            memLeft -= memToAlloc;
            diskLeft -= diskToAlloc;
          }
        }

        if (cpuLeft > 0 || memLeft > 0 || diskLeft > 0) {
          console.error('Not enough server capacity for new lab');
          return res.status(400).send('Not enough server capacity for new lab');
        }

        function performAllocations(index = 0) {
          if (index >= allocs.length) {
            return res.send({
              message: 'Lab created and resources allocated',
              labId,
              allocations: allocs
            });
          }

          const alloc = allocs[index];
          pool.query(
            'INSERT INTO lab_server (lab_id, server_id, cpu_allocated, memory_allocated, disk_allocated) VALUES (?, ?, ?, ?, ?)',
            [labId, alloc.server_id, alloc.cpu, alloc.memory, alloc.disk],
            (err) => {
              if (err) return res.status(500).send('Error inserting lab_server row');

              pool.query(
                'UPDATE servers SET cpu_usage = cpu_usage + ?, memory_usage = memory_usage + ?, disk_usage = disk_usage + ? WHERE id = ?',
                [alloc.cpu, alloc.memory, alloc.disk, alloc.server_id],
                (err) => {
                  if (err) return res.status(500).send('Error updating server usage');
                  performAllocations(index + 1);
                }
              );
            }
          );
        }

        performAllocations();
      });
    }
  );
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Create Lab Service is running on port ${PORT}`);
});
