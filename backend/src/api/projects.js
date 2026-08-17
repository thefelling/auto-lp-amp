const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const pool = require('../db');
const { scrapeWebsite } = require('../modules/scraper');
const { generateDescription, generateContent } = require('../modules/ai-generator');
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
    
    if (!sourceDomain || !siteName) {
      return res.status(400).json({ error: 'sourceDomain and siteName required' });
    }
    
    // 1. Parse title file
    const titleContent = req.file.buffer.toString('utf-8');
    const titles = parseTitleFile(titleContent, siteName);
    
    if (titles.length === 0) {
      return res.status(400).json({ error: 'No title found for site name: ' + siteName });
    }
    
    const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
    const description = await generateDescription(selectedTitle);
    const scrapedData = await scrapeWebsite(sourceDomain);
    
    // Generate images
    const heroImage = await generateImage({
      prompt: `Hero image for ${siteName}, theme: judi online, modern, elegant female character, 8k`,
      type: 'hero'
    });
    const logo = await generateImage({
      prompt: `Logo for ${siteName}, modern, minimalis, gold and red`,
      type: 'logo'
    });
    const favicon = await generateImage({
      prompt: `Favicon for ${siteName}, simple, recognizable`,
      type: 'favicon'
    });
    
    const html = await transformAMP({
      scrapedData,
      siteName,
      canonical: canonical || sourceDomain,
      targetLink: targetLink || sourceDomain,
      title: selectedTitle,
      description,
      images: { hero: heroImage.url, logo: logo.url, favicon: favicon.url }
    });
    
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      userId, 'amp', sourceDomain, siteName, canonical || sourceDomain, targetLink || sourceDomain,
      JSON.stringify({ title: selectedTitle, description }),
      html,
      'ready'
    ]);
    
    const projectId = result.rows[0].id;
    
    await saveAssets(projectId, { hero: heroImage, logo, favicon });
    await sendTelegramLog(`✅ AMP Generated\nUser: ${req.user.username}\nSite: ${siteName}`);
    
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
    
    // If using AMP title
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
      }
    }
    
    // If no AMP title, generate fresh
    if (!title) {
      const titleContent = req.file.buffer.toString('utf-8');
      const titles = parseTitleFile(titleContent, siteName);
      if (titles.length === 0) {
        return res.status(400).json({ error: 'No title found' });
      }
      title = titles[Math.floor(Math.random() * titles.length)];
      description = await generateDescription(title);
      
      heroImage = await generateImage({ prompt: `Hero for ${siteName}`, type: 'hero' });
      logo = await generateImage({ prompt: `Logo for ${siteName}`, type: 'logo' });
      favicon = await generateImage({ prompt: `Favicon for ${siteName}`, type: 'favicon' });
    }
    
    const scrapedData = await scrapeWebsite(sourceDomain);
    const content = await generateContent(siteName, title, description);
    
    const html = await transformLP({
      scrapedData,
      siteName,
      canonical: canonical || sourceDomain,
      ampLink: ampLink || sourceDomain,
      title,
      description,
      content,
      images: { hero: heroImage?.url, logo: logo?.url, favicon: favicon?.url },
      miniGame: {
        enabled: miniGameEnabled === 'true',
        type: miniGameType || 'spin',
        position: miniGamePosition || 'daftar',
        customSelector: miniGameCustomSelector || null
      }
    });
    
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status,
        mini_game_enabled, mini_game_type, mini_game_position, mini_game_custom_selector
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      userId, 'landingpage', sourceDomain, siteName, canonical || sourceDomain, ampLink || sourceDomain,
      JSON.stringify({ title, description }),
      html,
      'ready',
      miniGameEnabled === 'true',
      miniGameType || 'spin',
      miniGamePosition || 'daftar',
      miniGameCustomSelector || null
    ]);
    
    const projectId = result.rows[0].id;
    
    if (heroImage?.url) {
      await saveAssets(projectId, { hero: heroImage, logo, favicon });
    }
    
    await sendTelegramLog(`✅ LP Generated\nUser: ${req.user.username}\nSite: ${siteName}`);
    
    res.status(201).json({
      projectId,
      title,
      description,
      html,
      images: { hero: heroImage?.url, logo: logo?.url, favicon: favicon?.url }
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
    
    const result = await pool.query(`
      SELECT id, type, source_domain, site_name, config, 
        status, created_at, html_content
      FROM projects
      WHERE user_id = $1 AND type = $2
        AND (site_name ILIKE $3 OR source_domain ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `, [userId, type, `%${search}%`, limit, offset]);
    
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
      SELECT * FROM projects
      WHERE id = $1 AND user_id = $2
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
    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// 6. DELETE ALL HISTORY
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
// 7. GET SCRIPT
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
// 8. DOWNLOAD ASSETS
// ============================================
router.get('/:id/assets', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT type, file_url FROM project_assets
      WHERE project_id = $1
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELPERS
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
  for (const [type, data] of Object.entries(images)) {
    if (data && data.url) {
      await pool.query(`
        INSERT INTO project_assets (project_id, type, file_url)
        VALUES ($1, $2, $3)
      `, [projectId, type, data.url]);
    }
  }
}

module.exports = router;