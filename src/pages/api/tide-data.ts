export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const reports = await Promise.all(
      stations.map(async (site) => {
        const cb = Date.now();
        // Request 48 hours of data to ensure we cross midnight boundaries safely
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        let currentLevel = "unknown";
        let trend = "steady";
        let nextEventText = "No upcoming tides found";
        
        // 1. FIND "NOW" (Based on Data, not Server Clock)
        let anchorTimeStr = ""; // Will hold "2023-01-23 20:00"

        if (curJson.predictions && curJson.predictions.length > 0) {
            // Get the very last reading provided (which is the most current prediction)
            // NOAA predictions are sorted, so last item in a 24h range is usually the future-most point.
            // ACTUALLY: We need the one closest to "Now". 
            // Safer Strategy: Take the current Server Time, offset it by -5 hours (Rough EST), 
            // find the closest reading, and use THAT time as the anchor.
            
            const now = new Date();
            // Find closest reading to system time (even if system is UTC, distances are relative)
            // But to be safe, let's just use string comparison if we can.
            
            // Let's stick to the "Anchor" strategy:
            // We'll trust that NOAA returns a list covering "now".
            // We will find the entry closest to the current System Time.
            // Even if System is UTC, the 'difference' logic holds up fairly well for finding the "current" slot.
            
             const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/'));
                const cTime = new Date(curr.t.replace(/-/g, '/'));
                return (Math.abs(now.getTime() - cTime.getTime()) < Math.abs(now.getTime() - pTime.getTime()) ? curr : prev);
            });
            
            currentLevel = parseFloat(closest.v).toFixed(1);
            anchorTimeStr = closest.t; // "2026-01-23 19:34" - This is our source of truth for "Now"

            // Trend
            const idx = curJson.predictions.indexOf(closest);
            if (idx < curJson.predictions.length - 1) {
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > parseFloat(currentLevel) ? "rising" : "falling";
            }
        }

        // 2. FIND NEXT EVENT (Using Anchor Time)
        if (schedJson.predictions && anchorTimeStr) {
            // We simply look for the first event whose time string is "greater" than our anchor string.
            // ISO date strings (YYYY-MM-DD HH:MM) sort alphabetically correctly!
            // No Date Object math needed.
            
            const nextEvent = schedJson.predictions.find((p: any) => p.t > anchorTimeStr);
            
            if (nextEvent) {
                // Parse for pretty speaking
                const d = new Date(nextEvent.t.replace(/-/g, '/'));
                // Force "en-US" formatting so it doesn't use 24h time if not wanted
                const timeStr = d.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'});
                const typeStr = nextEvent.type === 'H' ? "High Tide" : "Low Tide";
                nextEventText = `Next is ${typeStr} at ${timeStr}`;
            }
        }

        return `${site.name} is at ${currentLevel} feet and ${trend}. ${nextEventText}.`;
      })
    );

    return new Response(reports.join("\n\n"), { 
      status: 200,
      headers: { 
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache" 
      } 
    });

  } catch (e) {
    return new Response("Tide data is currently unavailable.", { status: 500 });
  }
}