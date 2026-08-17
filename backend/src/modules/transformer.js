const cheerio = require('cheerio');

async function transformAMP({ scrapedData, siteName, canonical, targetLink, title, description, images }) {
  let $ = cheerio.load(scrapedData.html);
  
  $('title').text(title);
  $('meta[name="description"]').attr('content', description);
  $('link[rel="canonical"]').attr('href', canonical);
  
  // Hapus GA/GSC
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('google-analytics') || html.includes('gtag')) {
      $(el).remove();
    }
  });
  
  // Ganti gambar
  let imageIndex = 0;
  $('img').each((i, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('banner') || imageIndex === 0) {
      $(el).attr('src', images.hero);
      imageIndex++;
    }
    if (alt.toLowerCase().includes('logo')) {
      $(el).attr('src', images.logo);
    }
  });
  
  $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  
  // Ganti nama situs
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  let htmlStr = $.html();
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  return htmlStr;
}

async function transformLP({ scrapedData, siteName, canonical, ampLink, title, description, content, images, miniGame }) {
  let $ = cheerio.load(scrapedData.html);
  
  $('title').text(title);
  $('meta[name="description"]').attr('content', description);
  $('link[rel="canonical"]').attr('href', canonical);
  
  // Ganti H1
  $('h1').first().text(content.h1);
  
  // Ganti H2
  const h2s = $('h2');
  h2s.each((i, el) => {
    if (i < content.h2.length) {
      $(el).text(content.h2[i]);
    }
  });
  
  // Ganti intro
  const firstP = $('p').first();
  if (firstP.length > 0) {
    firstP.text(content.intro);
  }
  
  // Hapus GA/GSC
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('google-analytics') || html.includes('gtag')) {
      $(el).remove();
    }
  });
  
  // Ganti gambar
  let imageIndex = 0;
  $('img').each((i, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('banner') || imageIndex === 0) {
      if (images.hero) $(el).attr('src', images.hero);
      imageIndex++;
    }
    if (alt.toLowerCase().includes('logo')) {
      if (images.logo) $(el).attr('src', images.logo);
    }
  });
  
  if (images.favicon) {
    $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  }
  
  // Inject Mini Game
  let htmlStr = $.html();
  if (miniGame.enabled) {
    const gameHtml = generateMiniGame(miniGame.type, siteName);
    const positionMap = {
      hero: '</header>',
      daftar: '</body>',
      faq: '</body>',
    };
    const target = positionMap[miniGame.position] || '</body>';
    htmlStr = htmlStr.replace(target, gameHtml + target);
  }
  
  // Ganti nama situs
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  return htmlStr;
}

function generateMiniGame(type, siteName) {
  const games = {
    spin: `
    <div style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎰 Spin & Win!</h3>
      <button onclick="alert('🎉 Selamat! Anda dapat Bonus 100%')" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">SPIN</button>
    </div>
    `,
    slot: `
    <div style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎰 Slot</h3>
      <button onclick="alert('🎉 JACKPOT!')" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">SPIN</button>
    </div>
    `,
    coinflip: `
    <div style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🪙 Coin Flip</h3>
      <button onclick="alert(Math.random() > 0.5 ? '👑 Head' : '🦅 Tail')" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">FLIP</button>
    </div>
    `,
    dadu: `
    <div style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎲 Dadu</h3>
      <button onclick="alert('🎲 ' + (Math.floor(Math.random()*6)+1))" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">ROLL</button>
    </div>
    `,
  };
  
  return games[type] || games.spin;
}

module.exports = { transformAMP, transformLP };