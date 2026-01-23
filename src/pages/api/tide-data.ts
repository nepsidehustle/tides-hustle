export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // 1. THE SCHEDULE (Highs & Lows) - Exact Times
        const scheduleApi = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${Date.now()}`;
        
        // 2. THE NOW (Hourly) - Current Water Level
        const currentApi = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${Date.now()}`;

        const [schedRes, curRes] = await Promise.all([fetch(scheduleApi), fetch(currentApi)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        // Safety Checks
        if (schedJson.error || curJson.error) return { name: site.name, error: "Offline" };

        // Process "Now" Data
        const now = new Date();
        let currentLevel = 0;
        let trend = "Stable";
        
        if (curJson.predictions) {
            // Find the closest hourly point to right now
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/'));
                const cTime = new Date(curr.t.replace(/-/g, '/'));
                return (Math.abs(now.getTime() - cTime.getTime()) < Math.abs(now.getTime() - pTime.getTime()) ? curr : prev);
            });
            currentLevel = parseFloat(closest.v);
            
            // Calculate basic trend (compare to next hour)
            const idx = curJson.predictions.indexOf(closest);
            if (idx < curJson.predictions.length - 1) {
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > currentLevel ? "Rising" : "Falling";
            }
        }

        // Process Schedule Data (Filter out past events)
        const futureEvents = schedJson.predictions ? schedJson.predictions.filter((p: any) => {
            const t = new Date(p.t.replace(/-/g, '/'));
            return t > now; // Only show future
        }).slice(0, 4) : []; // Take next 4 events

        return {
          name: site.name,
          current: { value: currentLevel.toFixed(1), trend: trend },
          timeline: futureEvents.map((p: any) => ({
            time: p.t, // "2026-01-23 17:23"
            type: p.type === 'H' ? 'High Tide' : 'Low Tide',
            value: parseFloat(p.v).toFixed(1)
          })),
          server_version: "4.0"
        };
      })
    );

    return new Response(JSON.stringify(allData), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-maxage=3600" // Cache for 1 hour
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "System Error" }), { status: 500 });
  }
}