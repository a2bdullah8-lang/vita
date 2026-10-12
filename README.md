# VITA | Aesthetic Health, Deficit & Fitness Tracker (PWA)

An ultra-premium, full-stack Progressive Web App (PWA) for personal health, calorie deficit tracking, dual-mode workouts, and AI craving coaching—designed with a clean minimalist vector aesthetic inspired by Apple, COS, and Airbnb.

---

## Features

- **Goal Architecture & Body Stats:** Pre-configured for aggressive fat loss (1.0–1.5 kg/week, from 106 kg down to 96 kg) with calculated daily deficit ceilings.
- **Dynamic Concentric Health Rings:** Apple Fitness-inspired SVG progress rings tracking Calories Consumed vs. Calories Burned vs. Daily Step Goal (10,000 steps).
- **Google Health & Fitness Sync:** Step counting, active calories burned, distance tracking, and hourly stagnation detection (< 250 steps/hr).
- **Dual-Mode Workout Engine:**
  - *Home Mode:* 6-day split tailored for adjustable dumbbells, resistance bands, and grip strengtheners, featuring a global session timer and a 60-second rest timer with Web Speech API audio announcements.
  - *Gym Mode:* Fast manual logger for commercial gym sessions.
- **Nutrition & Deficit Tracker:** Calorie and macronutrient logging with a visual warning system that alerts when approaching or exceeding the 1.5 kg/week deficit ceiling.
- **AI 'Craving Crusher' Motivation Coach:** Integrated with Gemini (`gemini-2.5-flash`), dynamically speaking English, Hindi, and Hinglish with aggressive positive reinforcement and actionable substitution tasks.
- **Persistent Intelligent Reminders:** Web Push notification triggers for Hydration (2h), Movement (< 250 steps/hr), and Morning Mindset (96 kg target).
- **PWA & Offline First:** Standalone installable app with Web App Manifest, service worker, and dual Firebase / LocalStorage persistence.

---

## Environment Variables

Copy `.env.example` to `.env` or `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Google Gemini API Key for the Craving Crusher AI Coach | Recommended (falls back to offline coach) |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key for cross-device Firestore persistence | Optional (falls back to local storage) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Optional |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Optional |
| `VITE_FIREBASE_DATABASE_ID` | Firestore Database ID (if using custom DB instance) | Optional |
| `VITE_GOOGLE_HEALTH_CLIENT_ID`| Google Health / Fitness OAuth 2.0 Client ID | Optional |

> **Get a free Gemini API key:** [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/vita-health-pwa.git
   cd vita-health-pwa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Add your VITE_GEMINI_API_KEY in .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deploying to Vercel

1. Push this repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your repository.
4. Framework Preset will be automatically detected as **Vite**.
5. In **Environment Variables**, add:
   - `VITE_GEMINI_API_KEY`: `your_gemini_api_key_here`
   - *(Optional)* Add any `VITE_FIREBASE_*` variables if using remote cloud sync.
6. Click **Deploy**.

Vercel will run `npm run build` and deploy the SPA using the pre-configured `vercel.json` rewrite rules.

---

## Tech Stack

- **Framework:** React 19, TypeScript
- **Bundler:** Vite 8, `vite-plugin-pwa`
- **Styling:** Tailwind CSS v4
- **AI Model:** Google Gemini (`@google/genai`, `gemini-2.5-flash`)
- **Speech & Audio:** Web Speech API (`window.speechSynthesis`) + Web Audio API (`AudioContext`)
- **Database & Auth:** Firebase Firestore & Firebase Auth (with offline fallback)
