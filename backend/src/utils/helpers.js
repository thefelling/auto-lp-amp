/**
 * Generate random string
 */
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Slugify string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Truncate text
 */
function truncate(text, length = 160) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Parse domain from URL
 */
function parseDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Sleep/delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retry(fn, maxAttempts = 3, delay = 1000) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await sleep(delay * Math.pow(2, attempts));
    }
  }
}

/**
 * Extract filename from URL
 */
function getFileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    return pathname.split('/').pop() || 'file';
  } catch {
    return 'file';
  }
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
}

/**
 * Safe JSON parse
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = {
  generateRandomString,
  slugify,
  truncate,
  parseDomain,
  sleep,
  retry,
  getFileNameFromUrl,
  formatDate,
  safeJsonParse,
};