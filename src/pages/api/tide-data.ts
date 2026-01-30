export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach", timeZone: "America/New_York" },
    { id: "8517201", name: "Jamaica Bay", timeZone: "America/New_York" },
    { id: "9410580", name: "Newport Beach", timeZone: "America/Los_Angeles" }
  ];

  const getWallClockInt = (zone: string) => {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { 
        timeZone: zone, 
        hour12: false, 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: 'numeric', minute: 'numeric' 
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "0";
    
    const yyyy = getPart('year');
    const mm = getPart('month').padStart(2, '0');
    const dd = getPart('day').padStart(2, '0');
    const hh = getPart('hour').padStart(2, '0');
    const min = getPart('minute').padStart(2, '0');
    
    return parseInt(`${yyyy}${mm}${dd}${hh}${min}`);
  };

  const noaaToInt = (t: string) => parseInt(t.replace(/[- :]/g, ''));

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
        // Request 6-minute precision data (no interval=h)
        const schedUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&application=TideTrack&cb=${cb}`;
        const curUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${beginDate}&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&format=json&application=TideTrack&cb=${cb}`;

        const [schedRes, curRes] = await Promise.all([fetch(schedUrl), fetch(curUrl)]);
        const schedJson = await schedRes.json();
        const curJson = await curRes.json();

        let currentLevel = "unknown";
        let trend = "steady";
        let nextEventText = "No upcoming tides";
        
        const nowInt = getWallClockInt(site.timeZone);
        let anchorInt = 0; 

        if (curJson.predictions && curJson.predictions.length > 0) {
            const closest = curJson.predictions.reduce((prev: any, curr: any) => {
                const pInt = noaaToInt(prev.t);
                const cInt = noaaToInt(curr.t);
                return (Math.abs(nowInt - cInt) < Math.abs(nowInt - pInt) ? curr : prev);
            });
            
            currentLevel = parseFloat(closest.v).toFixed(1);
            anchorInt = noaaToInt(closest.t);

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

        if (schedJson.predictions && anchorInt > 0) {
            const nextEvent = schedJson.predictions.find((p: any) => noaaToInt(p.t) > anchorInt);
            if (nextEvent) {
                const [_, timePart] = nextEvent.t.split(' ');
                let [h, m] = timePart.split(':');
                let suffix = 'AM';
                let hour = parseInt(h);
                if (hour >= 12) { suffix = 'PM'; if (hour > 12) hour -= 12; }
                if (hour === 0) { hour = 12; }
                
                const timeStr = `${hour}:${m} ${suffix}`;
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