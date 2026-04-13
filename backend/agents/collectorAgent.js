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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getISTDayBounds() {
  const now = new Date();

  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  const istMidnight = new Date(
    istNow.getFullYear(),
    istNow.getMonth(),
    istNow.getDate(),
    0, 0, 0
  );

  const istTomorrow = new Date(istMidnight.getTime() + 24 * 60 * 60 * 1000);

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

      const { afterEpoch, beforeEpoch } = getISTDayBounds();
      const query = `is:inbox after:${afterEpoch} before:${beforeEpoch}`;

      const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
      });

      const messages = res.data.messages || [];
      for (let msg of messages) {
        // Quick pre-check: skip if we've already stored this Gmail message
        const alreadyExists = await Email.findOne({ userId: user._id, gmailMsgId: msg.id });
        if (alreadyExists) {
          continue;
        }

        await delay(10000);
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

        // Skip if we already processed any message from this thread
        const threadExists = await Email.findOne({ userId: user._id, threadId });
        if (threadExists) {
          console.log(`Skipping already processed email: ${subject}`);
          continue;
        }

        const category = await classifyEmail({ subject, body });

        let summary = "";
        if (category.toLowerCase() !== "spam") {
          await delay(10000);
          summary = await summarizeEmail({ subject, body }, user._id);
        }

        let deadlines = []
        if (["urgent", "important", "fyi"].includes(category.toLowerCase())) {
          await delay(10000);
          deadlines = await extractDeadlines({ subject, body });
        }

        console.log(`📧 Email from: ${sender}`);
        console.log(`📌 Subject: ${subject}`);
        console.log(`🔖 Classified as: ${category}`);

        // Atomic upsert: prevents race conditions between concurrent poll cycles
        let newEmail;
        try {
          newEmail = await Email.findOneAndUpdate(
            { userId: user._id, threadId },
            {
              $setOnInsert: {
                userId: user._id,
                gmailMsgId: msg.id,
                sender,
                subject,
                body,
                threadId,
                timestamp,
                category,
                summary,
                deadlines,
                calendarSynced: false,
              },
            },
            { upsert: true, new: true, rawResult: true }
          );
        } catch (dupErr) {
          if (dupErr.code === 11000) {
            console.log(`Duplicate detected (race condition caught) for: ${subject}`);
            continue;
          }
          throw dupErr;
        }

        // Only process further if this was a NEW insert, not an existing match
        const wasInserted = newEmail.lastErrorObject?.upserted || !newEmail.lastErrorObject?.updatedExisting;
        if (!wasInserted) {
          console.log(`Skipping already processed email (upsert matched): ${subject}`);
          continue;
        }

        const savedEmail = newEmail.value;

        await storeEmailInVectorDB({
          _id: savedEmail._id,
          userId: user._id,
          sender,
          subject,
          body,
          timestamp,
          category,
        });

        if (deadlines.length > 0 && !savedEmail.calendarSynced) {
          try {
            await createCalendarEvent(user.email, {
              subject,
              summary,
              deadlines,
            });
            // Mark as synced to prevent re-creating events on any future runs
            await Email.updateOne(
              { _id: savedEmail._id },
              { $set: { calendarSynced: true } }
            );
          } catch (calErr) {
            console.error(`Google Calendar sync failed for "${subject}":`, calErr.message);
          }
        }
      }

      console.log(` Fetched ${messages.length} emails for ${user.email}`);
    } catch (err) {
      console.error(`Error fetching emails for ${user.email}:`, err);
    }
  }
}

module.exports = fetchEmailsForAllUsers;
