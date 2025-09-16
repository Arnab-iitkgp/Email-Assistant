const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
//rule based classifier

function ruleBasedClassifier(email) {
  const text = (email.subject + " " + email.body).toLowerCase();
  if (
    text.includes("asap") ||
    text.includes("urgent") ||
    text.includes("immediately") ||
    text.includes("soon") ||
    text.includes("emergency")
    || text.includes("cdc")
    || text.includes("shortlist")
    || text.includes("new company available")

  ) {
    return "Urgent";
  } else if (
    text.includes("meeting") ||
    text.includes("schedule") ||
    text.includes("appointment") ||
    text.includes("reminder") ||
    text.includes("deadline") ||
    text.includes("task")
  ) {
    return "Important";
  } else if (
    text.includes("newsletter") ||
    text.includes("promotion") ||
    text.includes("offer") ||
    text.includes("sale") ||
    text.includes("discount")
  ) {
    return "FYI";
  } else if (
    text.includes("unsubscribe") ||
    text.includes("lottery") ||
    text.includes("winner") ||
    text.includes("prize") ||
    text.includes("free")
  ) {
    return "Spam";
  }
}

// now we can do llm powered classifier if the rule based classifier fails

async function llmBasedClassifier(email) {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const currentTimeIST = new Date().toLocaleString("en-US", {
  timeZone: "Asia/Kolkata",
});
const prompt = `You are an intelligent email classifier.

Classify the following email into one of these categories: Urgent, Important, FYI, Spam.

Definitions:
- Urgent: Requires immediate action. Includes emergencies, medical needs, or time-sensitive deadlines/events that are **within 48 hours** from now (based on Indian Standard Time).Any mail coming from CDC or mail like shortlist, new company available are urgent
- Important: Requires attention, but not immediately. Includes deadlines more than 48 hours away, tasks, meetings, schedules, or programming contests like Codeforces (including Educational Contests, Div. 2, Div. 3, etc.).
- FYI: Informational content that doesn’t require action.
- Spam: Unsolicited, irrelevant, or promotional content.

Current IST time: ${currentTimeIST}

If a deadline is mentioned, convert it to IST and check how far it is from now.
If it’s within 48 hours, mark it as **Urgent**. Otherwise, use the rules above.

Email:
Subject: ${email.subject}
Body: ${email.body}

Respond with **only one word**: Urgent, Important, FYI, or Spam.`;
     const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    })
    let category = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    category = category.replace(/[^\w]/g, "");//for removing the punctuations
    console.log("LLM raw category:", category);
    if (["Urgent", "Important", "FYI", "Spam"].includes(category)) {
      return category;
    } else {
      return "FYI"; // default fallback
    }
  } catch (error) {
    console.error(
      "LLM classification error:",
      error.response?.data || error.message
    );
    return "FYI"; // fallback on error
  }
}
async function classifyEmail(email) {
  // First try rule-based classification
  const ruleCategory = ruleBasedClassifier(email);
  if (ruleCategory) {
    return ruleCategory;
  }
  //try llm classifer then
  const llmCategory = await llmBasedClassifier(email);
  return llmCategory;
}
module.exports = classifyEmail;
