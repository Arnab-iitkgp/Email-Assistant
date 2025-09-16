
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ------------------- Gemini Embedding Setup -------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values; // Array of numbers
  } catch (err) {
    console.error("Error generating embedding:", err);
    return null;
  }
}

// ------------------- Pinecone Setup -------------------
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX);

// ------------------- Store Email in Pinecone -------------------
async function storeEmailInVectorDB(emailDoc) {
  try {
    const textForEmbedding = `${emailDoc.subject}\n\n${emailDoc.body}`;
    const embedding = await getEmbedding(textForEmbedding);
    if (!embedding) return;

    await index.upsert([
      {
        id: emailDoc._id.toString(), // link to MongoDB _id
        values: embedding,
        metadata: {
          sender: emailDoc.sender,
          subject: emailDoc.subject,
          timestamp: emailDoc.timestamp,
          category: emailDoc.category || "Uncategorized"
        }
      }
    ]);

    console.log("Stored email in Pinecone:", emailDoc._id.toString());
  } catch (err) {
    console.error("Error storing email in Pinecone:", err);
  }
}

// ------------------- Retrieve Similar Emails -------------------
async function findSimilarEmails(newEmailText, topK = 3) {
  try {
    const embedding = await getEmbedding(newEmailText);
    if (!embedding) return [];

    const query = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true
    });

    return query.matches || [];
  } catch (err) {
    console.error("Error querying Pinecone:", err);
    return [];
  }
}

module.exports = {
  getEmbedding,
  storeEmailInVectorDB,
  findSimilarEmails
};