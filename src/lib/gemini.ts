/**
 * Gemini AI Service for Craving Crusher & Motivation Coach
 * Reads the Gemini key exclusively from environment variables:
 * import.meta.env.VITE_GEMINI_API_KEY
 */

export async function generateCravingCoachReply(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = [],
  currentWeight: number = 106,
  targetWeight: number = 96
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

  const systemInstruction = `You are a strict but deeply encouraging fitness coach. The user struggles with junk food cravings and forgetting to stand up. When the user opens this chat saying they want to cheat on their diet, provide aggressive positive reinforcement to stop them. Remind them of the 96kg goal (starting from ${currentWeight}kg, aggressive 1.5kg/week fat loss target). You can dynamically switch between English, Hindi, and Hinglish depending on the user's input to make it feel deeply personal and comforting.

Core coaching rules:
1. Aggressive positive reinforcement: Direct, passionate, no sugar-coating, high belief in them ("Bhai/Dost, you didn't come this far to throw it away for 5 minutes of junk!").
2. Remind them constantly of their 96kg target weight and the visual aesthetic goal.
3. Give an immediate physical substitution: Drink 500ml of ice cold water right now, do 20 deep bodyweight squats or 25 pushups, or put their shoes on and walk 400 meters.
4. Keep the tone empathetic yet unwavering. Never allow them to rationalize cheating.
5. Keep response punchy, high-energy, formatted with clean short paragraphs.`;

  // 1. If VITE_GEMINI_API_KEY is configured, call Gemini API directly from client
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      // Build conversation contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // Call Google GenAI REST endpoint
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.8,
              topP: 0.95,
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      }
    } catch (err) {
      console.warn('Direct Gemini API call error:', err);
    }
  }

  // 2. Try proxy backend endpoint if running with Express server
  try {
    const proxyRes = await fetch('/api/chat/craving-crusher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        currentWeight,
        targetWeight,
      }),
    });
    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.reply) {
        return proxyData.reply;
      }
    }
  } catch {
    // Backend offline or running purely as static SPA on Vercel
  }

  // 3. High-energy bilingual fallback coaching response when offline or key not yet added
  const isHindi = /[अ-ह]|bhai|kya|nahi|karo|bhookh|mann|khana/i.test(message);
  if (isHindi) {
    return `Ruk ja abhi ke abhi! Phone side me rakhne se pehle meri ek baat dhyan se sun.

**96 KG.** Yaad hai na ye number? Tu ${currentWeight} kg se shuru kiya hai bhai! Har hafte ka 1.5 kg fat loss target hai hamara.

5 minute ki jeebh ke maze ke liye pure hafte ki calorie deficit ko barbad mat kar! Abhi ye 3 kaam kar:
1. 500ml ice-cold paani ek saans me pi.
2. 20 bodyweight squats maar abhi floor par.
3. 3 lambi saansein le aur 96kg yaad kar.

Discipline beats motivation. Tu koi weak insaan nahi hai. Stand up and crush this craving!`;
  }

  return `Stop right there! Put the delivery app down and look at me.

Your goal is **96 KG**. You started at ${currentWeight} kg with an aggressive 1.5 kg/week fat loss mission. 

Do not throw away an entire week of discipline for 3 minutes of temporary junk food pleasure. You will feel instant regret the moment you finish that bite.

Here is your immediate order:
1. Go drink 500ml of ice-cold water right now.
2. Drop down and give me 20 deep bodyweight squats or 20 pushups.
3. Take 3 deep breaths and remember why you started.

Discipline is choosing what you want most over what you want right now. You are stronger than this craving!`;
}
