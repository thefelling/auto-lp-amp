const axios = require('axios');
const cheerio = require('cheerio');

function fallbackHtml(url) {
  const safeUrl = String(url || '').replace(/"/g, '&quot;');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Website Template</title><meta name="description" content="Website template"><link rel="canonical" href="${safeUrl}"><style>body{margin:0;font-family:Arial,sans-serif;background:#111827;color:#f9fafb}main{max-width:980px;margin:auto;padding:48px 20px}.hero{padding:64px 24px;text-align:center;background:linear-gradient(135deg,#312e81,#be123c);border-radius:20px}h1{font-size:clamp(2rem,6vw,4rem)}.btn{display:inline-block;padding:14px 24px;background:#f59e0b;color:#111827;border-radius:8px;text-decoration:none;font-weight:700}</style></head><body><main><section class="hero"><h1>Website Template</h1><p>Template siap disesuaikan dengan brand Anda.</p><a class="btn" href="${safeUrl}">Mulai Sekarang</a></section><section class="content"><h2>Informasi Lengkap</h2><p>Konten halaman dapat disesuaikan secara otomatis.</p></section></main></body></html>`;
}

function processHtml(html, url) {
  const $ = cheerio.load(html || fallbackHtml(url), { decodeEntities: false });
  if (!$('html').length) return processHtml(fallbackHtml(url), url);
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  return {
    html: $.html(),
    meta: {
      title: $('title').text() || '',
      description: $('meta[name="description"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || url,
      ogTitle: $('meta[property="og:title"]').attr('content') || ''
    },
    layout: {
      header: $('header').html() || '',
      content: $('main, .content, article').first().html() || '',
      footer: $('footer').html() || '',
    },
    inlineStyles: $('style').map((i, el) => $(el).html()).get().join('\n'),
    theme: 'default'
  };
}

async function scrapeWebsite(url) {
  console.log(`Scraping website: ${url}`);
  try {
    const request = process.env.SCRAPINGBEE_API_KEY
      ? axios.get('https://app.scrapingbee.com/api/v1/', { params: { api_key: process.env.SCRAPINGBEE_API_KEY, url, render_js: 'true' }, timeout: 30000 })
      : axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AutoGenerator/1.0)' }, timeout: 12000 });
    const response = await request;
    return processHtml(response.data, url);
  } catch (error) {
    console.error('Scrape fallback:', error.message);
    return processHtml(fallbackHtml(url), url);
  }
}

module.exports = { scrapeWebsite, processHtml, fallbackHtml };
