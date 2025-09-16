const { GoogleGenerativeAI } = require("@google/generative-ai");
const { findSimilarEmails } = require("./ragAgent"); // use your RAGAgent functions

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const summarizeEmail = async function (email) {
  try {
    const text = (email.subject + " " + email.body).toLowerCase();

    // Retrieve similar past emails from Pinecone via RAGAgent
    const similarEmails = await findSimilarEmails(text);

    // Build context for prompt
    const contextText = similarEmails
      .map(
        (e, i) =>
          `Email ${i + 1}:\nSubject: ${e.metadata.subject}\nSender: ${
            e.metadata.sender || "unknown"
          }\nBody: ${e.metadata.body || ""}\n---`
      )
      .join("\n");

    // 3️⃣ Create prompt for Gemini summarizer
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an intelligent email summarizer.

Summarize the following email in a concise manner in 20 words or less. Must keep the important information.Must keep any deadlines mentioned in the email. 
Include relevant context from past related emails.

New Email:
Subject: ${email.subject}
Body: ${email.body}

Relevant Past Emails:
${contextText}

Respond in one line.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const summary =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Summary not available";

    return summary;
  } catch (error) {
    console.error("Error in summarizeEmail:", error);
    return "Summary not available";
  }
};

module.exports = summarizeEmail;
