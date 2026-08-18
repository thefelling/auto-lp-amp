const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  console.log(`🔍 Scraping: ${url}`);
  
  let browser;
  try {
    // === CARA BARU: Auto-detect executable path ===
    const executablePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/snap/bin/chromium',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ].filter(Boolean);

    let executablePath = null;
    const fs = require('fs');
    
    for (const path of executablePaths) {
      try {
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      } catch (e) {}
    }

    if (!executablePath) {
      throw new Error('No Chrome/Chromium executable found. Please install chromium or set PUPPETEER_EXECUTABLE_PATH');
    }

    console.log(`✅ Using Chrome at: ${executablePath}`);

    browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ],
      headless: true,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const meta = {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
    };
    
    const layout = {
      header: $('header').html() || '',
      content: $('main, .content, article').html() || '',
      footer: $('footer').html() || '',
    };
    
    const inlineStyles = $('style').map((i, el) => $(el).html()).get().join('\n');
    
    await browser.close();
    
    return {
      html,
      meta,
      layout,
      inlineStyles,
      theme: 'judi'
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('Scrape error:', error.message);
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

module.exports = { scrapeWebsite };