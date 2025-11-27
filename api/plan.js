// Vercel Serverless Function: /api/plan
// Node 18+ has fetch built in

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const goal = (body.goal || '').trim();

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
    }

    const prompt = `
You are a practical, encouraging career coach for international students.

The user’s main job search goal is: "${goal}".

Create a list of EXACTLY 30 tiny, concrete daily actions that would move them closer to this goal over the next 30 days.

Rules:
- Make each step small enough to complete in 15–45 minutes.
- Vary the actions: networking, applications, research, skills, reflection, etc.
- Tailor them to international students (consider visas, networking from campus, LinkedIn, alumni, etc.).
- Use this exact format (no intro, no outro):

Day 1: ...
Day 2: ...
...
Day 30: ...
    `.trim();

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a concise, pragmatic career coach.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!completion.ok) {
      const errorText = await completion.text();
      console.error('OpenAI error:', errorText);
      return res.status(500).json({ error: 'OpenAI API error' });
    }

    const data = await completion.json();
    const planText = data.choices?.[0]?.message?.content?.trim() || '';

    return res.status(200).json({ plan: planText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
