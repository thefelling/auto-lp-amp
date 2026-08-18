const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeWebsite(url) {
  console.log(`🔍 Scraping via API: ${url}`);
  
  try {
    // Pake ScrapingBee API (free 1000 request)
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (apiKey) {
      const response = await axios.get(`https://app.scrapingbee.com/api/v1/`, {
        params: {
          api_key: apiKey,
          url: url,
          render_js: 'true',
          premium_proxy: 'true',
          country_code: 'us'
        },
        timeout: 30000
      });
      return processHtml(response.data, url);
    }
    
    // Fallback: pake fetch biasa (ga render JS)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    return processHtml(response.data, url);
    
  } catch (error) {
    console.error('Scrape error:', error.message);
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}

function processHtml(html, url) {
  const $ = cheerio.load(html);
  
  return {
    html,
    meta: {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
    },
    layout: {
      header: $('header').html() || '',
      content: $('main, .content, article').html() || '',
      footer: $('footer').html() || '',
    },
    inlineStyles: $('style').map((i, el) => $(el).html()).get().join('\n'),
    theme: 'judi'
  };
}

module.exports = { scrapeWebsite };