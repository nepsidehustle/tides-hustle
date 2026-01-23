# 🌊 TideTrack Pro

**TideTrack Pro** is a high-precision maritime dashboard and API designed to track real-time water levels and forecast tidal cycles for specific US coastal locations. 

Unlike standard tide tables, this application visualizes data using smooth Bezier curves to model the natural swell of the ocean and provides a dedicated text-to-speech endpoint optimized for Apple Siri / iOS Shortcuts.

---

## 🚀 Live Endpoints

| Component | URL | Description |
| :--- | :--- | :--- |
| **Dashboard** | `https://tides-hustle.pages.dev/` | The visual frontend. Shows 48-hour wave forecasts. |
| **Siri API** | `https://tides-hustle.pages.dev/api/tide` | Plain text output for voice assistants. |
| **JSON Data** | `https://tides-hustle.pages.dev/api/tide-data` | The raw JSON feed powering the dashboard. |

---

## 🛠️ Tech Stack

* **Framework:** [Astro](https://astro.build/) (Server-Side Rendering enabled)
* **Language:** TypeScript
* **Visualization:** Chart.js (with specific Bezier interpolation)
* **Styling:** Tailwind CSS
* **Data Source:** NOAA Tides & Currents CO-OPS API
* **Hosting:** Cloudflare Pages

---

## 🧠 The Architecture

The application bypasses the need for a database by acting as a **Smart Proxy** between the user and NOAA.

1.  **Request:** User loads the Dashboard or triggers Siri.
2.  **Fetch:** The Server (Astro API route) hits NOAA's servers immediately.
3.  **Process:** * For the **Dashboard**, we request **Hourly** data for 48 hours to draw smooth curves.
    * For **Siri**, we request **High/Low** intervals to get exact prediction times.
4.  **Response:** The processed data is sent to the client with `Cache-Control` headers to ensure freshness.

---

## 📂 Codebase Breakdown

### 1. The Dashboard (`src/pages/index.astro`)
This is the "Face" of the application. It fetches data from our internal API and renders it using Chart.js.

**Key Features & Logic:**
* **Defensive Error Handling:** The code checks `!res.ok` and `data.error` before attempting to render. If NOAA is down, the dashboard displays a Red Error Box instead of crashing.
* **Bezier Smoothing:** We use `tension: 0.4` in Chart.js. This turns jagged data points into smooth, organic waves.
* **Visual Hierarchy:**
    * **Hourly Points:** Rendered as small dots (radius 2).
    * **Peak Events (High/Low):** Rendered as large dots (radius 6) for instant visibility.
* **Category Scaling:** We use `type: 'category'` for the X-Axis. This prevents "Horizontal Line" bugs caused by browser timezone disagreements.

### 2. The Dashboard Data Feed (`src/pages/api/tide-data.ts`)
**Purpose:** Fetches raw data for the charts.
**NOAA Strategy:**
* **`interval=h` (Hourly):** We strictly use hourly data. 6-minute data (720 points) proved too noisy for mobile phone charts.
* **`range=48` (48 Hours):** Provides a comprehensive view of the cycle (yesterday, today, and tomorrow).
* **`date=today`:** The critical fix. We request data starting from 00:00 local time to ensure NOAA accepts the Prediction request.

### 3. The Siri "Brain" (`src/pages/api/tide.ts`)
**Purpose:** Generates a human-readable sentence for voice assistants.
**The "Two-Request" Strategy:**
To achieve maximum accuracy, this endpoint performs two parallel fetches:
1.  **Current Status:** Fetches `interval=h` (Hourly) to answer "How high is the water *right now*?"
2.  **Future Schedule:** Fetches `interval=hilo` (High/Low) to answer "When is the *exact minute* of the next peak?"

**Why this matters:**
Calculating peaks manually from hourly data often resulted in "rounding errors" (e.g., saying 5:00 PM instead of 5:23 PM). By asking NOAA for the `hilo` schedule directly, Siri is accurate to the minute.

---

## 📡 The NOAA API Configuration

We access the NOAA CO-OPS API (`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`). Below is a breakdown of the "Magic String" parameters we use:

| Parameter | Value | Explanation |
| :--- | :--- | :--- |
| `station` | `8661070`... | The unique ID for the tide gauge (e.g., Myrtle Beach). |
| `product` | `predictions` | We want the forecast model, not raw sensor data (which can have gaps). |
| `datum` | `MLLW` | **Mean Lower Low Water**. The standard maritime chart datum. 0.0 is the average lowest tide. |
| `units` | `english` | Returns Feet (ft) instead of Meters. |
| `time_zone` | `lst_ldt` | **Local Standard/Daylight Time**. Adjusts automatically for Daylight Savings. |
| `interval` | `h` / `hilo` | `h` for hourly graphs; `hilo` for peak times. |
| `date` | `today` | Requests data starting from midnight local time. |
| `cb` | `${Date.now()}` | **Cache Buster**. A random number added to the URL to force Cloudflare to fetch fresh data. |

---

## ⚙️ Development & Build Process

### Prerequisites
* Node.js (v18 or higher)
* npm

### Local Setup
1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd tide-track-pro
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Access the site at `http://localhost:4321`.

### Adding a New Station
To track a new location, edit `src/pages/api/tide-data.ts` AND `src/pages/api/tide.ts`.

1.  Find the `stations` array:
    ```typescript
    const stations = [
      { id: "8661070", name: "Myrtle Beach" },
      { id: "8517201", name: "Jamaica Bay" },
      // Add new station below:
      { id: "YOUR_STATION_ID", name: "New Location" }
    ];
    ```
2.  **Finding IDs:** Search for your location on the [NOAA Tides & Currents Map](https://tidesandcurrents.noaa.gov/map/). Use the 7-digit Station ID.

---

## 🐛 Troubleshooting Guide

### Issue: "NOAA API Error" on Dashboard
* **Cause:** NOAA rejected the query parameters.
* **Solution:** Check `src/pages/api/tide-data.ts`. Ensure `date=today` is used. Do NOT use `date=latest` for predictions.

### Issue: Flat/Straight Lines on Chart
* **Cause:** Chart.js cannot parse the X-Axis dates, or data density is too high.
* **Solution:** Ensure `src/pages/index.astro` is using `type: 'category'` for the X-Axis scale. Ensure the API is returning `interval=h` (Hourly) data, not 6-minute data.

### Issue: Siri says "Sensors Unavailable"
* **Cause:** The fetch request timed out or returned malformed JSON.
* **Solution:** The code has a fallback. If this persists, verify NOAA's servers are up by visiting the `/api/tide` URL in a browser.

---

## 📅 Version History

* **v1.0:** Initial Setup (Hourly data, Basic Charts).
* **v1.1:** Attempted 6-minute high-res data (Reverted due to "Straight Line" bugs).
* **v2.0 (The Golden Build):** * Switched to `date=today` for stability.
    * Implemented `interval=hilo` for accurate Siri predictions.
    * Added visual "In-Between" dots (radius 2) and Peak dots (radius 6).
    * Added `Cache-Control` headers.

---

*Built with 🧂 Salt Water and TypeScript.*