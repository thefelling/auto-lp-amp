const axios = require('axios');

async function sendTelegramLog(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log('ℹ️ Telegram not configured');
    return;
  }
  
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: `🔔 [X SYSTEM]\n${message}`,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Telegram Error:', error.message);
  }
}

module.exports = { sendTelegramLog };