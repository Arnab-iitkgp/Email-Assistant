const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;  // Your bot token
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;  // Your personal chat id

async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await axios.post(url, {
      chat_id: CHAT_ID,
      text,
    });

    console.log('✅ Telegram message sent:', text);
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.response?.data || err.message);
  }
}

module.exports = sendTelegramMessage;
