const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  console.log(`🔍 Scraping: ${url}`);
  
  let browser;
  try {
    // Puppeteer akan otomatis download Chromium
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      headless: true,
      ignoreHTTPSErrors: true,
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
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