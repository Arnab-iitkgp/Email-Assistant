const axios = require('axios');

const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN; // From Meta Developer App

async function sendWhatsAppMessage(to, templateName, variables) {
  try {
    const res = await axios.post(WHATSAPP_API_URL, {
      messaging_product: "whatsapp",
      to: to, // Use test number for development
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: variables.map(v => ({ type: "text", text: v }))
          }
        ]
      }
    }, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📲 WhatsApp message sent to ${to}: ${templateName}`);
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp to ${to}:`, err.response?.data || err.message);
  }
}

module.exports = sendWhatsAppMessage;
