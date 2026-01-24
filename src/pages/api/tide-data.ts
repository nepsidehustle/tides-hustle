export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        const cb = Date.now();
        // 1. Get Schedule (High/Low times)
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        
        // 2. Get Current Level (Hourly)
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        // Defaults
        let currentLevel = "---";
        let trend = "Stable";
        let futureEvents = [];

        // Process Current Data
        if (curJson.predictions && curJson.predictions.length > 0) {
            const now = new Date();
            // Find closest hourly reading to "now"
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/'));
                const cTime = new Date(curr.t.replace(/-/g, '/'));
                return (Math.abs(now.getTime() - cTime.getTime()) < Math.abs(now.getTime() - pTime.getTime()) ? curr : prev);
            });
            currentLevel = parseFloat(closest.v).toFixed(1);
            
            // Calculate Trend
            const idx = curJson.predictions.indexOf(closest);
            if (idx < curJson.predictions.length - 1) {
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > parseFloat(currentLevel) ? "Rising" : "Falling";
            }
        }

        // Process Timeline (Future Only)
        if (schedJson.predictions) {
            const now = new Date();
            futureEvents = schedJson.predictions.filter((p: any) => {
                const t = new Date(p.t.replace(/-/g, '/'));
                return t > now;
            }).slice(0, 4).map((p: any) => ({
                time: p.t,
                type: p.type === 'H' ? 'High Tide' : 'Low Tide',
                value: parseFloat(p.v).toFixed(1)
            }));
        }

        // Return Clean JSON for Siri
        return {
          name: site.name,
          current: { value: currentLevel, trend: trend },
          timeline: futureEvents
        };
      })
    );

    return new Response(JSON.stringify(allData), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "System Error" }), { status: 500 });
  }
}