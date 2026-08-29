const cheerio = require('cheerio');

function loadDocument(html) {
  const $ = cheerio.load(html || '<!doctype html><html><head></head><body><main><h1></h1><p></p></main></body></html>', { decodeEntities: false });
  if (!$('html').length) $('root').wrap('<html></html>');
  if (!$('head').length) $('html').prepend('<head></head>');
  if (!$('body').length) $('html').append('<body></body>');
  return $;
}
function upsertMeta($, name, content) {
  let el = $(`meta[name="${name}"]`).first();
  if (!el.length) el = $('<meta>').attr('name', name).appendTo('head');
  el.attr('content', content || '');
}
function upsertCanonical($, href) {
  let el = $('link[rel="canonical"]').first();
  if (!el.length) el = $('<link>').attr('rel', 'canonical').appendTo('head');
  el.attr('href', href || '');
}
function removeTracking($) {
  $('script').each((i, el) => { const text = $(el).html() || ''; if (/google-analytics|gtag|googletagmanager/i.test(text)) $(el).remove(); });
  $('meta[name="google-site-verification"]').remove();
}
function replaceImages($, siteName, images = {}) {
  let first = true;
  $('img').each((i, el) => {
    const alt = ($(el).attr('alt') || '').toLowerCase();
    if (first || alt.includes('hero') || alt.includes('banner')) {
      if (images.hero) $(el).attr('src', images.hero);
      $(el).attr('alt', `Hero ${siteName}`); first = false;
    }
    if (alt.includes('logo') && images.logo) { $(el).attr('src', images.logo); $(el).attr('alt', `Logo ${siteName}`); }
  });
  if (images.favicon) $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
}
function safeBrandRegex(value) { return value ? new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null; }

async function transformAMP({ scrapedData, siteName, canonical, targetLink, title, description, images }) {
  const $ = loadDocument(scrapedData?.html);
  $('title').remove(); $('<title>').text(title || siteName).prependTo('head');
  upsertMeta($, 'description', description); upsertCanonical($, canonical || targetLink);
  removeTracking($); replaceImages($, siteName, images);
  const old = scrapedData?.meta?.title?.split('-')[0]?.trim(); const regex = safeBrandRegex(old);
  if (regex && old && old.toLowerCase() !== siteName.toLowerCase()) $('body').html(($('body').html() || '').replace(regex, siteName));
  if (!$('h1').length) $('main').prepend(`<h1>${siteName}</h1>`);
  return $.html();
}

async function transformLP({ scrapedData, siteName, canonical, ampLink, title, description, content, images, miniGame }) {
  const $ = loadDocument(scrapedData?.html);
  $('title').remove(); $('<title>').text(title || siteName).prependTo('head');
  upsertMeta($, 'description', description); upsertCanonical($, canonical || ampLink);
  const main = $('main, .content, article').first().length ? $('main, .content, article').first() : $('body');
  let h1 = $('h1').first(); if (!h1.length) h1 = $('<h1>').prependTo(main);
  h1.text(content?.h1 || title || `${siteName} - Situs Terpercaya`);
  const h2s = content?.h2 || []; $('h2').each((i, el) => { if (h2s[i]) $(el).text(h2s[i]); });
  let p = $('p').first(); if (!p.length) p = $('<p>').appendTo(main); if (content?.intro) p.text(content.intro);
  if (content?.benefits?.length && !$('.generated-benefits').length) $('<ul class="generated-benefits">').append(content.benefits.map(item => $('<li>').text(item))).appendTo(main);
  removeTracking($); replaceImages($, siteName, images);
  if (miniGame?.enabled) $('body').append(generateMiniGame(miniGame.type, siteName));
  const old = scrapedData?.meta?.title?.split('-')[0]?.trim(); const regex = safeBrandRegex(old);
  if (regex && old && old.toLowerCase() !== siteName.toLowerCase()) $('body').html(($('body').html() || '').replace(regex, siteName));
  return $.html();
}
function generateMiniGame(type, siteName) {
  const labels = { spin: 'SPIN', slot: 'PLAY', coinflip: 'FLIP', dadu: 'ROLL' };
  const label = labels[type] || labels.spin;
  return `<section class="mini-game" aria-label="Mini game" style="text-align:center;padding:20px;margin:20px 0;background:#1a1a2e;color:white;border-radius:12px"><h2>Bonus ${siteName}</h2><button type="button" onclick="alert('Terima kasih sudah mencoba!')" style="padding:10px 24px;background:#e94560;color:white;border:0;border-radius:8px">${label}</button></section>`;
}
module.exports = { transformAMP, transformLP };
