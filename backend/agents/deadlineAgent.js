const Groq = require("groq-sdk");
const chrono = require("chrono-node");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ------------------- Keyword context lists -------------------

/**
 * Keywords that indicate a date mention is an actual deadline / actionable event.
 * A chrono-parsed date is only kept if one of these appears in the surrounding text.
 */
const DEADLINE_KEYWORDS = [
  // Explicit deadline language
  /\bdeadline\b/i, /\bdue\b/i, /\bdue\s*date\b/i, /\bsubmit/i, /\bsubmission/i,
  /\blast\s*date\b/i, /\bfinal\s*date\b/i, /\bcloses?\b/i, /\bclosing\b/i,
  /\bexpir(es?|y|ation)\b/i,

  // Events & scheduled items
  /\bevent\b/i, /\bfestival\b/i, /\bcelebrat/i, /\bholiday\b/i,
  /\binterview\b/i, /\btest\b/i, /\bexam\b/i, /\bquiz\b/i, /\bassessment\b/i,
  /\bmeeting\b/i, /\bappointment\b/i, /\bcall\b/i, /\bsession\b/i,
  /\bworkshop\b/i, /\bwebinar\b/i, /\bseminar\b/i, /\bconference\b/i, /\bhackathon\b/i,
  /\bcompetition\b/i, /\bcontest\b/i, /\btournament\b/i,
  /\bregistration\b/i, /\benroll/i, /\bsign[\s-]?up\b/i,
  /\bpresentation\b/i, /\bdemo\b/i, /\breview\b/i, /\bhearing\b/i,
  /\blaunch\b/i, /\brelease\b/i, /\bkickoff\b/i, /\bstart\s*date\b/i,

  // Task language
  /\btask\b/i, /\bassignment\b/i, /\bproject\b/i, /\breport\b/i, /\bdeliverable\b/i,
  /\bmilestone\b/i, /\bpayment\b/i, /\binvoice\b/i, /\breminder\b/i,
  /\brsvp\b/i, /\brespond\b/i, /\breply\s*by\b/i, /\bconfirm\b/i,

  // Urgency phrases
  /\burgent/i, /\basap\b/i, /\bimmediately\b/i, /\bimportant\b/i,
];

/**
 * Patterns in the matched text itself that strongly indicate a deadline
 * (e.g. "by Friday", "before April 15", "no later than").
 */
const DEADLINE_PHRASING = [
  /\bby\s/i, /\bbefore\s/i, /\buntil\s/i, /\btill\s/i,
  /\bno\s*later\s*than\b/i, /\bon\s*or\s*before\b/i,
  /\bends?\s/i, /\bending\s/i,
];

// ------------------- Chrono-based extraction (context-aware) -------------------

/**
 * Uses chrono-node to parse natural language dates from email text,
 * but ONLY keeps dates that appear near deadline/event keywords.
 */
function extractDatesWithChrono(emailText, referenceDate) {
  const results = chrono.parse(emailText, referenceDate, { forwardDate: true, timezone: 330 });

  const dates = [];
  for (const result of results) {
    const matchedText = result.text;
    const matchedLower = matchedText.toLowerCase();

    // Grab a generous context window (150 chars each side)
    const surroundingText = getSurroundingText(emailText, result.index, 150).toLowerCase();

    // 1. Skip OTP / transient code patterns
    if (isTransientCode(matchedLower, surroundingText)) {
      continue;
    }

    // 2. CORE FIX: Only keep dates that are near actionable keywords
    const hasKeyword = DEADLINE_KEYWORDS.some((p) => p.test(surroundingText));
    const hasPhrasing = DEADLINE_PHRASING.some((p) => p.test(matchedLower) || p.test(surroundingText));

    if (!hasKeyword && !hasPhrasing) {
      // This date mention has no deadline context — skip it
      continue;
    }

    let date = result.start.date();

    // Skip dates in the past (more than 1 hour ago)
    const oneHourAgo = new Date(referenceDate.getTime() - 60 * 60 * 1000);
    if (date < oneHourAgo) {
      continue;
    }

    // If no time was explicitly mentioned, default to 23:59:59 IST.
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

const prompt = `You are an intelligent assistant that extracts ACTIONABLE deadlines and events from emails.

**CURRENT DATE AND TIME (IST):** ${currentTimeIST}

Given the following email, identify ONLY dates that represent real deadlines or events such as:
- Submission deadlines, due dates for tasks/assignments/reports
- Event dates (workshops, meetings, webinars, conferences, hackathons)
- Interviews, tests, exams, assessments
- Registration closing dates
- Festivals, holidays, celebrations
- Payment or invoice due dates
- Any "by [date]", "before [date]", or "no later than [date]" mentions

DO NOT extract dates that are:
- Part of email headers, signatures, or footers (e.g. "sent on April 10")
- Timestamps of when something was done in the past (e.g. "we met on Monday")
- Newsletter publish dates or article dates
- Unsubscribe or privacy policy dates
- Casual mentions with no action required

**CRITICAL RULES:**
1. IGNORE expiry times for OTPs, 2FA codes, password reset links, or temporary login tokens
2. Use the CURRENT DATE above to resolve relative references
3. If a time is given (e.g. 2:30 pm), it applies to the closest date mentioned before or after it in the context. Do not assign current date to a time if a future date is mentioned nearby
4. If only a date is mentioned without time, use 23:59:59
5. All dates extracted should strictly be considered in IST. Output ALL dates strictly as: YYYY-MM-DDTHH:MM:SS. Do NOT append 'Z' or timezone offsets
6. If no actionable deadlines or events found, respond with exactly: No deadlines
7. Read the FULL email text carefully — look for the word "deadline" or "due" anywhere in the body

**RESPOND WITH ONLY** a comma-separated list of formatted dates, or "No deadlines". No explanations.

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
      // Match ISO timestamps (without Z, just the numbers)
      const isoMatches = [
        ...llmResponse.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/g),
      ].map((m) => m[0]);

      for (let iso of isoMatches) {
        // Interpret explicitly as IST by appending +05:30
        const date = new Date(iso + '+05:30');
        if (!isNaN(date)) {
          dates.push({
            date,
            source: "llm",
            matchedText: iso,
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
 * LLM results take priority since they are context-aware.
 * Chrono results are only added if no LLM date is close to them.
 * Two dates are considered duplicates if they're within 2 hours of each other.
 */
function mergeAndDeduplicate(chronoDates, llmDates) {
  const DUPLICATE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

  // LLM results take priority — they already understand context
  const merged = [...llmDates];

  // Only add chrono dates that the LLM didn't already find
  for (const chronoDate of chronoDates) {
    const isDuplicate = merged.some(
      (existing) =>
        Math.abs(existing.date.getTime() - chronoDate.date.getTime()) <
        DUPLICATE_WINDOW_MS
    );
    if (!isDuplicate) {
      merged.push(chronoDate);
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

    // Step 1: Chrono extraction (deterministic, but now context-filtered)
    const chronoDates = extractDatesWithChrono(emailText, referenceDate);
    console.log(
      `📅 Chrono found ${chronoDates.length} actionable dates:`,
      chronoDates.map((d) => `"${d.matchedText}" → ${d.date.toISOString()}`).join(", ") || "none"
    );

    // Step 2: LLM extraction (context-aware, primary source of truth)
    const llmDates = await extractDatesWithLLM(email, referenceDate);
    console.log(
      `🤖 LLM found ${llmDates.length} dates:`,
      llmDates.map((d) => `"${d.matchedText}" → ${d.date.toISOString()}`).join(", ") || "none"
    );

    // Step 3: Merge (LLM-first) and deduplicate
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
