const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { scrapeWebsite } = require('../modules/scraper');
const { generateDescription, generateContent } = require('../modules/ai-generator');
const { generateImage } = require('../modules/image-generator');
const { transformAMP, transformLP } = require('../modules/transformer');
const { sendTelegramLog } = require('../modules/logger');
const pool = require('../db');

const connection = new Redis(process.env.REDIS_URL);

/**
 * Worker untuk job generate AMP
 */
const ampWorker = new Worker('amp-generation', async (job) => {
  console.log(`📦 Processing AMP job ${job.id}`);
  
  try {
    const { userId, sourceDomain, siteName, canonical, targetLink, titles } = job.data;
    
    // 1. Scrape
    const scrapedData = await scrapeWebsite(sourceDomain);
    
    // 2. Generate konten
    const selectedTitle = titles[Math.floor(Math.random() * titles.length)];
    const description = await generateDescription(selectedTitle);
    
    // 3. Generate gambar
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
    
    // 4. Transform HTML
    const html = await transformAMP({
      scrapedData,
      siteName,
      canonical,
      targetLink,
      title: selectedTitle,
      description,
      images: { hero: heroImage.url, logo: logo.url, favicon: favicon.url }
    });
    
    // 5. Simpan ke database
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
    
    // 6. Simpan assets
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
});

/**
 * Worker untuk job generate LP
 */
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
      canonical,
      ampLink,
      title,
      description,
      content,
      images,
      miniGame
    });
    
    const result = await pool.query(`
      INSERT INTO projects (
        user_id, type, source_domain, site_name, canonical_url, target_link,
        config, html_content, status,
        mini_game_enabled, mini_game_type, mini_game_position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      userId, 'landingpage', sourceDomain, siteName, canonical, ampLink,
      JSON.stringify({ title, description }),
      html,
      'ready',
      miniGame.enabled,
      miniGame.type,
      miniGame.position
    ]);
    
    await sendTelegramLog(`✅ LP Generated (Queue)\nUser ID: ${userId}\nSite: ${siteName}`);
    
    return { projectId: result.rows[0].id, html };
    
  } catch (error) {
    console.error(`❌ LP job ${job.id} failed:`, error.message);
    throw error;
  }
});

// Event listeners
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