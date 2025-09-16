const { google } = require("googleapis");
const Email = require("../db/emailSchema");
const User = require("../db/userSchema");
const getOAuthClient = require("../googleClient");
const classifyEmail = require("../agents/classifierAgent");
const summarizeEmail = require("./summarizerAgent");
const extractDeadlines = require("./deadlineAgent");
const createCalendarEvent = require("../agents/calendarAgent");
const { storeEmailInVectorDB } = require("./ragAgent");

function delay(ms) {
  // prevent Gemini rate limits
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 👉 helper: get IST today's bounds in epoch seconds
function getISTDayBounds() {
  const now = new Date();

  // shift current time to IST
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  // IST midnight today
  const istMidnight = new Date(
    istNow.getFullYear(),
    istNow.getMonth(),
    istNow.getDate(),
    0, 0, 0
  );

  // IST midnight tomorrow
  const istTomorrow = new Date(istMidnight.getTime() + 24 * 60 * 60 * 1000);

  // convert back to UTC epoch seconds
  const afterEpoch = Math.floor((istMidnight.getTime() - 5.5 * 60 * 60 * 1000) / 1000);
  const beforeEpoch = Math.floor((istTomorrow.getTime() - 5.5 * 60 * 60 * 1000) / 1000);

  return { afterEpoch, beforeEpoch };
}

async function fetchEmailsForAllUsers() {
  const users = await User.find();

  for (let user of users) {
    if (!user.google.refreshToken) {
      console.log(`Skipping ${user.email}: no refresh token`);
      continue;
    }

    try {
      const oAuth2Client = getOAuthClient();
      oAuth2Client.setCredentials({ refresh_token: user.google.refreshToken });

      await oAuth2Client.getAccessToken();

      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      // ✅ fetch IST day bounds
      const { afterEpoch, beforeEpoch } = getISTDayBounds();
      const query = `is:inbox after:${afterEpoch} before:${beforeEpoch}`;

      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
      });

      const messages = res.data.messages || [];
      for (let msg of messages) {
        await delay(10000); // avoid hitting Gemini rate limits

        const msgDetail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const payload = msgDetail.data.payload;
        const headers = payload.headers;
        const sender = headers.find((h) => h.name === "From")?.value || "";
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const body = payload.parts
          ? Buffer.from(payload.parts[0].body.data || "", "base64").toString("utf-8")
          : "";
        const threadId = msgDetail.data.threadId;
        const timestamp = new Date(parseInt(msgDetail.data.internalDate));

        const exists = await Email.findOne({ userId: user._id, threadId });
        if (exists) {
          console.log(`Skipping already processed email: ${subject}`);
          continue;
        }

        // AI processing
        const category = await classifyEmail({ subject, body });
        await delay(10000);
        const summary = await summarizeEmail({ subject, body });
        await delay(10000);
        const deadlines = await extractDeadlines({ subject, body });

        console.log(`📧 Email from: ${sender}`);
        console.log(`📌 Subject: ${subject}`);
        console.log(`🔖 Classified as: ${category}`);

        // Save to DB
        const newEmail = await Email.create({
          userId: user._id,
          sender,
          subject,
          body,
          threadId,
          timestamp,
          category,
          summary,
          deadlines,
        });
        // store to pinecone
        await storeEmailInVectorDB({
          _id: newEmail._id,
          sender,
          subject,
          body,
          timestamp,
          category,
        });

        if (deadlines.length > 0) {
          await createCalendarEvent(user.email, {
            subject,
            summary,
            deadlines,
          });
        }
      }

      console.log(` Fetched ${messages.length} emails for ${user.email}`);
    } catch (err) {
      console.error(`Error fetching emails for ${user.email}:`, err);
    }
  }
}

module.exports = fetchEmailsForAllUsers;
