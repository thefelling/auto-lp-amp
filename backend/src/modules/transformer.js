const cheerio = require('cheerio');
const { generateContent } = require('./ai-generator');

// ============================================
// TRANSFORM AMP
// ============================================
async function transformAMP({ scrapedData, siteName, canonical, targetLink, title, description, images }) {
  console.log(`🔄 Transforming AMP for: ${siteName}`);
  
  let $ = cheerio.load(scrapedData.html);
  
  // 1. Ganti title
  $('title').text(title);
  console.log(`✅ Title replaced: ${title}`);
  
  // 2. Ganti meta description
  $('meta[name="description"]').attr('content', description);
  console.log(`✅ Description replaced`);
  
  // 3. Ganti canonical
  $('link[rel="canonical"]').attr('href', canonical);
  console.log(`✅ Canonical replaced: ${canonical}`);
  
  // 4. Hapus GA & GSC
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('google-analytics') || html.includes('gtag') || html.includes('googletagmanager')) {
      $(el).remove();
    }
  });
  
  $('meta').each((i, el) => {
    const name = $(el).attr('name') || '';
    if (name === 'google-site-verification') {
      $(el).remove();
    }
  });
  
  // 5. Ganti semua href dan src yang mengandung domain lama
  const oldDomain = extractDomain(scrapedData.meta.canonical || scrapedData.meta.ogTitle || scrapedData.html);
  if (oldDomain) {
    const newDomain = canonical || targetLink || siteName;
    console.log(`🔄 Replacing domain: ${oldDomain} → ${newDomain}`);
    
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes(oldDomain)) {
        $(el).attr('href', href.replace(oldDomain, newDomain));
      }
    });
    
    $('link[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes(oldDomain)) {
        $(el).attr('href', href.replace(oldDomain, newDomain));
      }
    });
  }
  
  // 6. Ganti gambar (hero, logo, favicon)
  let imageIndex = 0;
  $('img').each((i, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || '';
    
    // Hero image: cari gambar pertama atau yang ada kata hero/banner
    if (imageIndex === 0 || alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('banner')) {
      $(el).attr('src', images.hero);
      $(el).attr('alt', `Hero ${siteName}`);
      imageIndex++;
    }
    
    // Logo: cari yang ada kata logo
    if (alt.toLowerCase().includes('logo') || src.toLowerCase().includes('logo')) {
      $(el).attr('src', images.logo);
      $(el).attr('alt', `Logo ${siteName}`);
    }
  });
  
  // 7. Ganti favicon
  $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  console.log(`✅ Favicon replaced`);
  
  // 8. Ganti semua mention nama situs lama → nama situs baru
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  console.log(`🔄 Replacing brand: ${oldSiteName} → ${siteName}`);
  
  let htmlStr = $.html();
  
  // Replace di text content (h1, h2, p, span, a, div)
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  // Replace di meta tags
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  // 9. Ganti H1 utama dengan nama situs (jika ada)
  const $temp = cheerio.load(htmlStr);
  const firstH1 = $temp('h1').first();
  if (firstH1.length > 0) {
    const currentText = firstH1.text();
    if (!currentText.toLowerCase().includes(siteName.toLowerCase())) {
      firstH1.text(`${siteName} - ${currentText}`);
    }
  }
  htmlStr = $temp.html();
  
  console.log(`✅ AMP transformation complete`);
  return htmlStr;
}

// ============================================
// TRANSFORM LP
// ============================================
async function transformLP({ scrapedData, siteName, canonical, ampLink, title, description, content, images, miniGame }) {
  console.log(`🔄 Transforming LP for: ${siteName}`);
  
  let $ = cheerio.load(scrapedData.html);
  
  // 1. Ganti title
  $('title').text(title);
  
  // 2. Ganti meta description
  $('meta[name="description"]').attr('content', description);
  
  // 3. Ganti canonical
  $('link[rel="canonical"]').attr('href', canonical);
  
  // 4. Generate konten baru (jika ada content)
  if (content) {
    // Ganti H1
    const firstH1 = $('h1').first();
    if (firstH1.length > 0) {
      firstH1.text(content.h1 || `${siteName} - Situs Terpercaya`);
    }
    
    // Ganti H2
    const h2s = $('h2');
    if (content.h2 && Array.isArray(content.h2)) {
      h2s.each((i, el) => {
        if (i < content.h2.length) {
          $(el).text(content.h2[i]);
        }
      });
    }
    
    // Ganti intro paragraph
    const firstP = $('p').first();
    if (firstP.length > 0 && content.intro) {
      firstP.text(content.intro);
    }
  }
  
  // 5. Hapus GA & GSC
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('google-analytics') || html.includes('gtag') || html.includes('googletagmanager')) {
      $(el).remove();
    }
  });
  
  // 6. Ganti gambar
  let imageIndex = 0;
  $('img').each((i, el) => {
    const alt = $(el).attr('alt') || '';
    if (imageIndex === 0 || alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('banner')) {
      if (images.hero) {
        $(el).attr('src', images.hero);
        $(el).attr('alt', `Hero ${siteName}`);
      }
      imageIndex++;
    }
    if (alt.toLowerCase().includes('logo')) {
      if (images.logo) {
        $(el).attr('src', images.logo);
        $(el).attr('alt', `Logo ${siteName}`);
      }
    }
  });
  
  if (images.favicon) {
    $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  }
  
  // 7. Inject Mini Game
  let htmlStr = $.html();
  if (miniGame && miniGame.enabled) {
    const gameHtml = generateMiniGame(miniGame.type, siteName);
    const positionMap = {
      hero: '</header>',
      daftar: '</body>',
      faq: '</body>',
    };
    const target = positionMap[miniGame.position] || '</body>';
    htmlStr = htmlStr.replace(target, gameHtml + target);
    console.log(`✅ Mini game injected: ${miniGame.type}`);
  }
  
  // 8. Ganti semua mention nama situs lama → nama situs baru
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  console.log(`🔄 Replacing brand: ${oldSiteName} → ${siteName}`);
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  console.log(`✅ LP transformation complete`);
  return htmlStr;
}

// ============================================
// HELPERS
// ============================================

function extractDomain(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/([^\/\s]+)/);
  return match ? match[1] : null;
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