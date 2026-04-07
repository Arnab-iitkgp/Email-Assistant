const Groq = require("groq-sdk");
const { findSimilarEmails } = require("./ragAgent");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const summarizeEmail = async function (email, userId = null) {
  try {
    // Retrieve similar past emails with proper filtering
    const similarEmails = await findSimilarEmails(email.subject, email.body, {
      userId,
      excludeCategories: ["Spam"],
      topK: 3,
      scoreThreshold: 0.45,
    });

    // Build context only from genuinely relevant past emails
    let contextSection = "";
    if (similarEmails.length > 0) {
      const contextText = similarEmails
        .map(
          (e, i) =>
            `Email ${i + 1} (similarity: ${(e.score * 100).toFixed(0)}%):\nSubject: ${e.metadata.subject}\nSender: ${e.metadata.sender || "unknown"}\nBody: ${e.metadata.body || ""}\n---`
        )
        .join("\n");

      contextSection = `\nRelevant Past Emails (for additional context only):\n${contextText}\n`;
    }

    const prompt = `You are an intelligent email summarizer.

Summarize the following email in a concise manner in 20 words or less. Must keep the important information. Must keep any deadlines mentioned in the email.
${contextSection ? "If the past emails below are relevant, incorporate brief context. If they are NOT related to the new email, IGNORE them completely." : ""}

New Email:
Subject: ${email.subject}
Body: ${email.body}
${contextSection}
Respond in one line. Do NOT reference the past emails unless they directly relate to the new email's topic.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 50,
    });

    const summary =
      chatCompletion.choices[0]?.message?.content?.trim() ||
      "Summary not available";

    return summary;
  } catch (error) {
    console.error("Error in summarizeEmail:", error);
    return "Summary not available";
  }
};

module.exports = summarizeEmail;
