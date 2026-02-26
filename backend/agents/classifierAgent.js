const axios = require("axios");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
    const currentTimeIST = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const prompt = `You are an intelligent email classifier.

Classify the following email into one of these categories: Urgent, Important, FYI, Spam.

Definitions:
- Urgent: Requires immediate action. Includes emergencies, medical needs, or time-sensitive deadlines/events that are **within 48 hours** from now. Any email from CDC or regarding shortlists/new company availability is Urgent. 
  **CRITICAL**: DO NOT mark OTPs, verification codes, or login links as Urgent, even if they expire soon.
- Important: Requires attention, but not immediately. Includes deadlines more than 48 hours away, tasks, meetings, or programming contests (e.g., Codeforces).
- FYI: Informational content. **OTPs, login verifications, and transient security codes MUST be categorized as FYI.**
- Spam: Unsolicited or promotional content.

Current IST time: ${currentTimeIST}

Email:
Subject: ${email.subject}
Body: ${email.body}

Respond with **only one word**: Urgent, Important, FYI, or Spam. (Treat security tokens/links as FYI).`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 10,
    });

    let category = chatCompletion.choices[0]?.message?.content?.trim() || "";
    category = category.replace(/[^\w]/g, ""); //for removing the punctuations
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
