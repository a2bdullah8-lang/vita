import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory synced Google Health state for the active day
let currentHealthSyncData = {
  connected: true,
  lastSyncTime: new Date().toISOString(),
  steps: 7840,
  targetSteps: 10000,
  activeCalories: 640,
  distanceKm: 5.8,
  // 24-hour step distribution (0-23)
  hourlySteps: [0, 0, 0, 0, 0, 0, 180, 850, 1200, 420, 680, 950, 1100, 310, 180, 720, 850, 400, 0, 0, 0, 0, 0, 0],
  lastHourSteps: 180, // < 250 triggers movement reminder
};

// 1. Google Health API endpoints & OAuth structure
app.get('/api/health/oauth-config', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/health/oauth-callback`;
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID || 'demo-google-health-client-id.apps.googleusercontent.com';
  const scopes = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.location.read',
  ];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
    scopes.join(' ')
  )}&access_type=offline&prompt=consent`;

  res.json({
    clientId,
    redirectUri,
    scopes,
    authUrl,
    isMock: !process.env.GOOGLE_HEALTH_CLIENT_ID,
  });
});

app.get('/api/health/sync', (req, res) => {
  res.json({
    success: true,
    data: currentHealthSyncData,
  });
});

app.post('/api/health/connect-toggle', (req, res) => {
  const { connected } = req.body;
  currentHealthSyncData.connected = Boolean(connected);
  currentHealthSyncData.lastSyncTime = new Date().toISOString();
  res.json({ success: true, data: currentHealthSyncData });
});

app.post('/api/health/add-steps', (req, res) => {
  const { steps = 500 } = req.body;
  const numSteps = Math.max(0, Number(steps));
  currentHealthSyncData.steps += numSteps;
  currentHealthSyncData.activeCalories += Math.round(numSteps * 0.045);
  currentHealthSyncData.distanceKm = Number((currentHealthSyncData.steps * 0.00078).toFixed(2));
  currentHealthSyncData.lastHourSteps += numSteps;
  currentHealthSyncData.lastSyncTime = new Date().toISOString();

  const currentHour = new Date().getHours();
  currentHealthSyncData.hourlySteps[currentHour] = (currentHealthSyncData.hourlySteps[currentHour] || 0) + numSteps;

  res.json({ success: true, data: currentHealthSyncData });
});

app.post('/api/health/simulate-hour-stagnant', (req, res) => {
  // Sets last hour steps to 120 (< 250) to demonstrate movement push notification
  currentHealthSyncData.lastHourSteps = 120;
  currentHealthSyncData.lastSyncTime = new Date().toISOString();
  res.json({ success: true, data: currentHealthSyncData });
});

// 2. AI 'Craving Crusher' & Motivation Coach (Gemini Integration)
app.post('/api/chat/craving-crusher', async (req, res) => {
  try {
    const { message, history = [], currentWeight = 106, targetWeight = 96 } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const systemPrompt = `You are a strict but deeply encouraging fitness coach. The user struggles with junk food cravings and forgetting to stand up. When the user opens this chat saying they want to cheat on their diet, provide aggressive positive reinforcement to stop them. Remind them of the 96kg goal (starting from ${currentWeight}kg, aggressive 1.5kg/week fat loss target). You can dynamically switch between English, Hindi, and Hinglish depending on the user's input to make it feel deeply personal and comforting.

Core coaching rules:
1. Aggressive positive reinforcement: Direct, passionate, no sugar-coating, high belief in them ("Bhai/Dost, you didn't come this far to throw it away for 5 minutes of junk!").
2. Remind them constantly of their 96kg target weight and the visual aesthetic goal.
3. Give an immediate physical substitution: Drink 500ml of ice cold water right now, do 20 deep bodyweight squats or 25 pushups, or put their shoes on and walk 400 meters.
4. Keep the tone empathetic yet unwavering. Never allow them to rationalize cheating.
5. Keep response punchy, high-energy, formatted with clean short paragraphs.`;

    if (!ai) {
      // Fallback if no GEMINI_API_KEY is configured
      const hinglishFallback = `Listen to me right now! Look at where you started: 106 kg. Look at where you are heading: 96 kg. That is 10 kg of pure discipline and grit waiting for you on the scale! 

Do NOT throw away a whole week of hard calorie deficit for a 3-minute burst of sugar or oily junk. You will feel regret the second you swallow that last bite. 

Here is what you are going to do right this second:
1. Go to the kitchen, pour 500ml of cold water, and drink it down completely.
2. Drop down and give me 20 bodyweight squats or 15 slow pushups.
3. Take 3 deep breaths and look at your target weight: 96 KG. 

Discipline is choosing what you want most over what you want right now. Stand up and crush this craving! Aawaaz do, can you do this?!`;
      res.json({ reply: hinglishFallback });
      return;
    }

    // Format contents with history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    const reply = response.text || 'Stay focused on your 96kg target! Drink a full glass of water and crush the craving!';
    res.json({ reply });
  } catch (error: any) {
    console.error('Craving Crusher API Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate coaching response',
      fallback: 'Stay disciplined! Remember your 96kg target weight. Drink 500ml of water and step away from the kitchen immediately!',
    });
  }
});

// 3. Vite development middleware or static production serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`VITA Health server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
