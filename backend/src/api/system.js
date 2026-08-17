const express = require('express');
const { authenticate, isMaster } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

router.get('/balance', authenticate, isMaster, async (req, res) => {
  res.json({
    openai: { credits: 10.00 },
    fal: { credits: 50 }
  });
});

module.exports = router;