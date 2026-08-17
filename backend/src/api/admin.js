const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, isMaster } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticate, isMaster, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, username, role, created_at, last_login,
        (SELECT COUNT(*) FROM projects WHERE user_id = users.id) as project_count
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/users', authenticate, isMaster, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, 'user')
      RETURNING id, username, role, created_at
    `, [username, hashed]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    next(error);
  }
});

router.delete('/users/:id', authenticate, isMaster, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'master') {
      return res.status(403).json({ error: 'Cannot delete master account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;