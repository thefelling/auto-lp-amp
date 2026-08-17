const cheerio = require('cheerio');
const { generateContent } = require('./ai-generator');

async function transformAMP({ scrapedData, siteName, canonical, targetLink, title, description, images }) {
  let $ = cheerio.load(scrapedData.html);
  
  // 1. Ganti title
  $('title').text(title);
  
  // 2. Ganti meta description
  $('meta[name="description"]').attr('content', description);
  
  // 3. Ganti canonical
  $('link[rel="canonical"]').attr('href', canonical);
  
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
  
  // 5. Ganti semua link href yang mengarah ke domain lama
  const oldDomain = new URL(scrapedData.meta.canonical || scrapedData.meta.ogTitle || scrapedData.html.match(/https?:\/\/[^\/]+/)?.[0] || '');
  if (oldDomain) {
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes(oldDomain)) {
        $(el).attr('href', href.replace(oldDomain, canonical));
      }
    });
  }
  
  // 6. Ganti gambar
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    // Ganti hero image
    if (alt.toLowerCase().includes('hero') || src.includes('hero') || i === 0) {
      $(el).attr('src', images.hero);
    }
    // Ganti logo
    if (alt.toLowerCase().includes('logo') || src.includes('logo')) {
      $(el).attr('src', images.logo);
    }
  });
  
  // 7. Ganti favicon
  $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  
  // 8. Ganti semua mention nama situs lama
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  const htmlStr = $.html();
  const newHtml = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  return newHtml;
}

async function transformLP({ scrapedData, siteName, canonical, ampLink, title, description, images, miniGame }) {
  let $ = cheerio.load(scrapedData.html);
  
  // 1. Ganti title
  $('title').text(title);
  
  // 2. Ganti meta description
  $('meta[name="description"]').attr('content', description);
  
  // 3. Ganti canonical
  $('link[rel="canonical"]').attr('href', canonical);
  
  // 4. Generate konten baru
  const content = await generateContent(siteName, title, description);
  
  // 5. Ganti H1
  $('h1').text(content.h1);
  
  // 6. Ganti H2
  const h2Elements = $('h2');
  h2Elements.each((i, el) => {
    if (i < content.h2.length) {
      $(el).text(content.h2[i]);
    }
  });
  
  // 7. Ganti intro paragraph
  const firstP = $('p').first();
  if (firstP.length > 0) {
    firstP.text(content.intro);
  }
  
  // 8. Hapus GA & GSC
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('google-analytics') || html.includes('gtag') || html.includes('googletagmanager')) {
      $(el).remove();
    }
  });
  
  // 9. Ganti AMP link
  const ampLinks = $('a[href*="amp"], a[href*="go."]');
  ampLinks.each((i, el) => {
    $(el).attr('href', ampLink);
  });
  
  // 10. Ganti gambar
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt') || '';
    if (alt.toLowerCase().includes('hero') || src.includes('hero') || i === 0) {
      $(el).attr('src', images.hero);
    }
    if (alt.toLowerCase().includes('logo') || src.includes('logo')) {
      $(el).attr('src', images.logo);
    }
  });
  
  $('link[rel="icon"], link[rel="shortcut icon"]').attr('href', images.favicon);
  
  // 11. Inject Mini Game
  let htmlStr = $.html();
  if (miniGame.enabled) {
    const gameHtml = generateMiniGame(miniGame.type, siteName);
    const position = miniGame.position || 'daftar';
    const customSelector = miniGame.customSelector || null;
    
    if (customSelector) {
      // Inject ke selector custom
      // Ini lebih kompleks, bisa pake cheerio
    } else {
      // Inject berdasarkan posisi
      const positionMap = {
        hero: '</header>',
        daftar: 'daftar',
        faq: 'faq',
      };
      const target = positionMap[position] || '</body>';
      htmlStr = htmlStr.replace(target, gameHtml + target);
    }
  }
  
  // 12. Ganti semua mention nama situs lama
  const oldSiteName = scrapedData.meta.title?.split('-')[0]?.trim() || 'Situs';
  htmlStr = htmlStr.replaceAll(new RegExp(oldSiteName, 'gi'), siteName);
  
  return htmlStr;
}

