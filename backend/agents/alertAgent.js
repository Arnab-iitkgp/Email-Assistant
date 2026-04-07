const Email = require("../db/emailSchema");
const User = require("../db/userSchema");
const sendWhatsAppMessage = require("../utils/sendWhatsapp");
const sendTelegram = require("../utils/sendTelegram");

async function sendAlerts() {
  const users = await User.find();
  const now = new Date();

  for (let user of users) {
    // Only fetch emails that actually have future deadlines with pending alerts
    const emails = await Email.find({
      userId: user._id,
      "deadlines.deadline": { $gte: now }, // Only future deadlines
      $or: [
        { "deadlines.alerted24h": false },
        { "deadlines.alerted3h": false },
        { "deadlines.alerted1h": false },
      ],
    });

    for (let email of emails) {
      if (!email.deadlines || !email.deadlines.length) continue;

      let needsSave = false;

      for (let dl of email.deadlines) {
        const deadline = new Date(dl.deadline);
        const diffHours = (deadline - now) / (1000 * 60 * 60);

        // Skip past deadlines
        if (diffHours < 0) continue;

        const formattedDeadline = deadline.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        });

        const msg = `⏰ Reminder!\n\nTask: ${email.subject}\nSummary: ${email.summary}\nDeadline: ${formattedDeadline}`;

        // 24-hour alert: fire once when deadline is within 24 hours
        if (!dl.alerted24h && diffHours <= 24) {
          console.log(`⏰ 24-hour alert for ${user.email}: ${email.subject}`);
          await sendNotifications(user, email, formattedDeadline, msg);
          dl.alerted24h = true;
          needsSave = true;
        }

        // 3-hour alert: fire once when deadline is within 3 hours
        if (!dl.alerted3h && diffHours <= 3) {
          console.log(`⏰ 3-hour alert for ${user.email}: ${email.subject}`);
          await sendNotifications(user, email, formattedDeadline, msg);
          dl.alerted3h = true;
          needsSave = true;
        }

        // 1-hour alert: fire once when deadline is within 1 hour
        if (!dl.alerted1h && diffHours <= 1) {
          console.log(`⏰ 1-hour alert for ${user.email}: ${email.subject}`);
          await sendNotifications(user, email, formattedDeadline, msg);
          dl.alerted1h = true;
          needsSave = true;
        }
      }

      // Only save if we actually changed something
      if (needsSave) {
        await email.save();
      }
    }
  }
}

/**
 * Send notification via all available channels (WhatsApp + Telegram).
 */
async function sendNotifications(user, email, formattedDeadline, msg) {
  try {
    if (user.phone) {
      await sendWhatsAppMessage(user.phone, "alert", [
        email.subject,
        email.summary,
        formattedDeadline,
      ]);
    }
    if (user.chatId) {
      await sendTelegram(user.chatId, msg);
    }
  } catch (err) {
    console.error(`Failed to send notification to ${user.email}:`, err.message);
  }
}

module.exports = sendAlerts;
