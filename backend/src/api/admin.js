const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticate, isMaster } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET ALL USERS (master only)
// ============================================
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

// ============================================
// CREATE SUB-USER (master only)
// ============================================
router.post('/users', authenticate, isMaster, async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
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

// ============================================
// UPDATE USER PASSWORD (master only) 🔥 BARU!
// ============================================
router.put('/users/:id/password', authenticate, isMaster, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Cek apakah user ada
    const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashed, id]
    );

    res.json({ 
      message: `Password updated for ${userCheck.rows[0].username}`,
      username: userCheck.rows[0].username
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE USER (master only)
// ============================================
router.delete('/users/:id', authenticate, isMaster, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cegah delete master
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length > 0 && userCheck.rows[0].role === 'master') {
      return res.status(403).json({ error: 'Cannot delete master account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;