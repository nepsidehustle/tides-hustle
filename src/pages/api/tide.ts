export const prerender = process.env.DEPLOY_TARGET !== 'caddy';
export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // Request 1: Get the exact High/Low times (Marine Precision)
      // interval=hilo tells NOAA: "Just give me the peaks and valleys times"
      const hiloApi = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&cb=${Date.now()}`;
      
      // Request 2: Get the CURRENT level (Hourly data for right now)
      const currentApi = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;

      const [hiloRes, curRes] = await Promise.all([fetch(hiloApi), fetch(currentApi)]);
      const hiloData = await hiloRes.json();
      const curData = await curRes.json();

      // Safety checks
      if (!hiloData.predictions || !curData.predictions) return `${site.name} is offline.`;

      // 1. Get Current Status
      const current = curData.predictions[0]; // The single point for "Now"
      const curVal = parseFloat(current.v);

      // 2. Find the NEXT High or Low in the list
      const now = new Date();
      // Filter for events that are in the future
      const nextEventObj = hiloData.predictions.find((p: any) => {
          const t = new Date(p.t.replace(/-/g, "/"));
          return t > now;
      });

      // If we found a future event, format it
      let eventText = "unknown";
      if (nextEventObj) {
          const type = nextEventObj.type === "H" ? "High Tide" : "Low Tide";
          const height = parseFloat(nextEventObj.v).toFixed(1);
          
          // Format time: 17:23 -> 5:23 PM
          const [d, t] = nextEventObj.t.split(" ");
          let [h, m] = t.split(":");
          let hour = parseInt(h);
          const ampm = hour >= 12 ? "PM" : "AM";
          hour = hour % 12 || 12;
          
          eventText = `${type} is ${height}ft at ${hour}:${m} ${ampm}`;
      }

      // Determine rising/falling based on whether the next event is High (must be rising) or Low (must be falling)
      const status = nextEventObj && nextEventObj.type === "H" ? "rising" : "falling";

      return `${site.name} is ${curVal.toFixed(1)}ft and ${status}. Next ${eventText}.`;
    }));

    return new Response(results.join(" "), { status: 200 });
  } catch (e) {
    return new Response("Siri is syncing with NOAA...", { status: 200 });
  }
}