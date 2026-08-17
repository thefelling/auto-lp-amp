const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const pool = require('../db');
const { scrapeWebsite } = require('../modules/scraper');
const { generateContent, generateDescription } = require('../modules/ai-generator');
const { generateImage } = require('../modules/image-generator');
const { transformAMP, transformLP } = require('../modules/transformer');
const { sendTelegramLog } = require('../modules/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// 1. GENERATE AMP
// ============================================
router.post('/amp/generate', authenticate, upload.single('titleFile'), async (req, res, next) => {
  try {
    const { sourceDomain, siteName, canonical, targetLink } = req.body;
    const userId = req.user.id;
    
    // 1. Parse title file
    const titleContent = req.file.buffer.toString('utf-8');
    const titles = parseTitleFile(titleContent, siteName);
    
    if (titles.length === 0) {
      return res.status(400).json({ error: 'No title found for site name: ' + siteName });
    }
    
    // 2. Ambil 1 title random
    const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
    
    // 3. Generate description dari title
    const description = await generateDescription(selectedTitle);
    
    // 4. Scrape website
    const scrapedData = await scrapeWebsite(sourceDomain);
    
    // 5. Generate hero image
    const heroImage = await generateImage({
      prompt: `Generate hero image for ${siteName}, theme: ${scrapedData.theme || 'judi online'}, style: modern, professional, with female character`,
      type: 'hero'
    });
    
    // 6. Generate logo & favicon
    const logo = await generateImage({
      prompt: `Generate logo for ${siteName}, style: modern, minimalis, warna emas dan merah`,
      type: 'logo'
    });
    const favicon = await generateImage({
      prompt: `Generate favicon for ${siteName}, simple, recognizable`,
      type: 'favicon'
    });
    
    // 7. Transform HTML (AMP)
    const html = await transformAMP({
      scrapedData,
      siteName,
      canonical,
      targetLink,
      title: selectedTitle,
      description,
      images: { hero: heroImage.url, logo: logo.url, favicon: favicon.url }
    });
    
    // 8. Save to database
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      userId, 'amp', sourceDomain, siteName, canonical, targetLink,
      JSON.stringify({ title: selectedTitle, description }),
      html,
      'ready'
    ]);
    
    const projectId = result.rows[0].id;
    
    // 9. Save title to pool (mark as used)
    await pool.query(
      'INSERT INTO title_pools (user_id, site_name, title, used_for_amp) VALUES ($1, $2, $3, TRUE)',
      [userId, siteName, selectedTitle]
    );
    
    // 10. Save assets
    await saveAssets(projectId, { hero: heroImage, logo, favicon });
    
    // 11. Telegram log
    await sendTelegramLog(`✅ AMP Generated\nUser: ${req.user.username}\nSite: ${siteName}\nTitle: ${selectedTitle}`);
    
    res.status(201).json({
      projectId,
      title: selectedTitle,
      description,
      html,
      images: { hero: heroImage.url, logo: logo.url, favicon: favicon.url }
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 2. GENERATE LP
// ============================================
router.post('/lp/generate', authenticate, upload.single('titleFile'), async (req, res, next) => {
  try {
    const {
      sourceDomain,
      siteName,
      canonical,
      ampLink,
      useAmpTitle,
      miniGameEnabled,
      miniGameType,
      miniGamePosition,
      miniGameCustomSelector
    } = req.body;
    
    const userId = req.user.id;
    let title, description, heroImage, logo, favicon;
    
    // 1. If using AMP title, fetch from latest AMP project
    if (useAmpTitle === 'true') {
      const ampProject = await pool.query(`
        SELECT config, html_content FROM projects
        WHERE user_id = $1 AND type = 'amp'
        ORDER BY created_at DESC LIMIT 1
      `, [userId]);
      
      if (ampProject.rows.length > 0) {
        const config = ampProject.rows[0].config;
        title = config.title;
        description = config.description;
        // Also fetch images from assets table
        const assets = await pool.query(
          `SELECT type, file_url FROM project_assets WHERE project_id = $1`,
          [ampProject.rows[0].id]
        );
        assets.rows.forEach(a => {
          if (a.type === 'hero') heroImage = a.file_url;
          if (a.type === 'logo') logo = a.file_url;
          if (a.type === 'favicon') favicon = a.file_url;
        });
      }
    }
    
    // 2. If no AMP title, generate fresh
    if (!title) {
      const titleContent = req.file.buffer.toString('utf-8');
      const titles = parseTitleFile(titleContent, siteName);
      if (titles.length === 0) {
        return res.status(400).json({ error: 'No title found for site name: ' + siteName });
      }
      title = titles[Math.floor(Math.random() * titles.length)];
      description = await generateDescription(title);
      
      // Generate images if not from AMP
      const scrapedData = await scrapeWebsite(sourceDomain);
      heroImage = await generateImage({ prompt: `Generate hero for ${siteName}`, type: 'hero' });
      logo = await generateImage({ prompt: `Generate logo for ${siteName}`, type: 'logo' });
      favicon = await generateImage({ prompt: `Generate favicon for ${siteName}`, type: 'favicon' });
    }
    
    // 3. Scrape source domain
    const scrapedData = await scrapeWebsite(sourceDomain);
    
    // 4. Transform HTML (LP) with mini game
    const html = await transformLP({
      scrapedData,
      siteName,
      canonical,
      ampLink,
      title,
      description,
      images: { hero: heroImage.url || heroImage, logo: logo.url || logo, favicon: favicon.url || favicon },
      miniGame: {
        enabled: miniGameEnabled === 'true',
        type: miniGameType,
        position: miniGamePosition,
        customSelector: miniGameCustomSelector
      }
    });
    
    // 5. Save to database
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status,
        mini_game_enabled, mini_game_type, mini_game_position, mini_game_custom_selector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      userId, 'landingpage', sourceDomain, siteName, canonical, ampLink,
      JSON.stringify({ title, description }),
      html,
      'ready',
      miniGameEnabled === 'true',
      miniGameType,
      miniGamePosition,
      miniGameCustomSelector
    ]);
    
    const projectId = result.rows[0].id;
    
    // 6. Save assets if newly generated
    if (!useAmpTitle) {
      await saveAssets(projectId, { hero: heroImage, logo, favicon });
    }
    
    // 7. Telegram log
    await sendTelegramLog(`✅ LP Generated\nUser: ${req.user.username}\nSite: ${siteName}\nGame: ${miniGameEnabled === 'true' ? miniGameType : 'None'}`);
    
    res.status(201).json({
      projectId,
      title,
      description,
      html,
      images: { hero: heroImage.url || heroImage, logo: logo.url || logo, favicon: favicon.url || favicon }
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 3. GET HISTORY
// ============================================
router.get('/history/:type', authenticate, async (req, res, next) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        p.id, p.type, p.source_domain, p.site_name, p.config, 
        p.status, p.created_at, p.html_content,
        array_agg(DISTINCT pa.file_url) as images,
        (SELECT title FROM title_pools WHERE id = p.title_id) as title
      FROM projects p
      LEFT JOIN project_assets pa ON pa.project_id = p.id
      WHERE p.user_id = $1 AND p.type = $2
        AND (p.site_name ILIKE $3 OR p.source_domain ILIKE $3)
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $4 OFFSET $5
    `;
    
    const result = await pool.query(query, [userId, type, `%${search}%`, limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.rows.length }
    });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 4. GET SINGLE PROJECT
// ============================================
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT p.*, 
        json_agg(DISTINCT pa.*) as assets
      FROM projects p
      LEFT JOIN project_assets pa ON pa.project_id = p.id
      WHERE p.id = $1 AND p.user_id = $2
      GROUP BY p.id
    `, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 5. DELETE PROJECT
// ============================================
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, userId]);
    
    res.json({ message: 'Project deleted successfully' });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 6. DELETE ALL HISTORY (by type)
// ============================================
router.delete('/history/all/:type', authenticate, async (req, res, next) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;
    
    await pool.query('DELETE FROM projects WHERE user_id = $1 AND type = $2', [userId, type]);
    
    res.json({ message: `All ${type} history deleted` });
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 7. DOWNLOAD ASSETS
// ============================================
router.get('/:id/download/assets', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const assets = await pool.query(`
      SELECT type, file_url FROM project_assets
      WHERE project_id = $1 AND user_id = $2
    `, [id, userId]);
    
    // Return URLs for frontend to download individually
    res.json(assets.rows);
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// 8. GET PROJECT SCRIPT (HTML)
// ============================================
router.get('/:id/script', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT html_content FROM projects WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.send(result.rows[0].html_content);
    
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseTitleFile(content, siteName) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);
  const titles = [];
  let currentSection = '';
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      currentSection = line.substring(1).trim().toLowerCase();
    } else if (currentSection === siteName.toLowerCase() && line) {
      titles.push(line);
    }
  }
  
  return titles;
}

async function saveAssets(projectId, images) {
  const entries = Object.entries(images);
  for (const [type, data] of entries) {
    if (data && data.url) {
      await pool.query(`
        INSERT INTO project_assets (project_id, type, file_url, generation_prompt)
        VALUES ($1, $2, $3, $4)
      `, [projectId, type, data.url, data.prompt || null]);
    }
  }
}

module.exports = router;