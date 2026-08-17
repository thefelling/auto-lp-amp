const express = require('express');
const { authenticate } = require('../middleware/auth');
const pool = require('../db');
const { scrapeWebsite } = require('../modules/scraper');
const { sendTelegramLog } = require('../modules/logger');

const router = express.Router();

// === CREATE TEMPLATE FROM URL ===
router.post('/scrape', authenticate, async (req, res, next) => {
  try {
    const { name, url } = req.body;
    const userId = req.user.id;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL required' });
    }
    
    const scrapedData = await scrapeWebsite(url);
    
    const result = await pool.query(`
      INSERT INTO templates (user_id, name, source_url, html_structure, css_content, layout_config)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, source_url
    `, [
      userId,
      name,
      url,
      scrapedData.layout.content || scrapedData.html,
      scrapedData.inlineStyles || '',
      JSON.stringify(scrapedData.layout)
    ]);
    
    await sendTelegramLog(`📁 Template created\nUser: ${req.user.username}\nName: ${name}\nSource: ${url}`);
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    next(error);
  }
});

// === GET ALL TEMPLATES ===
router.get('/list', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT id, name, source_url, is_default, created_at
      FROM templates
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json(result.rows);
    
  } catch (error) {
    next(error);
  }
});

// === DELETE TEMPLATE ===
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await pool.query('DELETE FROM templates WHERE id = $1 AND user_id = $2', [id, userId]);
    
    res.json({ message: 'Template deleted' });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;