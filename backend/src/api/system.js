const express = require('express');
const { authenticate, isMaster } = require('../middleware/auth');
const pool = require('../db');
const { sendTelegramLog } = require('../modules/logger');

const router = express.Router();

// === CHECK BALANCE (OpenAI + Fal) ===
router.get('/balance', authenticate, isMaster, async (req, res, next) => {
  try {
    // OpenAI balance - simplified (actually needs billing API)
    const openaiBalance = await getOpenAIBalance();
    
    // Fal.ai balance - simplified
    const falBalance = await getFalBalance();
    
    res.json({
      openai: openaiBalance,
      fal: falBalance,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    next(error);
  }
});

// === GET SYSTEM LOGS ===
router.get('/logs', authenticate, isMaster, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    
    const result = await pool.query(`
      SELECT l.*, u.username
      FROM system_logs l
      LEFT JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
    
  } catch (error) {
    next(error);
  }
});

// === HEALTH CHECK ===
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

async function getOpenAIBalance() {
  // Simplified - actual implementation needs OpenAI billing API
  return { credits: 10.00, currency: 'USD' };
}

async function getFalBalance() {
  // Simplified - actual implementation needs Fal.ai API
  return { credits: 50, unit: 'credits' };
}

module.exports = router;