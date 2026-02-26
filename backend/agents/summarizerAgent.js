const Groq = require("groq-sdk");
const { findSimilarEmails } = require("./ragAgent"); // use your RAGAgent functions

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const summarizeEmail = async function (email) {
  try {
    const text = (email.subject + " " + email.body).toLowerCase();

    // Retrieve similar past emails from Pinecone via RAGAgent
    const similarEmails = await findSimilarEmails(text);

    // Build context for prompt
    const contextText = similarEmails
      .map(
        (e, i) =>
          `Email ${i + 1}:\nSubject: ${e.metadata.subject}\nSender: ${e.metadata.sender || "unknown"
          }\nBody: ${e.metadata.body || ""}\n---`
      )
      .join("\n");

    // 3️⃣ Create prompt for Groq summarizer
    const prompt = `You are an intelligent email summarizer.

Summarize the following email in a concise manner in 20 words or less. Must keep the important information.Must keep any deadlines mentioned in the email. 
Include relevant context from past related emails.

New Email:
Subject: ${email.subject}
Body: ${email.body}

Relevant Past Emails:
${contextText}

Respond in one line.`;

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
