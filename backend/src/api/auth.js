const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check master
    if (username === process.env.MASTER_USERNAME && 
        password === process.env.MASTER_PASSWORD) {
      const token = jwt.sign(
        { id: 'master', role: 'master', username: process.env.MASTER_USERNAME },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({ 
        token, 
        role: 'master',
        username: process.env.MASTER_USERNAME
      });
    }

    // Check sub-user
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    next(error);
  }
});

module.exports = router;