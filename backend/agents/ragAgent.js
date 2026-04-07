
require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const { HfInference } = require('@huggingface/inference');

// ------------------- HuggingFace Embedding Setup -------------------
const hf = new HfInference(process.env.HF_TOKEN);

// Minimum similarity score to consider a match relevant (0-1 scale)
const SIMILARITY_THRESHOLD = 0.45;

async function getEmbedding(text) {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-mpnet-base-v2', // 768 dimensions matching Pinecone
      inputs: text,
    });
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

/**
 * Prepares text for embedding in a consistent format.
 * Both store and retrieve MUST use the same format for accurate similarity.
 */
function prepareTextForEmbedding(subject, body) {
  // Trim body to a reasonable size to avoid embedding noise from footers/signatures
  const trimmedBody = (body || "").substring(0, 1500);
  return `${subject || ""}\n\n${trimmedBody}`.trim();
}

// ------------------- Store Email in Pinecone -------------------
async function storeEmailInVectorDB(emailDoc) {
  try {
    // Don't store spam in the vector DB — it only pollutes retrieval
    if (emailDoc.category?.toLowerCase() === "spam") {
      console.log("Skipping Pinecone storage for spam email:", emailDoc.subject);
      return;
    }

    const textForEmbedding = prepareTextForEmbedding(emailDoc.subject, emailDoc.body);
    const embedding = await getEmbedding(textForEmbedding);
    if (!embedding) return;

    await index.upsert([
      {
        id: emailDoc._id.toString(),
        values: embedding,
        metadata: {
          userId: emailDoc.userId ? emailDoc.userId.toString() : "", // For user-scoped queries
          sender: emailDoc.sender,
          subject: emailDoc.subject,
          timestamp: emailDoc.timestamp ? emailDoc.timestamp.toISOString() : "",
          category: emailDoc.category || "Uncategorized",
          body: emailDoc.body ? emailDoc.body.substring(0, 1000) : ""
        }
      }
    ]);

    console.log("Stored email in Pinecone:", emailDoc._id.toString());
  } catch (err) {
    console.error("Error storing email in Pinecone:", err);
  }
}

// ------------------- Retrieve Similar Emails -------------------
/**
 * Find similar past emails using vector similarity search.
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Search options
 * @param {string} options.userId - Filter results to this user only
 * @param {string[]} options.excludeCategories - Categories to exclude (e.g., ["Spam"])
 * @param {number} options.topK - Max results to return (default: 5, we fetch more and filter)
 * @param {number} options.scoreThreshold - Min similarity score (default: SIMILARITY_THRESHOLD)
 * @returns {Array} Filtered, relevant matches sorted by score
 */
async function findSimilarEmails(subject, body, options = {}) {
  try {
    const {
      userId = null,
      excludeCategories = ["Spam"],
      topK = 5,
      scoreThreshold = SIMILARITY_THRESHOLD,
    } = options;

    // Use the SAME text preparation as storage for consistent embeddings
    const textForEmbedding = prepareTextForEmbedding(subject, body);
    const embedding = await getEmbedding(textForEmbedding);
    if (!embedding) return [];

    // Build Pinecone filter for user-scoped and category-filtered queries
    const filter = {};
    if (userId) {
      filter.userId = { $eq: userId.toString() };
    }
    if (excludeCategories.length > 0) {
      filter.category = { $nin: excludeCategories };
    }

    const queryOptions = {
      vector: embedding,
      topK: topK + 2, // Fetch extra to account for filtering
      includeMetadata: true,
    };

    // Only add filter if we have conditions (empty filter can cause Pinecone errors)
    if (Object.keys(filter).length > 0) {
      queryOptions.filter = filter;
    }

    const queryResult = await index.query(queryOptions);
    const matches = queryResult.matches || [];

    // Filter by similarity threshold — this is the key fix for irrelevant correlations
    const relevantMatches = matches
      .filter(match => match.score >= scoreThreshold)
      .slice(0, topK);

    console.log(
      `RAG query: ${matches.length} raw matches → ${relevantMatches.length} above threshold (${scoreThreshold}). ` +
      `Scores: [${matches.slice(0, 5).map(m => m.score.toFixed(3)).join(", ")}]`
    );

    return relevantMatches;
  } catch (err) {
    console.error("Error querying Pinecone:", err);
    return [];
  }
}

module.exports = {
  getEmbedding,
  prepareTextForEmbedding,
  storeEmailInVectorDB,
  findSimilarEmails
};