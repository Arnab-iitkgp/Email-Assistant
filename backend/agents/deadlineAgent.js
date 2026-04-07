const Groq = require("groq-sdk");
const chrono = require("chrono-node");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ------------------- Chrono-based extraction (deterministic) -------------------

/**
 * Uses chrono-node to parse natural language dates from email text.
 * Handles: "next Sunday", "by Friday", "April 15th", "in 3 days",
 *          "this Saturday at 5pm", "tomorrow morning", "end of week", etc.
 */
function extractDatesWithChrono(emailText, referenceDate) {
  // Parse with default timezone offset for IST (+05:30)
  const results = chrono.parse(emailText, referenceDate, { forwardDate: true, timezone: 330 });

  const dates = [];
  for (const result of results) {
    const text = result.text.toLowerCase();

    // Skip OTPs, verification codes, token expiry patterns
    const surroundingText = getSurroundingText(emailText, result.index, 80).toLowerCase();
    if (isTransientCode(text, surroundingText)) {
      continue;
    }

    // Chrono's result.start.date() returns a JS Date object in local time (UTC under the hood).
    let date = result.start.date();

    // Skip dates in the past (more than 1 hour ago)
    const oneHourAgo = new Date(referenceDate.getTime() - 60 * 60 * 1000);
    if (date < oneHourAgo) {
      continue;
    }

    // If no time was explicitly mentioned, default to 23:59:59 IST.
    // We achieve this by setting the time in UTC that corresponds to 23:59:59 IST.
    // 23:59:59 IST is 18:29:59 UTC.
    if (!result.start.isCertain("hour")) {
      date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 18, 29, 59, 0));
    }

    dates.push({
      date,
      source: "chrono",
      matchedText: result.text,
    });
  }

  return dates;
}

/**
 * Get surrounding text around a match for context analysis.
 */
function getSurroundingText(fullText, index, radius) {
  const start = Math.max(0, index - radius);
  const end = Math.min(fullText.length, index + radius);
  return fullText.substring(start, end);
}

/**
 * Check if a date mention is related to a transient code (OTP, 2FA, etc.)
 */
function isTransientCode(matchText, surroundingText) {
  const transientPatterns = [
    /otp/i, /verification\s*code/i, /2fa/i, /two.?factor/i,
    /password\s*reset/i, /login\s*link/i, /expires?\s*in\s*\d+\s*min/i,
    /valid\s*for\s*\d+\s*min/i, /temporary/i, /one.?time/i,
    /security\s*code/i, /access\s*code/i, /pin\s*code/i,
    /magic\s*link/i, /sign.?in\s*link/i, /confirm.*email/i,
  ];
  return transientPatterns.some(
    (p) => p.test(matchText) || p.test(surroundingText)
  );
}

// ------------------- LLM-based extraction (context-aware) -------------------

async function extractDatesWithLLM(email, referenceDate) {
  try {
    const currentTimeIST = referenceDate.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const prompt = `You are an intelligent assistant that extracts dates from emails.

**CURRENT DATE AND TIME (IST):** ${currentTimeIST}

Given the following email, identify ALL important dates including:
- Submission deadlines
- Event dates (workshops, meetings, webinars, conferences)
- Due dates for tasks, assignments, reports
- Registration closing dates
- Any "by [date]" or "before [date]" mentions
- Relative dates like "next Sunday", "this Friday", "by end of week", "tomorrow"

**CRITICAL RULES:**
1. IGNORE expiry times for OTPs, 2FA codes, password reset links, or temporary login tokens
2. Use the CURRENT DATE above to resolve relative references ("next Sunday" = the actual date of next Sunday)
3. If only a date is mentioned without time, use 23:59:59 IST
4. If a timezone other than IST is mentioned, ALWAYS convert it to IST.
5. All dates extracted should strictly be considered in IST. Output ALL dates in UTC by subtracting 5 hours and 30 minutes from the calculated IST time, format as ISO 8601: YYYY-MM-DDTHH:MM:SSZ
6. If no actionable dates found, respond with exactly: No deadlines

**RESPOND WITH ONLY** a comma-separated list of ISO 8601 timestamps in UTC, or "No deadlines". No explanations.

Email:
Subject: ${email.subject}
Body: ${email.body}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 150,
    });

    const llmResponse = chatCompletion.choices[0]?.message?.content?.trim();
    console.log("LLM deadline response:", llmResponse);

    const dates = [];
    if (llmResponse && !llmResponse.toLowerCase().includes("no deadline")) {
      // Match ISO timestamps (with or without seconds, ending in Z or not)
      const isoMatches = [
        ...llmResponse.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z?/g),
      ].map((m) => m[0]);

      for (const iso of isoMatches) {
        // Ensure "Z" is appended if it's missing so the JS Date constructor
        // explicitly treats the string as UTC instead of local time.
        const isoUTC = iso.endsWith('Z') ? iso : iso + 'Z';
        const date = new Date(isoUTC);
        if (!isNaN(date)) {
          dates.push({
            date,
            source: "llm",
            matchedText: isoUTC,
          });
        }
      }
    }

    return dates;
  } catch (error) {
    console.error("LLM deadline extraction error:", error?.response?.data || error.message);
    return [];
  }
}

// ------------------- Merge & Deduplicate -------------------

/**
 * Merges results from chrono and LLM, removing duplicates.
 * Two dates are considered duplicates if they're within 2 hours of each other.
 */
function mergeAndDeduplicate(chronoDates, llmDates) {
  const DUPLICATE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

  // Chrono results are more reliable for relative dates, so they take priority
  const merged = [...chronoDates];

  for (const llmDate of llmDates) {
    const isDuplicate = merged.some(
      (existing) =>
        Math.abs(existing.date.getTime() - llmDate.date.getTime()) <
        DUPLICATE_WINDOW_MS
    );
    if (!isDuplicate) {
      merged.push(llmDate);
    }
  }

  // Sort by date ascending
  merged.sort((a, b) => a.date.getTime() - b.date.getTime());

  return merged;
}

// ------------------- Main Export -------------------

const extractDeadlines = async function (email) {
  try {
    const referenceDate = new Date(); // "now" for resolving relative dates

    const emailText = `${email.subject || ""}\n${email.body || ""}`;

    // Step 1: Chrono extraction (fast, deterministic, great with relative dates)
    const chronoDates = extractDatesWithChrono(emailText, referenceDate);
    console.log(
      `📅 Chrono found ${chronoDates.length} dates:`,
      chronoDates.map((d) => `"${d.matchedText}" → ${d.date.toISOString()}`).join(", ") || "none"
    );

    // Step 2: LLM extraction (context-aware, catches things chrono misses)
    const llmDates = await extractDatesWithLLM(email, referenceDate);
    console.log(
      `🤖 LLM found ${llmDates.length} dates:`,
      llmDates.map((d) => `"${d.matchedText}" → ${d.date.toISOString()}`).join(", ") || "none"
    );

    // Step 3: Merge and deduplicate
    const allDates = mergeAndDeduplicate(chronoDates, llmDates);
    console.log(
      `Final ${allDates.length} unique deadlines:`,
      allDates.map((d) => `${d.date.toISOString()} (${d.source})`).join(", ") || "none"
    );

    // Convert to the schema format
    const deadlines = allDates.map((d) => ({
      deadline: d.date,
      alerted24h: false,
      alerted3h: false,
      alerted1h: false,
    }));

    return deadlines;
  } catch (error) {
    console.error(
      "Error in extractDeadlines:",
      error?.response?.data || error.message || error
    );
    return [];
  }
};

module.exports = extractDeadlines;
