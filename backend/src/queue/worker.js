const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { scrapeWebsite } = require('../modules/scraper');
const { generateDescription, generateContent } = require('../modules/ai-generator');
const { generateImage } = require('../modules/image-generator');
const { transformAMP, transformLP } = require('../modules/transformer');
const { sendTelegramLog } = require('../modules/logger');
const pool = require('../db');

// Redis connection
const redisUrl = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL;

if (!redisUrl) {
  console.error('❌ REDIS_URL not set! Worker will not start.');
  process.exit(1);
}

console.log(`📊 Redis URL: ${redisUrl.replace(/\/\/.*@/, '//*****@')}`);

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});

connection.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

connection.on('connect', () => {
  console.log('✅ Redis connected');
});

// ===== AMP WORKER =====
const ampWorker = new Worker('amp-generation', async (job) => {
  console.log(`📦 Processing AMP job ${job.id}`);
  
  try {
    const { userId, sourceDomain, siteName, canonical, targetLink, titles } = job.data;
    
    const scrapedData = await scrapeWebsite(sourceDomain);
    const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
    const description = await generateDescription(selectedTitle);
    
    const heroImage = await generateImage({
      prompt: `Hero for ${siteName}, theme: judi`,
      type: 'hero'
    });
    const logo = await generateImage({
      prompt: `Logo for ${siteName}`,
      type: 'logo'
    });
    const favicon = await generateImage({
      prompt: `Favicon for ${siteName}`,
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
    for (const [type, data] of Object.entries({ hero: heroImage, logo, favicon })) {
      if (data && data.url) {
        await pool.query(`
          INSERT INTO project_assets (project_id, type, file_url)
          VALUES ($1, $2, $3)
        `, [projectId, type, data.url]);
      }
    }
    
    await sendTelegramLog(`✅ AMP Generated (Queue)\nUser ID: ${userId}\nSite: ${siteName}`);
    
    return { projectId, html };
    
  } catch (error) {
    console.error(`❌ AMP job ${job.id} failed:`, error.message);
    throw error;
  }
}, { connection });

// ===== LP WORKER =====
const lpWorker = new Worker('lp-generation', async (job) => {
  console.log(`📦 Processing LP job ${job.id}`);
  
  try {
    const { 
      userId, sourceDomain, siteName, canonical, ampLink, 
      title, description, content, images, miniGame 
    } = job.data;
    
    const scrapedData = await scrapeWebsite(sourceDomain);
    
    const html = await transformLP({
      scrapedData,
      siteName,
      canonical: canonical || sourceDomain,
      ampLink: ampLink || sourceDomain,
      title,
      description,
      content,
      images,
      miniGame: miniGame || { enabled: false }
    });
    
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status,
        mini_game_enabled, mini_game_type, mini_game_position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      userId, 'landingpage', sourceDomain, siteName, canonical || sourceDomain, ampLink || sourceDomain,
      JSON.stringify({ title, description }),
      html,
      'ready',
      miniGame?.enabled || false,
      miniGame?.type || null,
      miniGame?.position || null
    ]);
    
    await sendTelegramLog(`✅ LP Generated (Queue)\nUser ID: ${userId}\nSite: ${siteName}`);
    
    return { projectId: result.rows[0].id, html };
    
  } catch (error) {
    console.error(`❌ LP job ${job.id} failed:`, error.message);
    throw error;
  }
}, { connection });

// ===== EVENT LISTENERS =====
ampWorker.on('completed', (job) => {
  console.log(`✅ AMP job ${job.id} completed`);
});

ampWorker.on('failed', (job, err) => {
  console.error(`❌ AMP job ${job.id} failed:`, err.message);
});

lpWorker.on('completed', (job) => {
  console.log(`✅ LP job ${job.id} completed`);
});

lpWorker.on('failed', (job, err) => {
  console.error(`❌ LP job ${job.id} failed:`, err.message);
});

console.log('✅ BullMQ Workers started');

module.exports = { ampWorker, lpWorker };