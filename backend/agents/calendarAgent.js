const { google } = require("googleapis");
const User = require("../db/userSchema");
const getOAuthClient = require("../googleClient");
const getCalendarEvents = async (userEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user || !user.google.refreshToken) {
    throw new Error("User not found or no refresh token available");
  }
  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: user.google.refreshToken });
  await oAuth2Client.getAccessToken();
  return google.calendar({ version: "v3", auth: oAuth2Client });
};

const createCalendarEvent = async function (userEmail, emailObj) {
  const calendar = await getCalendarEvents(userEmail);
  for (const item of emailObj.deadlines || []) {
    const start = new Date(item.deadline);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 min duration
    const reminders = [];
    if (item.alert24) reminders.push({ method: "popup", minutes: 1440 });
    if (item.alert1) reminders.push({ method: "popup", minutes: 60 });
    if (item.alert0) reminders.push({ method: "popup", minutes: 0 });
    const calendarEvent = {
      summary: emailObj.subject || "No Subject",
      description: emailObj.summary || "No Summary",
      start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
      reminders: { useDefault: false, overrides: reminders },
    };
    try {
      const response = await calendar.events.insert({
        calendarId: "primary",
        resource: calendarEvent,
      });
      console.log("Event created: %s", response.data.htmlLink);
      return response.data;
    } catch (error) {
      console.error("Error creating calendar event:", error);
      throw error;
    }
  }
};
module.exports = createCalendarEvent;
