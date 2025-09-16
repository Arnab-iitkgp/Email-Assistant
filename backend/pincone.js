const {Pinecone} = require("@pinecone-database/pinecone");

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index(process.env.PINECONE_INDEX);

async function testConnection() {
  const stats = await index.describeIndexStats();
  console.log(stats);
}

module.exports = testConnection;
