const axios = require('axios');
require('dotenv').config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const resp = await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"  // optional
    });
    console.log(`Telegram message sent to ${chatId}`);
    return resp.data;
  } catch (err) {
    console.error(`Failed to send Telegram to ${chatId}:`, err.response?.data || err.message);
  }
}

module.exports = sendTelegramMessage;
