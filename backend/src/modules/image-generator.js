const axios = require('axios');

async function generateImage({ prompt, type }) {
  try {
    const response = await axios.post(
      'https://fal.run/fal-ai/flux/schnell',
      {
        prompt: prompt,
        image_size: type === 'favicon' ? 'square' : 'landscape_4_3',
        num_inference_steps: 4,
        guidance_scale: 3.5,
      },
      {
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    const imageUrl = response.data.images?.[0]?.url || '';
    
    return {
      url: imageUrl || `https://via.placeholder.com/600x400/e94560/ffffff?text=${type}`,
      prompt: prompt,
    };
    
  } catch (error) {
    console.error('Image Error:', error.message);
    return {
      url: `https://via.placeholder.com/600x400/e94560/ffffff?text=${type}`,
      prompt: prompt,
    };
  }
}

module.exports = { generateImage };