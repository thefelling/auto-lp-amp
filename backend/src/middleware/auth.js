const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_me';

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // === IF MASTER: ambil UUID dari database pake MASTER_USERNAME dari ENV ===
    if (decoded.id === 'master' || decoded.role === 'master') {
      const masterUsername = process.env.MASTER_USERNAME;
      
      if (!masterUsername) {
        console.error('❌ MASTER_USERNAME not set in environment!');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Cari user master di database
      const masterResult = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1 AND role = $2',
        [masterUsername, 'master']
      );

      if (masterResult.rows.length === 0) {
        // Fallback: kalo ga nemu master di DB, pake 'master' sebagai ID
        console.warn('⚠️ Master user not found in database, using fallback');
        req.user = {
          id: 'master',
          username: masterUsername,
          role: 'master'
        };
        return next();
      }

      // Pake UUID dari database
      req.user = {
        id: masterResult.rows[0].id,
        username: masterResult.rows[0].username,
        role: 'master'
      };
      return next();
    }

    // === SUB-USER ===
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
    
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isMaster = (req, res, next) => {
  if (req.user?.role !== 'master') {
    return res.status(403).json({ error: 'Master access required' });
  }
  next();
};

module.exports = { authenticate, isMaster };