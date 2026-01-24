export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    // 1. Gather all reports in parallel
    const reports = await Promise.all(
      stations.map(async (site) => {
        const cb = Date.now();
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        // Defaults
        let currentLevel = "unknown";
        let trend = "stable";
        let nextEventText = "No upcoming tides";

        // Calculate Current Level
        if (curJson.predictions && curJson.predictions.length > 0) {
            const now = new Date();
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pTime = new Date(prev.t.replace(/-/g, '/'));
                const cTime = new Date(curr.t.replace(/-/g, '/'));
                return (Math.abs(now.getTime() - cTime.getTime()) < Math.abs(now.getTime() - pTime.getTime()) ? curr : prev);
            });
            currentLevel = parseFloat(closest.v).toFixed(1);
            
            const idx = curJson.predictions.indexOf(closest);
            if (idx < curJson.predictions.length - 1) {
                const nextVal = parseFloat(curJson.predictions[idx+1].v);
                trend = nextVal > parseFloat(currentLevel) ? "rising" : "falling";
            }
        }

        // Calculate Next Event
        if (schedJson.predictions) {
            const now = new Date();
            const nextEvent = schedJson.predictions.find((p: any) => new Date(p.t.replace(/-/g, '/')) > now);
            if (nextEvent) {
                const d = new Date(nextEvent.t.replace(/-/g, '/'));
                const timeStr = d.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
                const typeStr = nextEvent.type === 'H' ? "High Tide" : "Low Tide";
                nextEventText = `Next is ${typeStr} at ${timeStr}`;
            }
        }

        // BUILD THE SENTENCE
        return `${site.name} is at ${currentLevel} feet and ${trend}. ${nextEventText}.`;
      })
    );

    // 2. Join sentences with a pause (newline)
    const finalSpeech = reports.join("\n\n");

    // 3. Return as PLAIN TEXT
    return new Response(finalSpeech, { 
      status: 200,
      headers: { "Content-Type": "text/plain" } 
    });

  } catch (e) {
    return new Response("I'm sorry, I couldn't reach the tide satellites right now.", { status: 500 });
  }
}