function generateMiniGame(type, siteName) {
  const games = {
    spin: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎰 Spin & Win!</h3>
      <canvas id="wheel" width="200" height="200"></canvas>
      <br>
      <button onclick="spinWheel()" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">SPIN</button>
      <p id="wheelResult">Tekan spin untuk mulai!</p>
    </div>
    <script>
      let spinning = false;
      const prizes = ['Bonus 100%', 'Free Spin', 'Cashback 50%', 'Lucky Draw'];
      function spinWheel() {
        if(spinning) return;
        spinning = true;
        const result = prizes[Math.floor(Math.random() * prizes.length)];
        setTimeout(() => {
          document.getElementById('wheelResult').textContent = '🎉 Selamat! Anda dapat: ' + result;
          spinning = false;
        }, 2000);
      }
    </script>
    `,
    slot: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎰 Slot Machine</h3>
      <div style="display:flex;justify-content:center;gap:20px;font-size:40px;padding:20px;">
        <span id="reel1">🍒</span>
        <span id="reel2">🍋</span>
        <span id="reel3">🍊</span>
      </div>
      <button onclick="spinSlot()" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">SPIN</button>
      <p id="slotResult">Tekan spin untuk mulai!</p>
    </div>
    <script>
      const symbols = ['🍒','🍋','🍊','💎','7️⃣'];
      function spinSlot() {
        const result = [symbols[Math.floor(Math.random()*5)], symbols[Math.floor(Math.random()*5)], symbols[Math.floor(Math.random()*5)]];
        document.getElementById('reel1').textContent = result[0];
        document.getElementById('reel2').textContent = result[1];
        document.getElementById('reel3').textContent = result[2];
        const win = result[0] === result[1] && result[1] === result[2];
        document.getElementById('slotResult').textContent = win ? '🎉 JACKPOT!' : 'Coba lagi!';
      }
    </script>
    `,
    coinflip: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🪙 Coin Flip</h3>
      <div style="font-size:60px;padding:20px;" id="coinResult">🪙</div>
      <button onclick="flipCoin()" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">FLIP</button>
    </div>
    <script>
      function flipCoin() {
        const result = Math.random() > 0.5 ? '👑 Head' : '🦅 Tail';
        document.getElementById('coinResult').textContent = result;
      }
    </script>
    `,
    dadu: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🎲 Dadu</h3>
      <div style="font-size:60px;padding:20px;" id="diceResult">⚀</div>
      <button onclick="rollDice()" style="padding:10px 30px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;font-size:18px;">ROLL</button>
    </div>
    <script>
      const dice = ['⚀','⚁','⚂','⚃','⚄','⚅'];
      function rollDice() {
        const result = Math.floor(Math.random() * 6);
        document.getElementById('diceResult').textContent = dice[result] + ' ' + (result+1);
      }
    </script>
    `,
    tebak: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🔢 Tebak Angka</h3>
      <p>Tebak 1-100</p>
      <input type="number" id="guessInput" min="1" max="100" style="padding:10px;border-radius:8px;border:none;width:100px;">
      <button onclick="guessNumber()" style="padding:10px 20px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;">TEBAK</button>
      <p id="tebakResult">Percobaan: 0/5</p>
    </div>
    <script>
      let target = Math.floor(Math.random() * 100) + 1;
      let attempts = 0;
      function guessNumber() {
        const guess = parseInt(document.getElementById('guessInput').value);
        attempts++;
        let msg = '';
        if(guess === target) msg = '🎉 BENAR! Angka: ' + target;
        else if(guess < target) msg = '⬆ Terlalu rendah';
        else msg = '⬇ Terlalu tinggi';
        document.getElementById('tebakResult').textContent = msg + ' | Percobaan: ' + attempts + '/5';
        if(attempts >= 5) { msg += ' | Game Over! Angka: ' + target; target = Math.floor(Math.random() * 100) + 1; attempts = 0; }
      }
    </script>
    `,
    kartu: `
    <div class="mini-game" style="text-align:center;padding:20px;background:#1a1a2e;border-radius:12px;color:white;margin:20px 0;">
      <h3>🃏 Tebak Kartu</h3>
      <p>Pilih Tinggi (8-A) atau Rendah (2-7)</p>
      <button onclick="cardGuess('high')" style="padding:10px 20px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;">⬆ Tinggi</button>
      <button onclick="cardGuess('low')" style="padding:10px 20px;background:#e94560;border:none;border-radius:8px;color:white;cursor:pointer;">⬇ Rendah</button>
      <p id="cardResult">Kartu: ?</p>
    </div>
    <script>
      function cardGuess(choice) {
        const card = Math.floor(Math.random() * 13) + 2;
        const isHigh = card >= 8;
        const win = (choice === 'high' && isHigh) || (choice === 'low' && !isHigh);
        const cardName = card === 11 ? 'J' : card === 12 ? 'Q' : card === 13 ? 'K' : card === 14 ? 'A' : card;
        document.getElementById('cardResult').textContent = 'Kartu: ' + cardName + ' | ' + (win ? '🎉 MENANG!' : '😢 Kalah');
      }
    </script>
    `
  };
  
  return games[type] || games.spin;
}

module.exports = { transformAMP, transformLP };