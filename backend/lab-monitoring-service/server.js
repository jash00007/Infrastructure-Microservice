// lab-monitoring-service/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// MySQL connection pool using .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

app.get('/monitor/labs', async (req, res) => {
  try {
    const [labs] = await pool.promise().query('SELECT id, name FROM labs');
    res.json(labs);
  } catch (err) {
    console.error('Error fetching labs:', err);
    res.status(500).send('Failed to fetch labs');
  }
});  

// Simulate lab usage
app.post('/simulate/:labId', (req, res) => {
  const labId = parseInt(req.params.labId);
  const { active_users, duration_minutes } = req.body;

  pool.query('SELECT * FROM labs WHERE id = ?', [labId], (err, labs) => {
    if (err || labs.length === 0) return res.status(404).send('Lab not found');

    const lab = labs[0];

    // 👇 Now that we have `lab`, calculate factor correctly
    const timeFactor = duration_minutes / 10;
    const factor = (active_users * timeFactor) / lab.estimated_users;

    const cpu = lab.estimated_cpu * factor;
    const memory = lab.estimated_memory * factor;
    const disk = lab.estimated_disk * factor;

    // Insert lab usage log
    pool.query(
      `INSERT INTO lab_access_log (lab_id, accessed_at, duration_minutes, user_count)
      VALUES (?, NOW(), ?, ?)`,
      [labId, duration_minutes, active_users],
      insertErr => {
        if (insertErr) {
          console.error('Error inserting lab access log:', insertErr);
          return res.status(500).send(insertErr);
        }

        console.log('Usage simulated for lab', labId);

        // Update average utilization
        pool.query(
          `UPDATE labs 
          SET avg_users = (SELECT AVG(user_count) FROM lab_access_log WHERE lab_id = ?),
              avg_time = (SELECT AVG(duration_minutes) FROM lab_access_log WHERE lab_id = ?)
          WHERE id = ?`,
          [labId, labId, labId],
          updateErr => {
            if (updateErr) {
              console.error('Error updating lab utilization:', updateErr);
              return res.status(500).send(updateErr);
            }
            console.log('Lab utilization updated for lab', labId);
          }
        );

        // Update popular metrics
        pool.query(
          `UPDATE labs 
          SET total_sessions = (SELECT COUNT(*) FROM lab_access_log WHERE lab_id = ?),
              total_user_minutes = (SELECT SUM(duration_minutes * user_count) FROM lab_access_log WHERE lab_id = ?)
          WHERE id = ?`,
          [labId, labId, labId],
          popularLabsErr => {
            if (popularLabsErr) {
              console.error('Error updating popular labs metrics:', popularLabsErr);
              return res.status(500).send(popularLabsErr);
            }
            console.log('Popular labs updated for lab', labId);

            res.send({
              message: 'Usage simulated and metrics updated',
              usage: {
                cpu: cpu.toFixed(2),
                memory: memory.toFixed(2),
                disk: disk.toFixed(2)
              }
            });
          }
        );
      }
    );
  });
});

// Get average usage stats for a lab
app.get('/usage/:labId', (req, res) => {
  const labId = parseInt(req.params.labId);

  pool.query(
    `SELECT AVG(user_count) as avg_users, AVG(duration_minutes) as avg_time
     FROM lab_access_log WHERE lab_id = ?`,
    [labId],
    (err, stats) => {
      if (err) return res.status(500).send(err);
      res.json(stats[0]);
    }
  );
});

app.get('/monitor/labs/over-under-utilized', (req, res) => {
  pool.query(`
    SELECT 
      l.id, 
      l.name, 
      l.estimated_users,
      COALESCE(AVG(a.user_count), 0) AS avg_users,
      COALESCE(AVG(a.duration_minutes), 0) AS avg_time
    FROM labs l
    LEFT JOIN lab_access_log a ON l.id = a.lab_id
    GROUP BY l.id, l.name, l.estimated_users
  `, (err, results) => {
    if (err) return res.status(500).send(err);

    const thresholds = { upper: 1.25, lower: 0.75 };

    const analysis = results.map(row => {
      const avgUsers = Number(row.avg_users);
      const avgTime = Number(row.avg_time);
      const estimatedUsers = row.estimated_users;

      // Normalize time-aware usage to 10-minute basis
      const normalizedUsage = avgUsers * (avgTime / 10);
      const expectedUsage = estimatedUsers; // assumed per 10 minutes

      const ratio = normalizedUsage / expectedUsage;

      let status = 'normal';
      if (ratio > thresholds.upper) status = 'over-utilized';
      else if (ratio < thresholds.lower) status = 'under-utilized';

      return {
        lab_id: row.id,
        name: row.name,
        estimated_users: estimatedUsers,
        avg_users: Number.isFinite(avgUsers) ? parseFloat(avgUsers.toFixed(2)) : null,
        avg_time: Number.isFinite(avgTime) ? parseFloat(avgTime.toFixed(2)) : null,
        normalized_usage: parseFloat(normalizedUsage.toFixed(2)),
        ratio: parseFloat(ratio.toFixed(2)),
        status
      };
    });

    res.json(analysis);
  });
});

// GET /monitor/labs/popular
app.get('/monitor/labs/popular', (req, res) => {
  pool.query(`
    SELECT l.id, l.name,
           COUNT(a.id) AS total_sessions,
           COALESCE(SUM(a.duration_minutes * a.user_count), 0) AS total_user_minutes
    FROM labs l
    LEFT JOIN lab_access_log a ON l.id = a.lab_id
    GROUP BY l.id, l.name
    ORDER BY total_user_minutes DESC
  `, (err, results) => {
    if (err) return res.status(500).send(err);

    res.json(results.map(row => ({
      lab_id: row.id,
      name: row.name,
      total_sessions: row.total_sessions,
      total_user_minutes: row.total_user_minutes || 0
    })));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Lab Monitoring Service running at http://localhost:${PORT}`);
});
