// backend/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) return console.error('DB Error:', err);
  console.log('Connected to MySQL');
});

// Example route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Example: Get server stats
app.get('/api/servers/:id/stats', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM server_stats WHERE server_id = ?', [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
