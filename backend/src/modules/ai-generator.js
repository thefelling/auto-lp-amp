const OpenAI = require('openai');

let client;
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function fallbackDescription(title) {
  return `Temukan informasi lengkap tentang ${title}. Akses layanan dengan mudah, cepat, dan aman.`.slice(0, 160);
}

async function generateDescription(title) {
  const ai = getClient();
  if (!ai) return fallbackDescription(title);
  try {
    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Tulis meta description SEO berbahasa Indonesia, satu kalimat, maksimal 155 karakter. Jangan gunakan tanda kutip.' },
        { role: 'user', content: `Buat meta description untuk: ${title}` }
      ],
      max_tokens: 100,
      temperature: 0.5,
    });
    return (response.choices?.[0]?.message?.content || fallbackDescription(title)).trim().slice(0, 160);
  } catch (error) {
    console.error('AI description error:', error.message);
    return fallbackDescription(title);
  }
}

function fallbackContent(siteName, title) {
  return {
    h1: title || `${siteName} - Situs Terpercaya`,
    h2: ['Layanan Terbaik', 'Mudah dan Cepat', 'Aman Digunakan'],
    intro: `Selamat datang di ${siteName}. Nikmati pengalaman terbaik dengan layanan yang mudah diakses dan dukungan yang responsif.`,
    benefits: ['Proses pendaftaran mudah', 'Akses cepat dari berbagai perangkat', 'Dukungan pelanggan responsif'],
    cta: 'Mulai Sekarang'
  };
}

async function generateContent(siteName, title, description) {
  const fallback = fallbackContent(siteName, title);
  const ai = getClient();
  if (!ai) return fallback;
  try {
    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Buat konten landing page berbahasa Indonesia dalam JSON valid saja. Field wajib: h1 (string), h2 (array 3 string), intro (string), benefits (array 3 string), cta (string).' },
        { role: 'user', content: `Brand: ${siteName}\nJudul: ${title}\nDeskripsi: ${description}` }
      ],
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    return {
      ...fallback,
      ...parsed,
      h2: Array.isArray(parsed.h2) && parsed.h2.length ? parsed.h2 : fallback.h2,
      benefits: Array.isArray(parsed.benefits) && parsed.benefits.length ? parsed.benefits : fallback.benefits,
    };
  } catch (error) {
    console.error('AI content error:', error.message);
    return fallback;
  }
}

module.exports = { generateDescription, generateContent, fallbackContent };
