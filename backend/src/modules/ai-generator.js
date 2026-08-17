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
          content: 'Kamu adalah copywriter SEO profesional. Buat meta description yang menarik, maksimal 160 karakter, mengandung kata kunci utama, dan mendorong klik.'
        },
        {
          role: 'user',
          content: `Buat meta description untuk judul: "${title}". Maksimal 160 karakter.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Error:', error.message);
    return `Daftar ${title} sekarang! Dapatkan bonus menarik dan pengalaman terbaik.`;
  }
}

async function generateContent(siteName, title, description) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah content writer profesional untuk landing page judi online. Buat konten yang menarik, informatif, dan persuasif.'
        },
        {
          role: 'user',
          content: `Buat konten untuk landing page ${siteName}. Judul: "${title}". Deskripsi: "${description}". 
          Buat:
          1. 1 H1 heading (maks 10 kata)
          2. 3 H2 sub-heading
          3. 1 paragraf pembuka (50-70 kata)
          4. 3 benefit points (masing-masing 15-20 kata)
          5. 1 Call-to-Action (CTA) yang menarik
          
          Format JSON: {"h1": "...", "h2": ["...","...","..."], "intro": "...", "benefits": ["...","...","..."], "cta": "..."}`
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
      h1: `${siteName} - Situs Judi Online Terpercaya`,
      h2: ['Bonus Melimpah', 'RTP Tinggi', 'Daftar Mudah'],
      intro: `Selamat datang di ${siteName}, situs judi online terbaik dengan berbagai permainan menarik.`,
      benefits: ['Bonus member baru 100%', 'RTP live tertinggi', 'Proses deposit & withdraw cepat'],
      cta: 'Daftar Sekarang!'
    };
  }
}

async function generateImagePrompt(theme, description) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah prompt engineer untuk AI image generation (Fal.ai). Buat prompt detail untuk generate gambar.'
        },
        {
          role: 'user',
          content: `Buat prompt untuk generate hero image dengan tema: "${theme}". Deskripsi tambahan: "${description}".
          Ketentuan:
          - Karakter utama: Perempuan Asia cantik
          - Tema: ${theme} online
          - Gaya: Modern, mewah, cinematic
          - 8k, photorealistic, high detail
          - Warna: emas dan merah
          
          Output hanya prompt, tanpa penjelasan lain.`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Prompt Error:', error.message);
    return `Beautiful Asian woman in elegant red dress, standing in luxurious casino, neon lights, ${theme} theme, cinematic, 8k photorealistic, high detail`;
  }
}

module.exports = { generateDescription, generateContent, generateImagePrompt };