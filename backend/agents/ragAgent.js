
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { HfInference } = require('@huggingface/inference');

// ------------------- HuggingFace Embedding Setup -------------------
const hf = new HfInference(process.env.HF_TOKEN);

async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-mpnet-base-v2', // 768 dimensions matching Pinecone
      inputs: text,
    });
    // The response is usually a 1D or 2D array. For all-mpnet-base-v2 it's typically [val1, val2, ...]
    // depending on the input shape. If it returns an array of arrays (e.g. [[val1, val2]]), we take the first.
    if (Array.isArray(response) && Array.isArray(response[0])) {
      return response[0];
    }
    return response;
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
          category: emailDoc.category || "Uncategorized",
          body: emailDoc.body ? emailDoc.body.substring(0, 1000) : "" // Store up to 1000 chars of body for RAG context
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