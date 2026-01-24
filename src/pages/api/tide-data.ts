export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach", timeZone: "America/New_York" },
    { id: "8517201", name: "Jamaica Bay", timeZone: "America/New_York" }
  ];

  // 1. Helper: Get "Station Time" formatted exactly like NOAA (YYYY-MM-DD HH:MM)
  // This ignores your laptop time and the server time. It calculates "Wall Clock Time" in NY.
  const getStationTimeStr = (zone: string) => {
    const opts: Intl.DateTimeFormatOptions = {
        timeZone: zone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
    };
    const parts = new Intl.DateTimeFormat("en-CA", opts).formatToParts(new Date());
    
    // Reassemble manually to be bulletproof (Map parts to YYYY-MM-DD HH:MM)
    const p = (type: string) => parts.find(x => x.type === type)?.value || "00";
    return `${p('year')}-${p('month')}-${p('day')} ${p('hour')}:${p('minute')}`;
  };

  // Helper: Get Yesterday for wide net
  const getWideNetDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1); 
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
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        let currentLevel = "unknown";
        let trend = "steady";
        let nextEventText = "No upcoming tides";
        
        // --- THE "NEW YORK WATCH" FIX ---
        // We generate "2026-01-23 20:30" strictly in the station's timezone.
        const nowString = getStationTimeStr(site.timeZone);

        let anchorTimeStr = ""; 

        if (curJson.predictions && curJson.predictions.length > 0) {
            // Find reading closest to our Station Time String
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                // String comparison works because ISO format (YYYY-MM-DD) sorts alphabetically!
                // We don't even need to parse Dates. Closer string = Closer time.
                // We use simple string diff logic here or Date parsing just for 'diff' math.
                const nowTime = Date.parse(nowString.replace(" ", "T")); 
                const pTime = Date.parse(prev.t.replace(" ", "T"));
                const cTime = Date.parse(curr.t.replace(" ", "T"));
                return (Math.abs(nowTime - cTime) < Math.abs(nowTime - pTime) ? curr : prev);
            });
            
            currentLevel = parseFloat(closest.v).toFixed(1);
            anchorTimeStr = closest.t; // Keep NOAA's string

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

        // 3. FIND NEXT EVENT
        if (schedJson.predictions && anchorTimeStr) {
            // String Compare: "2026-01-23 22:00" > "2026-01-23 20:30"
            const nextEvent = schedJson.predictions.find((p: any) => p.t > anchorTimeStr);
            
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