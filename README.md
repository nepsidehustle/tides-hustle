# TideTrack

A dual-engine tide monitoring application for Myrtle Beach and Jamaica Bay. 

## 🚀 Live Demo
- **Dashboard:** `https://[your-site].pages.dev`
- **Siri Feed:** `https://[your-site].pages.dev/api/tide-data`

## ✨ Features

### 1. Visual Dashboard (Frontend)
- **High Precision Mode:** Fetches data every **6 minutes** for near real-time water levels.
- **Zero-Crash Architecture:** Fetches data directly from NOAA in the browser (Client-side).
- **Jamless Layout:** Uses HTML Tables and Inline CSS to prevent layout shifts.
- **Auto-Timezone:** Clock detects browser location (EST/EDT/PST).

### 2. Siri Intelligence (Backend API)
- **Natural Language:** Returns a simple paragraph of text Siri can read directly.
- **Timezone Proof:** Uses "Integer Math" (e.g., `20260123`) to sync NOAA data with Wall Clock time, ignoring Server UTC offsets.
- **Smart Trends:** Calculates "Rising/Falling" logic by scanning 6-minute intervals.

## 📱 How to Set Up Siri

1. Open **Shortcuts** on iPhone.
2. Create a new Shortcut named **"Check Tides"**.
3. Add Action: **"Get Contents of URL"** -> Paste your `/api/tide-data` link.
4. Add Action: **"Speak Text"** -> Select `Contents of URL`.
5. Done.

## 🛠️ Tech Stack

- **Framework:** Astro (Serverless)
- **Deployment:** Cloudflare Pages
- **Data:** NOAA Tides & Currents API

## ⚠️ Disclaimer

**EDUCATIONAL USE ONLY.**
This data is estimated and may be inaccurate. 
**DO NOT USE FOR NAVIGATION.** Not affiliated with NOAA.

## License

MIT License. Copyright (c) 2026 TideTrack.