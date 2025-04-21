const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

function getAvailable(server) {
  return {
    cpu: server.max_cpu - server.cpu_usage,
    memory: server.max_memory - server.memory_usage,
    disk: server.max_disk - server.disk_usage
  };
}

app.get('/labs', (req, res) => {
  pool.query('SELECT * FROM labs', (err, results) => {
    if (err) {
      console.error('Error fetching labs:', err);
      return res.status(500).send(err);
    }
    res.send(results);
  });
});

app.get('/servers', (req, res) => {
  pool.query('SELECT * FROM servers', (err, results) => {
    if (err) {
      console.error('Error fetching servers:', err);
      return res.status(500).send(err);
    }
    res.send(results);
  });
});

app.get('/allocations', (req, res) => {
  const sql = `SELECT ls.id, l.name AS lab_name, s.id AS server_id
               FROM lab_server ls
               JOIN labs l ON ls.lab_id = l.id
               JOIN servers s ON ls.server_id = s.id`;
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching allocations:', err);
      return res.status(500).send(err);
    }
    res.send(results);
  });
});

app.post('/servers', (req, res) => {
  const { ip_address, max_cpu, max_memory, max_disk } = req.body;
  console.log('Adding new server:', req.body);
  
  if (!ip_address || !max_cpu || !max_memory || !max_disk) {
    return res.status(400).send('Missing required fields');
  }

  pool.query(
    'INSERT INTO servers (ip_address, max_cpu, memory_usage, max_memory, disk_usage, max_disk, cpu_usage) VALUES (?, ?, 0, ?, 0, ?, 0)',
    [ip_address, max_cpu, max_memory, max_disk],
    (err, result) => {
      if (err) {
        console.error('Error adding server:', err);
        return res.status(500).send(err);
      }
      res.send({ message: 'Server added', serverId: result.insertId });
    }
  );
});

app.patch('/labs/:id', (req, res) => {
  const labId = req.params.id;
  const { per_user_cpu, per_user_memory, per_user_disk, estimated_users } = req.body;

  pool.query('SELECT * FROM labs WHERE id = ?', [labId], (err, labResults) => {
    if (err || labResults.length === 0) return res.status(500).send('Lab not found');

    // Step 1: Update lab info
    pool.query(
      'UPDATE labs SET estimated_cpu=?, estimated_memory=?, estimated_disk=?, estimated_users=? WHERE id=?',
      [per_user_cpu, per_user_memory, per_user_disk, estimated_users, labId],
      (err) => {
        if (err) return res.status(500).send('Error updating lab');

        // Step 2: Fetch old allocations
        pool.query('SELECT * FROM lab_server WHERE lab_id = ?', [labId], (err, allocations) => {
          if (err) return res.status(500).send('Error fetching old allocations');

          // Step 3: Revert old server usages
          const revertTasks = allocations.map(alloc => {
            return new Promise((resolve, reject) => {
              pool.query(
                'UPDATE servers SET cpu_usage = cpu_usage - ?, memory_usage = memory_usage - ?, disk_usage = disk_usage - ? WHERE id = ?',
                [alloc.cpu_allocated, alloc.memory_allocated, alloc.disk_allocated, alloc.server_id],
                (err) => err ? reject(err) : resolve()
              );
            });
          });

          Promise.all(revertTasks).then(() => {
            // Step 4: Delete old lab_server entries
            pool.query('DELETE FROM lab_server WHERE lab_id = ?', [labId], (err) => {
              if (err) return res.status(500).send('Error deleting old lab_server rows');

              // Step 5: Allocate new resources
              pool.query('SELECT * FROM servers', (err, servers) => {
                if (err) return res.status(500).send('Error fetching servers');

                let cpuLeft = estimated_users * per_user_cpu;
                let memLeft = estimated_users * per_user_memory;
                let diskLeft = estimated_users * per_user_disk;

                const allocs = [];

                for (let s of servers) {
                  if (cpuLeft <= 0 && memLeft <= 0 && diskLeft <= 0) break;

                  const availCPU = Math.max(0, s.max_cpu - s.cpu_usage);
                  const availMem = Math.max(0, s.max_memory - s.memory_usage);
                  const availDisk = Math.max(0, s.max_disk - s.disk_usage);

                  // ✅ Ensure integer values
                  const cpuToAlloc = Math.floor(Math.min(cpuLeft, availCPU));
                  const memToAlloc = Math.floor(Math.min(memLeft, availMem));
                  const diskToAlloc = Math.floor(Math.min(diskLeft, availDisk));

                  if (cpuToAlloc > 0 || memToAlloc > 0 || diskToAlloc > 0) {
                    allocs.push({ server_id: s.id, cpu: cpuToAlloc, memory: memToAlloc, disk: diskToAlloc });
                    cpuLeft -= cpuToAlloc;
                    memLeft -= memToAlloc;
                    diskLeft -= diskToAlloc;
                  }
                }

                if (cpuLeft > 0 || memLeft > 0 || diskLeft > 0) {
                  return res.status(400).send('Not enough server capacity for scaling');
                }

                // Step 6: Apply new allocations
                const applyTasks = allocs.map(a => {
                  return new Promise((resolve, reject) => {
                    pool.query(
                      'INSERT INTO lab_server (lab_id, server_id, cpu_allocated, memory_allocated, disk_allocated) VALUES (?, ?, ?, ?, ?)',
                      [labId, a.server_id, a.cpu, a.memory, a.disk],
                      (err) => {
                        if (err) return reject(err);
                        pool.query(
                          'UPDATE servers SET cpu_usage = cpu_usage + ?, memory_usage = memory_usage + ?, disk_usage = disk_usage + ? WHERE id = ?',
                          [a.cpu, a.memory, a.disk, a.server_id],
                          (err) => err ? reject(err) : resolve()
                        );
                      }
                    );
                  });
                });

                Promise.all(applyTasks)
                  .then(() => res.send({ message: `Lab ${labId} scaled and updated successfully.` }))
                  .catch(err => {
                    console.error('Error applying new allocations:', err);
                    res.status(500).send('Failed during allocation');
                  });
              });
            });
          }).catch(err => {
            console.error('Error reverting previous allocations:', err);
            res.status(500).send('Failed during revert');
          });
        });
      }
    );
  });
});

// Optional: Deduplicate lab_server entries (you should run this in MySQL once to clean up)
app.get('/fix-lab-server-duplicates', (req, res) => {
  const query = `
    DELETE ls1 FROM lab_server ls1
    JOIN lab_server ls2
    ON ls1.lab_id = ls2.lab_id AND ls1.server_id = ls2.server_id AND ls1.id > ls2.id;
  `;

  pool.query(query, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error removing duplicates');
    }

    pool.query('ALTER TABLE lab_server ADD UNIQUE KEY unique_lab_server (lab_id, server_id)', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Could not enforce unique constraint');
      }

      res.send('Duplicates removed and unique constraint added.');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.listen(PORT, () => console.log(`Resource Allocation Service running on port ${PORT}`));
