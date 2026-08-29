const axios = require('axios');

function fallbackImage(type) {
  const label = type === 'favicon' ? 'A' : type === 'logo' ? 'LOGO' : 'HERO';
  const width = type === 'favicon' ? 128 : 1200;
  const height = type === 'favicon' ? 128 : 630;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#312e81"/><stop offset="1" stop-color="#be123c"/></linearGradient></defs><rect width="100%" height="100%" rx="24" fill="url(#g)"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="${type === 'favicon' ? 64 : 72}" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function generateImage({ prompt, type }) {
  const fallback = fallbackImage(type);
  if (!process.env.FAL_API_KEY) return { url: fallback, prompt, fallback: true };
  try {
    const response = await axios.post('https://fal.run/fal-ai/flux/schnell', {
      prompt, image_size: type === 'favicon' ? 'square' : 'landscape_4_3', num_inference_steps: 4, guidance_scale: 3.5
    }, { headers: { Authorization: `Key ${process.env.FAL_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 });
    return { url: response.data?.images?.[0]?.url || fallback, prompt, fallback: !response.data?.images?.[0]?.url };
  } catch (error) {
    console.error(`Image ${type} fallback:`, error.message);
    return { url: fallback, prompt, fallback: true };
  }
}

module.exports = { generateImage, fallbackImage };
