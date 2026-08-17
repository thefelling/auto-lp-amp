const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDescription(title) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Buat meta description SEO, maksimal 160 karakter.'
        },
        {
          role: 'user',
          content: `Buat meta description untuk: "${title}"`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Error:', error.message);
    return `Daftar ${title} sekarang! Bonus menarik.`;
  }
}

async function generateContent(siteName, title, description) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Buat konten landing page judi online dalam format JSON.'
        },
        {
          role: 'user',
          content: `Buat konten untuk ${siteName}. Judul: "${title}". 
          JSON: {"h1":"...","h2":["...","..."],"intro":"...","benefits":["..."],"cta":"..."}`
        }
      ],
      max_tokens: 500,
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI Content Error:', error.message);
    return {
      h1: `${siteName} - Situs Terpercaya`,
      h2: ['Bonus', 'RTP Tinggi', 'Daftar Mudah'],
      intro: `Selamat datang di ${siteName}.`,
      benefits: ['Bonus 100%', 'RTP Tertinggi', 'Proses Cepat'],
      cta: 'Daftar Sekarang!'
    };
  }
}

module.exports = { generateDescription, generateContent };