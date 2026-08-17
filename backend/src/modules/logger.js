const axios = require('axios');

async function sendTelegramLog(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('ℹ️ Telegram not configured, skipping log');
    return;
  }
  
  try {
    const msg = `🔔 [X SYSTEM]\n${message}`;
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: msg,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Telegram Error:', error.message);
  }
}

async function logSystem(eventType, userId, data, ip) {
  const pool = require('../db');
  try {
    await pool.query(`
      INSERT INTO system_logs (user_id, event_type, event_data, ip_address)
      VALUES ($1, $2, $3, $4)
    `, [userId, eventType, JSON.stringify(data), ip]);
  } catch (error) {
    console.error('Log Error:', error.message);
  }
}

module.exports = { sendTelegramLog, logSystem };