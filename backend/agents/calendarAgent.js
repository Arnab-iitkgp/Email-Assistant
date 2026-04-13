const { google } = require("googleapis");
const User = require("../db/userSchema");
const getOAuthClient = require("../googleClient");

/**
 * Initializes a Google Calendar API client for the given user.
 */
const getCalendarClient = async (userEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user || !user.google.refreshToken) {
    throw new Error("User not found or no refresh token available");
  }
  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: user.google.refreshToken });
  await oAuth2Client.getAccessToken();
  return google.calendar({ version: "v3", auth: oAuth2Client });
};

/**
 * Creates Google Calendar events for ALL deadlines in an email.
 * Each deadline becomes a separate 30-minute event with proper reminders.
 *
 * @param {string} userEmail - The user's email address for OAuth
 * @param {Object} emailObj - Email data with subject, summary, and deadlines array
 * @returns {Array} Array of created event results
 */
const createCalendarEvent = async function (userEmail, emailObj) {
  if (!emailObj.deadlines || emailObj.deadlines.length === 0) return [];

  const calendar = await getCalendarClient(userEmail);
  const results = [];

  for (const item of emailObj.deadlines) {
    const start = new Date(item.deadline);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min duration
    const eventSummary = emailObj.subject || "No Subject";

    // --- Duplicate check: see if an event with the same summary exists near this time ---
    try {
      const existingEvents = await calendar.events.list({
        calendarId: "primary",
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        q: eventSummary,
        singleEvents: true,
        maxResults: 5,
      });

      const isDuplicate = (existingEvents.data.items || []).some(
        (ev) => ev.summary === eventSummary
      );

      if (isDuplicate) {
        console.log(
          `⏭️ Calendar event already exists: "${eventSummary}" at ${start.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} — skipping`
        );
        continue;
      }
    } catch (checkErr) {
      // If the check fails, proceed to create (better to risk a dup than to skip)
      console.warn(`Could not check for existing calendar events: ${checkErr.message}`);
    }

    // Build reminders based on the actual schema fields
    const reminders = [
      { method: "popup", minutes: 1440 }, // Always add a 24-hour reminder
      { method: "popup", minutes: 180 },  // Always add a 3-hour reminder
      { method: "popup", minutes: 60 },   // Always add a 1-hour reminder
    ];

    const calendarEvent = {
      summary: eventSummary,
      description: `${emailObj.summary || "No summary available"}\n\n— Auto-created by EmailPro`,
      start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
      reminders: {
        useDefault: false,
        overrides: reminders,
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        resource: calendarEvent,
      });
      console.log(
        `Google Calendar event created: ${eventSummary} → ${start.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} | ${response.data.htmlLink}`
      );
      results.push(response.data);
    } catch (error) {
      // Log and continue — don't let one failed event block the rest
      console.error(
        `Failed to create calendar event for "${eventSummary}" at ${start.toISOString()}:`,
        error.message
      );
    }
  }

  return results;
};

module.exports = createCalendarEvent;
