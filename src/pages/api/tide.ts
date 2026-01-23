export const prerender = false;

export async function GET() {
  // Our target stations
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // 1. Fetch 24 hours of data at 6-minute intervals for high precision
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=6&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();
      const predictions = data.predictions;

      // 2. Get "Now" (the very first point) and the "Very Soon" point
      const current = predictions[0];
      const nextPoint = predictions[1];
      const curVal = parseFloat(current.v);
      const nextVal = parseFloat(nextPoint.v);

      // 3. Determine if currently rising or falling
      const isRising = nextVal > curVal;
      const status = isRising ? "rising" : "falling";

      // 4. Find the NEXT peak (High) or trough (Low)
      // We loop through the data until the direction flips
      let eventTime = "";
      let eventType = "";
      let eventHeight = "";

      for (let i = 1; i < predictions.length - 1; i++) {
        const prev = parseFloat(predictions[i - 1].v);
        const curr = parseFloat(predictions[i].v);
        const next = parseFloat(predictions[i + 1].v);

        // If we were rising and now we are lower than the previous point, we hit a HIGH
        if (isRising && curr > prev && curr > next) {
          eventType = "high tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
        // If we were falling and now we are higher than the previous point, we hit a LOW
        if (!isRising && curr < prev && curr < next) {
          eventType = "low tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
      }

      // 5. Format the time to be "Siri-friendly" (e.g., 4:12 PM)
      const timeStr = eventTime.split(" ")[1];
      const [hour, minute] = timeStr.split(":");
      const h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedTime = `${h % 12 || 12}:${minute} ${ampm}`;

      return `${site.name} is ${curVal.toFixed(1)} feet and ${status}. Next is a ${eventHeight} foot ${eventType} at ${formattedTime}.`;
    }));

    // Join the results into one paragraph for Siri to read smoothly
    return new Response(results.join(" "), {
      status: 200,
      headers: { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (e) {
    return new Response("Sorry, I couldn't reach the tide sensors right now.", { status: 500 });
  }
}