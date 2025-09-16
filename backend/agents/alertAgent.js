const Email = require("../db/emailSchema");
const User = require("../db/userSchema");
const sendWhatsAppMessage = require("../utils/sendWhatsapp");
const sendTelegram = require("../utils/sendTelegram");

async function sendAlerts() {
  const users = await User.find();
  const now = new Date();

  for (let user of users) {
    const emails = await Email.find({ userId: user._id });

    for (let email of emails) {
      if (!email.deadlines || !email.deadlines.length) continue;

      for (let dl of email.deadlines) {
        const deadline = new Date(dl.deadline);
        const diffHours = (deadline - now) / (1000 * 60 * 60);

        const formattedDeadline = deadline.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        });

        const msg = `⏰ Reminder!\nTask: ${email.subject}\nSummary: ${email.summary}\nDeadline: ${formattedDeadline}`;

        // 24-hour alert
        if (!dl.alerted24h && diffHours <= 24 && diffHours > 23.5) {
          console.log(`⏰ 24-hour alert for ${user.email}: ${email.subject}`);
          if (user.phone) {
            await sendWhatsAppMessage(user.phone, "alert", [
              email.subject,
              email.summary,
              formattedDeadline,
            ]);
          }
          if (user.chatId) await sendTelegram(user.chatId, msg);

          dl.alerted24h = true; // ✅ update flag
        }

        // 3-hour alert
        if (!dl.alerted3h && diffHours <= 3 && diffHours > 2.5) {
          console.log(`⏰ 3-hour alert for ${user.email}: ${email.subject}`);
          if (user.phone) {
            await sendWhatsAppMessage(user.phone, "alert", [
              email.subject,
              email.summary,
              formattedDeadline,
            ]);
          }
          if (user.chatId) await sendTelegram(user.chatId, msg);

          dl.alerted3h = true; // ✅ update flag
        }

        // 1-hour alert
        if (!dl.alerted1h && diffHours <= 1 && diffHours > 0.5) {
          console.log(`⏰ 1-hour alert for ${user.email}: ${email.subject}`);
          if (user.phone) {
            await sendWhatsAppMessage(user.phone, "alert", [
              email.subject,
              email.summary,
              formattedDeadline,
            ]);
          }
          if (user.chatId) await sendTelegram(user.chatId, msg);

          dl.alerted1h = true; // ✅ update flag
        }
      }

      // save updated alert flags
      await email.save();
    }
  }
}

module.exports = sendAlerts;
