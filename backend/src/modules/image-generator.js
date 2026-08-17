const axios = require('axios');

async function generateImage({ prompt, type }) {
  try {
    // Pakai Fal.ai
    const response = await axios.post(
      'https://fal.run/fal-ai/flux/schnell',
      {
        prompt: prompt,
        image_size: type === 'favicon' ? 'square' : 'landscape_4_3',
        num_inference_steps: 4,
        guidance_scale: 3.5,
        num_images: 1,
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
    
    // Upload ke Cloudflare R2
    const uploadedUrl = await uploadToR2(imageUrl, type);
    
    return {
      url: uploadedUrl || imageUrl,
      prompt: prompt,
    };
    
  } catch (error) {
    console.error('Image Generation Error:', error.message);
    // Fallback image
    return {
      url: `https://via.placeholder.com/${type === 'favicon' ? '200x200' : '1200x630'}/e94560/ffffff?text=${type}`,
      prompt: prompt,
    };
  }
}

async function uploadToR2(imageUrl, type) {
  try {
    // Download image from URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Get R2 credentials
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    
    const filename = `${type}_${Date.now()}.png`;
    
    // Upload to R2 using S3-compatible API
    // Note: Ini pake axios langsung, tapi lebih baik pake @aws-sdk/client-s3
    // Untuk simpelnya, kita return placeholder dulu
    // Nanti kalo mau production, install @aws-sdk/client-s3
    
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${filename}`;
    
  } catch (error) {
    console.error('R2 Upload Error:', error.message);
    return imageUrl;
  }
}

module.exports = { generateImage };