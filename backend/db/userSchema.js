const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  google: {
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
  },
  phone: {
    type: String,
    default: "919144817012", // string with country code, no "+" if using WhatsApp API
  },
  chatId: {
    type: String, // or Number (depending), but String is safe
    default:process.env.TELEGRAM_CHAT_ID || "", // Telegram chat ID for sending messages
    required: false,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
