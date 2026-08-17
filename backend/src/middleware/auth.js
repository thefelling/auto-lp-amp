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
    
    // If master
    if (decoded.id === 'master') {
      req.user = {
        id: 'master',
        username: decoded.username || process.env.MASTER_USERNAME,
        role: 'master'
      };
      return next();
    }

    // Check sub-user
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