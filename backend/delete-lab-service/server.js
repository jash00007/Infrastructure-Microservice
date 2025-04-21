const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// GET all labs (for dropdown in frontend)
app.get('/delete-lab', async (req, res) => {
  try {
    const [labs] = await pool.promise().query('SELECT id, name FROM labs');
    res.json(labs);
  } catch (err) {
    console.error('Error fetching labs:', err);
    res.status(500).send('Failed to fetch labs');
  }
});

// DELETE lab and update resources
app.delete('/delete/:labId', async (req, res) => {
  const labId = parseInt(req.params.labId);
  const conn = await pool.promise().getConnection();

  try {
    await conn.beginTransaction();

    const [labResults] = await conn.query('SELECT * FROM labs WHERE id = ?', [labId]);
    if (labResults.length === 0) {
      conn.release();
      return res.status(404).send('Lab not found');
    }

    const [allocations] = await conn.query(
      'SELECT server_id, cpu_allocated, memory_allocated, disk_allocated FROM lab_server WHERE lab_id = ?',
      [labId]
    );

    for (const alloc of allocations) {
      const [serverRows] = await conn.query('SELECT * FROM servers WHERE id = ?', [alloc.server_id]);
      const server = serverRows[0];

      const newCpu = Math.max(server.cpu_usage - alloc.cpu_allocated, 0);
      const newMemory = Math.max(server.memory_usage - alloc.memory_allocated, 0);
      const newDisk = Math.max(server.disk_usage - alloc.disk_allocated, 0);

      console.log(`Server ${server.id} usage BEFORE: CPU ${server.cpu_usage}, MEM ${server.memory_usage}, DISK ${server.disk_usage}`);
      console.log(`Deallocating: CPU ${alloc.cpu_allocated}, MEM ${alloc.memory_allocated}, DISK ${alloc.disk_allocated}`);
      console.log(`Server ${server.id} usage AFTER:  CPU ${newCpu}, MEM ${newMemory}, DISK ${newDisk}`);

      await conn.query(
        `UPDATE servers SET 
          cpu_usage = ?, 
          memory_usage = ?, 
          disk_usage = ? 
        WHERE id = ?`,
        [newCpu, newMemory, newDisk, alloc.server_id]
      );
    }

    await conn.query('DELETE FROM lab_server WHERE lab_id = ?', [labId]);
    await conn.query(
      'UPDATE lab_access_log SET is_active = FALSE WHERE lab_id = ?',
      [labId]
    );
    await conn.query('DELETE FROM labs WHERE id = ?', [labId]);

    await conn.commit();
    res.send({ message: 'Lab deleted and server resources freed' });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting lab:', err);
    res.status(500).send('Internal server error');
  } finally {
    conn.release();
  }
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Delete lab service running on port ${PORT}`);
});
