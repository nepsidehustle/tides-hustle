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
        // Request 48h schedule, 24h hourly
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        let currentLevel = "unknown";
        let trend = "steady";
        let nextEventText = "No upcoming tides found";
        
        // 1. DETERMINE "NOW" & TREND
        let anchorTime = 0; // Timestamp

        if (curJson.predictions && curJson.predictions.length > 0) {
            const now = new Date();
            
            // Find closest reading to system time
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/')).getTime();
                const cTime = new Date(curr.t.replace(/-/g, '/')).getTime();
                return (Math.abs(now.getTime() - cTime) < Math.abs(now.getTime() - pTime) ? curr : prev);
            });
            
            currentLevel = parseFloat(closest.v).toFixed(1);
            anchorTime = new Date(closest.t.replace(/-/g, '/')).getTime();

            // Trend Logic:
            // If we are at the end of the list, look BACKWARDS to compare.
            // If we are in the middle/start, look FORWARDS.
            const idx = curJson.predictions.indexOf(closest);
            const val = parseFloat(closest.v);
            
            if (idx < curJson.predictions.length - 1) {
                // Look Forward
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > val ? "rising" : "falling";
            } else if (idx > 0) {
                // Look Backward (Backup Plan)
                const prevVal = parseFloat(curJson.predictions[idx-1].v);
                trend = val > prevVal ? "rising" : "falling";
            }
        }

        // 2. FIND NEXT EVENT
        if (schedJson.predictions && anchorTime > 0) {
            // Find first event strictly AFTER our anchor time
            const nextEvent = schedJson.predictions.find((p: any) => {
                const eTime = new Date(p.t.replace(/-/g, '/')).getTime();
                return eTime > anchorTime;
            });
            
            if (nextEvent) {
                const d = new Date(nextEvent.t.replace(/-/g, '/'));
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
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache" } 
    });

  } catch (e) {
    return new Response("Tide data unavailable.", { status: 500 });
  }
}