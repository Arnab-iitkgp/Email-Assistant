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
    const name = userinfo.data.name;
    const picture = userinfo.data.picture;

    // Save user
    let user;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      existingUser.name = name;
      existingUser.picture = picture;
      existingUser.google.refreshToken =
        tokens.refresh_token || existingUser.google.refreshToken;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        email,
        name,
        picture,
        google: { refreshToken: tokens.refresh_token },
      });
    }

    res.cookie("userId", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true on Render
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });


    res.redirect(`${process.env.FRONTEND_URL}/dashboard`); // frontend dashboard
  } catch (err) {
    console.error("OAuth callback error:", err.response?.data || err.message);
    res.status(500).send("Authentication failed - check logs for details");
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("userId");
  res.status(200).send("Logged out successfully");
});

app.get("/api/auth/me", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).send("Not authenticated");

  try {
    const user = await User.findById(userId).select("email name picture");
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Fetch emails for all users for processing
app.get("/fetch-emails", async (req, res) => {
  await fetchEmailsForAllUsers();
  res.send("Emails fetched for all users!");
});

app.get("/api/emails/today", async (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).send("User not authenticated");

  // Calculate strict IST boundaries for "today"
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  
  // Start of today in IST, converted back to UTC
  const startOfToday = new Date(
    Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0)
  );
  const realStart = new Date(startOfToday.getTime() - istOffsetMs);

  // End of today in IST, converted back to UTC
  const endOfToday = new Date(
    Date.UTC(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999)
  );
  const realEnd = new Date(endOfToday.getTime() - istOffsetMs);

  try {
    const emails = await Email.find({
      userId,
      timestamp: { $gte: realStart, $lte: realEnd },
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
    // Calculate IST "start of today" correctly regardless of server timezone
    // IST = UTC + 5:30, so IST midnight = UTC 18:30 of the previous day
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const istMidnight = new Date(
      istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0
    );
    // Convert IST midnight back to UTC for the DB query
    const todayStartUTC = new Date(istMidnight.getTime() - istOffsetMs);

    // Show deadlines for the next 7 days so users can see what's coming
    const endDateUTC = new Date(todayStartUTC.getTime() + 7 * 24 * 60 * 60 * 1000);

    const emails = await Email.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          category: { $in: ["Urgent", "Important", "FYI"] },
        },
      },
      { $unwind: "$deadlines" },
      {
        $match: {
          "deadlines.deadline": { $gte: todayStartUTC, $lte: endDateUTC },
        },
      },
      { $sort: { "deadlines.deadline": 1 } },
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
          deadline: "$deadlines.deadline",
          alerted24h: "$deadlines.alerted24h",
          alerted3h: "$deadlines.alerted3h",
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
