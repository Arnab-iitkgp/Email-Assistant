require("dotenv").config();
const express = require("express");
const connectDB = require("./db/index");
const fetchEmailsForAllUsers = require("./agents/collectorAgent");
const getOAuthClient = require("./googleClient");
const { google } = require("googleapis");
const User = require("./db/userSchema");
const schedulerRoutes = require("./routes/scheduler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Email = require("./db/emailSchema");
const WhatsAppDigest = require("./db/whatsAppDigestSchema");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`, // replace with your Vite URL
    methods: ["GET", "POST"], // allowed HTTP methods
    credentials: true, // if you want to send cookies
  })
);
app.use("/api/scheduler", schedulerRoutes); // will do later in scheduler.js basically when user based control is added
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(), // how long server is running
    time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });
});

// Connect DB
connectDB();

// Step 1: redirect user to Google OAuth
app.get("/auth/google", (req, res) => {
  const oAuth2Client = getOAuthClient();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar",
    ],
    prompt: "consent",
  });
  res.redirect(authUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const oAuth2Client = getOAuthClient();

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // If no access token yet but refresh token exists, refresh it
    if (!tokens.access_token && tokens.refresh_token) {
      const { credentials } = await oAuth2Client.refreshToken(
        tokens.refresh_token
      );
      oAuth2Client.setCredentials(credentials);
    }

    // Debug log - what tokens do we actually have?
    console.log("Tokens received:", tokens);

    // Now call Google API with the authenticated client
    const oauth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });

    const userinfo = await oauth2.userinfo.get();
    const email = userinfo.data.email;

    // Save user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.google.refreshToken =
        tokens.refresh_token || existingUser.google.refreshToken;
      await existingUser.save();
    } else {
      await User.create({
        email,
        google: { refreshToken: tokens.refresh_token },
      });
    }
    res.cookie("userId", existingUser?._id || newUser._id, {
      httpOnly: true,
      secure: false, // true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.redirect(`${process.env.FRONTEND_URL}`); // frontend dashboard
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("Authentication failed - check logs for details");
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("userId");
  res.status(200).send("Logged out successfully");
});

// Fetch emails for all users for processing
app.get("/fetch-emails", async (req, res) => {
  await fetchEmailsForAllUsers();
  res.send("Emails fetched for all users!");
});

app.get("/api/emails/today", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).send("User not authenticated");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  try {
    const emails = await Email.find({
      userId,
      timestamp: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ timestamp: -1 });

    res.json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching emails");
  }
});

app.get("/api/digests", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(401).send("User not authenticated");
  }

  try {
    const allDigests = await WhatsAppDigest.find({ userId: userId }).sort({ date: -1 });

    res.json(allDigests);
  } catch (err) {
    console.error("Error fetching all digests:", err);
    res.status(500).send("Error fetching all digests");
  }
});

app.get("/api/alerts/emails", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(401).send("User not authenticated");
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const emails = await Email.aggregate([
      // Only get the user’s emails in relevant categories
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          category: { $in: ["Urgent", "Important", "FYI"] },
        },
      },
      // Break deadlines array into separate documents
      { $unwind: "$deadlines" },
      // Filter deadlines within today → tomorrow
      {
        $match: {
          "deadlines.deadline": { $gte: today, $lte: tomorrow },
        },
      },
      // Sort by deadline
      { $sort: { "deadlines.deadline": 1 } },
      // Optionally reshape the output
      {
        $project: {
          _id: 1,
          userId: 1,
          sender: 1,
          subject: 1,
          summary: 1,
          category: 1,
          threadId: 1,
          timestamp: 1,
          deadline: "$deadlines.deadline",   // flatten into top-level field
          alerted24h: "$deadlines.alerted24h",
          alerted1h: "$deadlines.alerted1h",
        },
      },
      { $limit: 100 },
    ]);

    res.json(emails);
  } catch (err) {
    console.error("Error fetching alert emails:", err);
    res.status(500).send("Error fetching alert emails");
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// require("./scheduler"); // user based scheduling will be done later
require("./demoScheduler");
const testconnection = require("./pincone");
testconnection();
