const Email = require("../db/emailSchema");
const User = require("../db/userSchema");
const WhatsAppDigest = require("../db/whatsAppDigestSchema"); // new schema
const sendWhatsAppMessage = require("../utils/sendWhatsapp");
const sendTelegram = require("../utils/sendTelegram");

async function generateDigest() {
  const users = await User.find();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let user of users) {
    const emails = await Email.find({
      userId: user._id,
      timestamp: { $gte: startOfDay },
      category: { $in: ["Urgent", "Important"] },
    }).sort({ timestamp: -1 });//for recent to old

    const digest = emails
      .map((e) => `• ${e.subject} — ${e.summary}`)
      .join(" ");

    const digestText = digest || "No important emails today.";

    console.log(`📬 Digest for ${user.email}:\n${digestText}`);

    // Save or update digest in DB
    try {
      await WhatsAppDigest.findOneAndUpdate(
        { date: startOfDay, userId: user._id }, // find by date + user
        { digestText },
        { upsert: true, new: true } // create if not exists
      );
    } catch (err) {
      console.error("Error saving digest:", err);
    }

    // Prepare unified message (for both WhatsApp & Telegram)
    const message = `👋 Hello ${user.email},\n
📬 Here is your email digest:\n
🗓️ Date: ${now.toDateString()}\n
${digestText}\n
✨ Best regards,\nYour Email Assistant`;

    // Send via WhatsApp if phone number is stored
    if (user.phone) {
      await sendWhatsAppMessage(user.phone, "dailly_digest", [now.toDateString(), digestText]);
    }

    // Send via Telegram if chatId exists
    if (user.chatId) {
      await sendTelegram(user.chatId, message);
    }
  }
}

module.exports = generateDigest;
