export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // 1. Fetch 48 hours of HOURLY data. Hourly is better for finding peaks without "noise".
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();
      const predictions = data.predictions;

      // 2. Determine "Current" Status
      // We look at the first two points to see if the water is going up or down.
      const nowVal = parseFloat(predictions[0].v);
      const nextVal = parseFloat(predictions[1].v);
      const isRising = nextVal > nowVal;
      const status = isRising ? "rising" : "falling";

      // 3. Find the NEXT inflection point (High or Low)
      let nextEvent = "unknown";
      let nextTime = "";
      let nextHeight = "";

      // Loop through the data. We start at index 1 and look for the "turn".
      for (let i = 1; i < predictions.length - 1; i++) {
        const prev = parseFloat(predictions[i - 1].v);
        const curr = parseFloat(predictions[i].v);
        const next = parseFloat(predictions[i + 1].v);

        // If we are RISING, we are looking for a HIGH (Peak)
        if (isRising && curr > prev && curr > next) {
          nextEvent = "High Tide";
          nextTime = predictions[i].t;
          nextHeight = curr.toFixed(1);
          break; // Stop looking once we find the first one
        }

        // If we are FALLING, we are looking for a LOW (Valley)
        if (!isRising && curr < prev && curr < next) {
          nextEvent = "Low Tide";
          nextTime = predictions[i].t;
          nextHeight = curr.toFixed(1);
          break; // Stop looking
        }
      }

      // 4. Clean up the time format (2026-01-23 16:00 -> 4:00 PM)
      let timeString = "soon";
      if (nextTime) {
        const [d, t] = nextTime.split(" ");
        let [h, m] = t.split(":");
        let hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        timeString = `${hour}:${m} ${ampm}`;
      }

      return `${site.name} is ${nowVal.toFixed(1)}ft and ${status}. Next ${nextEvent} is ${nextHeight}ft at ${timeString}.`;
    }));

    return new Response(results.join(" "), {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache" }
    });
  } catch (e) {
    return new Response("Tide sensors unavailable.", { status: 200 });
  }
}