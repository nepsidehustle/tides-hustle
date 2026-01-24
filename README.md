# TideTrack v13

A lightweight, dual-engine tide monitoring application for Myrtle Beach and Jamaica Bay. 

## Features

- **Visual Dashboard:** Clean, iOS-style card layout showing real-time water levels and upcoming high/low tides.
- **Siri Integration:** Dedicated API endpoint (`/api/tide-data`) that returns natural language summaries for iOS Shortcuts.
- **Resilient Architecture:** - **Frontend:** Fetches directly from NOAA servers (Client-side) to ensure data freshness and layout stability.
  - **Backend:** Intelligent trend calculation that ignores server timezones to provide accurate "Rising/Falling" logic.

## Technology

- **Framework:** Astro (Serverless)
- **Styling:** Inline CSS (No dependencies, zero-jam layout)
- **Data Source:** NOAA Tides & Currents API

## Disclaimer

**EDUCATIONAL USE ONLY.**

This software is for educational and hobbyist purposes only. The tide data presented is based on predictions and unverified real-time sensor readings. It may be inaccurate due to weather conditions, sensor malfunctions, or API errors.

**DO NOT USE FOR NAVIGATION.** Do not rely on this application for boating, shipping, or any safety-critical decision-making. Always consult official NOAA charts and verified navigation tools.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.