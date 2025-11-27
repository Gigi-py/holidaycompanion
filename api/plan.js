// api/plan.js
// Simple GET endpoint: /api/plan?goal=...

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Use GET /api/plan?goal=..." });
    }

    // Extract ?goal=... from URL
    const url = new URL(req.url, "https://dummy-base");
    const goal = (url.searchParams.get("goal") || "").trim();

    if (!goal) {
      return res.status(400).json({ error: "Goal is required", plan: "" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in Vercel env");
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY is not set", plan: "" });
    }

    const prompt = `
You are a practical, encouraging coach for international students.

The user’s main goal is: "${goal}".

Create a list of EXACTLY 30 tiny, concrete daily actions that would move them closer to this goal over the next 30 days.

Rules:
- Each step must be small enough to finish in 15–45 minutes.
- Mix networking, applications, research, skills, reflection, and self-care.
- Assume they are on a student visa and may be on campus or at home.
- Output ONLY in this format (no intro, no outro):

Day 1: ...
Day 2: ...
...
Day 30: ...
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a concise, pragmatic career coach." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return res
        .status(500)
        .json({ error: "OpenAI API error", plan: "" });
    }

    const data = await response.json();
    const planText = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!planText) {
      console.error("No content in OpenAI response:", JSON.stringify(data));
      return res
        .status(500)
        .json({ error: "No content from OpenAI", plan: "" });
    }

    return res.status(200).json({ plan: planText });
  } catch (err) {
    console.error("Server error in /api/plan:", err);
    return res.status(500).json({ error: "Server error", plan: "" });
  }
};
