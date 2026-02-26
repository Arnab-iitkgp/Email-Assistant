const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const extractDeadlines = async function (email) {
  try {
    const prompt = `You are an intelligent assistant that extracts deadlines from emails. 
Given the following email, identify any deadlines or due dates mentioned. 
**CRITICAL**: Ignore any expiry times for OTPs, 2FA verification codes, password reset links, or temporary login tokens. These are NOT deadlines.
If no actionable deadlines are found, respond with "No deadlines". if any deadline is just mentioned without a year, assume the current year
and if time not mention assume 23:59:59 IST. if any other country time mention then convert it to IST.
Respond with a comma-separated list of timestamps in ISO 8601 format (YYYY-MM-DDTHH:MM:SS), using UTC time.

Email:
Subject: ${email.subject}
Body: ${email.body}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
    });

    const llmResponse = chatCompletion.choices[0]?.message?.content?.trim();
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
