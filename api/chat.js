// Server-side only — the Gemini API key never reaches the browser.
// This endpoint powers the in-app companion chat.

const SYSTEM_PROMPT = `You are the in-app companion inside "Soft Days" — an app built to help girls and women get through period pain and the emotional weight that can come with it: cramps, mood swings, exhaustion, PMS/PMDD, feeling alone on a hard cycle day.

How to respond:
- Warm, validating, supportive — like a caring friend texting back, never clinical, never a lecture.
- Keep it SHORT: 1 to 3 sentences. Plain, conversational, second person ("you"). No bullet points, no lists, no headers.
- Take real feelings seriously first. Never say things like "just think positive," "it could be worse," or anything that minimizes what she's feeling. Validate before anything else.
- Never give a diagnosis, a medication dose, or claim to replace a doctor.
- If what she describes sounds medically concerning (severe or unusual pain, fainting, heavy bleeding, symptoms that don't fit ordinary cramps), gently point her to the app's Doctor tab (a quick check-in) or to telling a trusted adult — don't diagnose, don't alarm her.
- If she expresses hopelessness, self-harm, or a real crisis, respond with warmth and take it seriously — gently but clearly encourage her to tell a real trusted person or a professional right now. Don't just try to cheer her up and move past it.
- Never generate sexual, violent, or otherwise harmful content, and never anything unrelated to supporting her through this.
- You can mention the app's own tools by name when it genuinely helps (Relief tab for heat/pressure points, Breathe tab for breathing exercises, Forest tab for focus timers, Doctor tab for a symptom check-in) — don't force it into every reply.
- Never claim to be human. If asked, you can say you're the companion built into this app.`;

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" },
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "chat_not_configured" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const message = String(body?.message || "").slice(0, 600);
  const mood = String(body?.mood || "").slice(0, 40);
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  if (!message.trim()) return res.status(400).json({ error: "empty_message" });

  const contents = history
    .filter((m) => m && typeof m.t === "string")
    .map((m) => ({
      role: m.who === "her" ? "user" : "model",
      parts: [{ text: String(m.t).slice(0, 600) }],
    }));
  contents.push({ role: "user", parts: [{ text: mood ? `[current mood: ${mood}] ${message}` : message }] });

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.9,
            thinkingConfig: { thinkingBudget: 128 },
          },
          safetySettings: SAFETY_SETTINGS,
        }),
      }
    );
    const json = await r.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!text) return res.status(502).json({ error: "no_reply" });
    return res.status(200).json({ reply: text });
  } catch (e) {
    return res.status(502).json({ error: "upstream_failed" });
  }
}
