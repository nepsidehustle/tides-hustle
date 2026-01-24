export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  // Helper: Get "Yesterday" in YYYYMMDD format to cast a wide net
  const getWideNetDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // Go back 1 day
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const beginDate = getWideNetDate();

  try {
    const reports = await Promise.all(
      stations.map(async (site) => {
        const cb = Date.now();
        // STRATEGY: Start from Yesterday, get 72 hours (3 days). 
        // This guarantees we cover "Now" regardless of server timezone.
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        
        // For Current Level, we still use date=latest if possible, but the API doesn't support 'latest' for predictions.
        // So we use the same "Wide Net" strategy: 24h starting yesterday covers "now".
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        let currentLevel = "unknown";
        let trend = "steady";
        let nextEventText = "No upcoming tides found";
        
        // 1. DETERMINE "NOW" & CURRENT LEVEL
        let anchorTime = 0; 

        if (curJson.predictions && curJson.predictions.length > 0) {
            const now = new Date(); // Real-time "Now"
            
            // Find the reading closest to absolute "Now"
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/')).getTime();
                const cTime = new Date(curr.t.replace(/-/g, '/')).getTime();
                return (Math.abs(now.getTime() - cTime) < Math.abs(now.getTime() - pTime) ? curr : prev);
            });
            
            currentLevel = parseFloat(closest.v).toFixed(1);
            anchorTime = new Date(closest.t.replace(/-/g, '/')).getTime();

            // Trend
            const idx = curJson.predictions.indexOf(closest);
            const val = parseFloat(closest.v);
            
            if (idx < curJson.predictions.length - 1) {
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > val ? "rising" : "falling";
            } else if (idx > 0) {
                const prevVal = parseFloat(curJson.predictions[idx-1].v);
                trend = val > prevVal ? "rising" : "falling";
            }
        }

        // 2. FIND NEXT EVENT
        if (schedJson.predictions && anchorTime > 0) {
            // Filter strictly for events in the future (after anchor)
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