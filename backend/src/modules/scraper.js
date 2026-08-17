const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  console.log(`🔍 Scraping: ${url}`);
  
  let browser;
  try {
    // Untuk Railway, pake executablePath yang disediakan
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
    
    browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Ekstrak data
    const meta = {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
    };
    
    // Cek GA / GSC
    const hasGA = html.includes('google-analytics') || html.includes('gtag');
    const hasGSC = html.includes('google-site-verification');
    
    // Ambil hero image (cari dari berbagai kemungkinan)
    let heroImage = meta.ogImage || '';
    if (!heroImage) {
      const imgSelectors = ['img.hero', '.hero img', '.banner img', 'img:first', 'main img'];
      for (const selector of imgSelectors) {
        const img = $(selector).first();
        if (img.length > 0) {
          heroImage = img.attr('src') || img.attr('data-src') || '';
          if (heroImage) break;
        }
      }
      // Fix relative URL
      if (heroImage && heroImage.startsWith('/')) {
        const baseUrl = new URL(url);
        heroImage = baseUrl.origin + heroImage;
      }
    }
    
    // Ekstrak warna dominan (simulasi, nanti bisa pake API color extraction)
    const dominantColors = ['#1a1a2e', '#16213e', '#0f3460', '#e94560']; // default
    
    // Ambil struktur layout
    const layout = {
      header: $('header').html() || '',
      content: $('main, .content, article').html() || '',
      sidebar: $('aside, .sidebar').html() || '',
      footer: $('footer').html() || '',
    };
    
    // Ambil CSS
    const styles = [];
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) styles.push(href);
    });
    
    const inlineStyles = $('style').map((i, el) => $(el).html()).get().join('\n');
    
    await browser.close();
    
    return {
      html,
      meta,
      heroImage,
      dominantColors,
      layout,
      styles,
      inlineStyles,
      hasGA,
      hasGSC,
      theme: detectTheme($, meta),
    };
    
  } catch (error) {
    if (browser) await browser.close();
    console.error('Scrape error:', error.message);
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

function detectTheme($, meta) {
  const text = meta.title + ' ' + meta.description + ' ' + $('body').text().slice(0, 500);
  const themes = ['judi', 'slot', 'casino', 'gacor', 'maxwin', 'togel', 'poker', 'bola', 'sport'];
  for (const theme of themes) {
    if (text.toLowerCase().includes(theme)) return theme;
  }
  return 'general';
}

module.exports = { scrapeWebsite };