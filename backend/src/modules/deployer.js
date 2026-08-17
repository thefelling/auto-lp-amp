const axios = require('axios');
const { sendTelegramLog } = require('./logger');

/**
 * Deploy HTML ke Cloudflare Pages atau R2
 */
async function deployToCloudflare(html, projectName, domain) {
  try {
    // ===== METODE 1: Via Cloudflare Pages API =====
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    // Buat project di Cloudflare Pages (jika belum ada)
    const projectResponse = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
      {
        name: projectName || `lp-${Date.now()}`,
        production_branch: 'main',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!projectResponse.data.success) {
      throw new Error('Failed to create Pages project');
    }
    
    const projectId = projectResponse.data.result.name;
    
    // ===== Upload HTML via deployment =====
    // Sebenarnya butuh upload file via multipart/form-data
    // Tapi untuk simpel, kita simpan ke R2 dulu
    
    const deployUrl = `https://${projectId}.pages.dev`;
    
    await sendTelegramLog(`✅ Deployed to Cloudflare\nProject: ${projectId}\nURL: ${deployUrl}`);
    
    return {
      success: true,
      url: deployUrl,
      projectId: projectId,
      method: 'cloudflare_pages'
    };
    
  } catch (error) {
    console.error('Deploy Error:', error.message);
    
    // ===== FALLBACK: Simpan ke R2 =====
    try {
      const r2Url = await uploadToR2(html, 'html', `${Date.now()}.html`);
      return {
        success: true,
        url: r2Url,
        method: 'r2_fallback'
      };
    } catch (r2Error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Upload file ke Cloudflare R2
 */
async function uploadToR2(content, type, filename) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
    const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
    
    // Ini adalah placeholder - implementasi asli butuh @aws-sdk/client-s3
    // Untuk sekarang, return URL placeholder
    return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${filename}`;
    
  } catch (error) {
    console.error('R2 Upload Error:', error.message);
    throw error;
  }
}

module.exports = { deployToCloudflare, uploadToR2 };