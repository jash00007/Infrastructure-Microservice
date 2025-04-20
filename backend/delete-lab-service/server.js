// delete-lab-service/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
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

  try {
    const [labResults] = await pool.promise().query('SELECT * FROM labs WHERE id = ?', [labId]);
    if (labResults.length === 0) return res.status(404).send('Lab not found');

    const lab = labResults[0];

    const [links] = await pool.promise().query('SELECT server_id FROM lab_server WHERE lab_id = ?', [labId]);

    // Update each server
    for (const link of links) {
      const [countResult] = await pool.promise().query('SELECT COUNT(*) as count FROM lab_server WHERE server_id = ?', [link.server_id]);
      const count = countResult[0].count;

      await pool.promise().query(
        `UPDATE servers SET 
          cpu_usage = cpu_usage - ?, 
          memory_usage = memory_usage - ?, 
          disk_usage = disk_usage - ? 
        WHERE id = ?`,
        [lab.estimated_cpu, lab.estimated_memory, lab.estimated_disk, link.server_id]
      );
    }

    // Delete from lab_server and labs
    await pool.promise().query('DELETE FROM lab_server WHERE lab_id = ?', [labId]);
    await pool.promise().query('DELETE FROM labs WHERE id = ?', [labId]);

    res.send({ message: 'Lab deleted and server resources freed' });
  } catch (err) {
    console.error('Error deleting lab:', err);
    res.status(500).send('Internal server error');
  }
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Delete lab service running on port ${PORT}`);
});
