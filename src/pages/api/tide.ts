export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();

      if (!data.predictions) return `${site.name} is currently offline.`;

      const preds = data.predictions;
      const nowVal = parseFloat(preds[0].v);
      const nextVal = parseFloat(preds[1].v);
      const isRising = nextVal > nowVal;
      
      // FALLBACK LOGIC:
      // If rising, find the absolute MAX in the next 12 points.
      // If falling, find the absolute MIN in the next 12 points.
      let targetPoint = preds[0];
      let limit = Math.min(preds.length, 14); // Look about 14 hours ahead

      if (isRising) {
        // Find highest
        for(let i=0; i<limit; i++) {
            if (parseFloat(preds[i].v) > parseFloat(targetPoint.v)) targetPoint = preds[i];
        }
      } else {
        // Find lowest
        for(let i=0; i<limit; i++) {
             if (parseFloat(preds[i].v) < parseFloat(targetPoint.v)) targetPoint = preds[i];
        }
      }

      const eventType = isRising ? "High Tide" : "Low Tide";
      const eventHeight = parseFloat(targetPoint.v).toFixed(1);
      
      // Parse time safely
      let timeStr = targetPoint.t.split(" ")[1]; // "14:30"
      let [h, m] = timeStr.split(":");
      let hours = parseInt(h);
      let ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;

      return `${site.name} is ${nowVal.toFixed(1)}ft and ${isRising ? "rising" : "falling"}. Next ${eventType} is ${eventHeight}ft at ${hours}:${m} ${ampm}.`;
    }));

    return new Response(results.join(" "), { status: 200 });
  } catch (e) {
    return new Response("Siri is having trouble connecting to NOAA.", { status: 200 });
  }
}