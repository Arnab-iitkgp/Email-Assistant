 const cron = require('node-cron');
const fetchEmailsForAllUsers = require('./agents/collectorAgent');
const sendAlerts = require('./agents/alertAgent');
const sendTelegramMessage = require('./dummyTelegrambot');
const generateDigest = require('./agents/digestAgent');
const sendWhatsAppMessage = require('./utils/sendWhatsapp');

// Digest 3 times daily (9AM, 4PM, 9PM IST)
cron.schedule('30 3,10,15 * * *', async () => {  // UTC times
    console.log("🧑‍💻 Daily Digest report...");
    try {
        await generateDigest();
    } catch (err) {
        console.error(" Error generating digest:", err);
    }
});
//dummy every minute for testing
// cron.schedule('* * * * *', async () => {  // UTC times
//     console.log("🧑‍💻 Daily Digest report...");
//     try {
//         await generateDigest();
//     } catch (err) {
//         console.error(" Error generating digest:", err);
//     }
// });

// Check for new emails every 30 mins
cron.schedule('*/30 * * * *', async () => {
    console.log("📧 Checking for new emails...");
    try {
        await fetchEmailsForAllUsers();
    } catch (err) {
        console.error(" Error fetching emails:", err);
    }
});

// Alerts every 30 mins
cron.schedule('*/30 * * * *', async () => {
    console.log("⏰ Checking for alerts...");
    try {
        await sendAlerts();
    } catch (err) {
        console.error(" Error sending alerts:", err);
    }
});

// Dummy test messages every minute
// cron.schedule('* * * * *', async () => {
//     console.log('🕒 Scheduler test running — sending WhatsApp + Telegram...');
//     try {
//         await Promise.all([
//             sendWhatsAppMessage("", 'alert', [
//                 "Dummy Task", 
//                 "This is just a test alert system 🚀", 
//                 new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
//             ]),
//             sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, "🚀 Test Alert: Your system works!")
//         ]);
//     } catch (err) {
//         console.error(" Error sending test messages:", err);
//     }
// });

console.log("✅ Scheduler is running...");

