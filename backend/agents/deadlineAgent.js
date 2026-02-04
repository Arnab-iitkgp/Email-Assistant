const { GoogleGenerativeAI } = require("@google/generative-ai");

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({model: process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash"});

const extractDeadlines = async function (email) {
  try {
    const prompt = `You are an intelligent assistant that extracts deadlines from emails. 
Given the following email, identify any deadlines or due dates mentioned, even if they are implied rather than explicitly stated. 
If no deadlines are found, respond with "No deadlines". if any deadline is just mentioned without a year, assume the current year
and if time not mention assume 23:59:59 IST. if any other country time mention then convert it to IST.
Respond with a comma-separated list of timestamps in ISO 8601 format (YYYY-MM-DDTHH:MM:SS), using UTC time.

Email:
Subject: ${email.subject}
Body: ${email.body}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const llmResponse = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("LLM deadline extraction response:", llmResponse);

    let deadlines = [];

    if (llmResponse && llmResponse.toLowerCase() !== "no deadlines") {
      // Match full ISO date + time
      const isoMatches = [...llmResponse.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g)].map((m) => m[0]);

      for (let iso of isoMatches) {
        const date = new Date(iso);
        if (!isNaN(date)) {
          deadlines.push({
            deadline: date,
            alerted24h: false,
            alerted1h: false,
          });
        }
      }
    }

    // Remove duplicates + sort
    // deadlines = [
    //   ...new Map(
    //     deadlines.map((d) => [d.deadline.toISOString(), d])
    //   ).values(),
    // ].sort((a, b) => a.deadline - b.deadline);

    return deadlines;
  } catch (error) {
    console.error("Error in extractDeadlines:", error?.response?.data || error.message || error);
    return [];
  }
};

module.exports = extractDeadlines;
