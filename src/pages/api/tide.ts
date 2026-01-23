export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // FIX: Changed to 'date=today' so NOAA accepts the request
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();

      if (!data.predictions) return `${site.name} data is currently unavailable.`;

      const preds = data.predictions;
      
      // Since 'date=today' starts at midnight, we need to find "NOW" in the list
      const now = new Date();
      // Find the point in the array closest to the current time
      const currentIndex = preds.findIndex((p: any) => {
          const pTime = new Date(p.t.replace(/-/g, "/"));
          return pTime > now;
      }) || 0;

      // Use the closest point as "Current"
      const currentPoint = preds[currentIndex] || preds[0];
      const nextPoint = preds[currentIndex + 1] || preds[1];
      
      const nowVal = parseFloat(currentPoint.v);
      const nextVal = parseFloat(nextPoint.v);
      const isRising = nextVal > nowVal;

      // Find the next Peak/Valley starting from right now
      let targetPoint = currentPoint;
      let limit = Math.min(preds.length, currentIndex + 12); 

      if (isRising) {
        for(let i=currentIndex; i<limit; i++) {
            if (parseFloat(preds[i].v) > parseFloat(targetPoint.v)) targetPoint = preds[i];
        }
      } else {
        for(let i=currentIndex; i<limit; i++) {
             if (parseFloat(preds[i].v) < parseFloat(targetPoint.v)) targetPoint = preds[i];
        }
      }

      const eventType = isRising ? "High Tide" : "Low Tide";
      const eventHeight = parseFloat(targetPoint.v).toFixed(1);
      
      let timeStr = targetPoint.t.split(" ")[1];
      let [h, m] = timeStr.split(":");
      let hours = parseInt(h);
      let ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;

      return `${site.name} is ${nowVal.toFixed(1)}ft and ${isRising ? "rising" : "falling"}. Next ${eventType} is ${eventHeight}ft at ${hours}:${m} ${ampm}.`;
    }));

    return new Response(results.join(" "), { status: 200 });
  } catch (e) {
    return new Response("Siri cannot connect to NOAA right now.", { status: 200 });
  }
}