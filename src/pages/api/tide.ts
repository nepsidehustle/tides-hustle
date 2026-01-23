export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // 1. Ask for 24 hours of data. 
      // We use interval=6 for precision.
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=6&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();

      // Safety Check: If NOAA is down or returned an error, don't crash the whole app
      if (!data.predictions || data.predictions.length < 2) {
        return `${site.name} sensors are currently offline.`;
      }

      const predictions = data.predictions;
      const current = predictions[0];
      const nextPoint = predictions[1];
      const curVal = parseFloat(current.v);
      const nextVal = parseFloat(nextPoint.v);

      const isRising = nextVal > curVal;
      const status = isRising ? "rising" : "falling";

      // 2. Find the NEXT peak or trough
      let eventTime = "";
      let eventType = "";
      let eventHeight = "";

      for (let i = 1; i < predictions.length - 1; i++) {
        const prev = parseFloat(predictions[i - 1].v);
        const curr = parseFloat(predictions[i].v);
        const next = parseFloat(predictions[i + 1].v);

        if (isRising && curr > prev && curr > next) {
          eventType = "high tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
        if (!isRising && curr < prev && curr < next) {
          eventType = "low tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
      }

      // 3. Format time for Siri (turning 14:30 into 2:30 PM)
      let formattedTime = "soon";
      if (eventTime) {
        const timePart = eventTime.split(" ")[1];
        let [hour, minute] = timePart.split(":");
        let h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        formattedTime = `${h}:${minute} ${ampm}`;
      }

      return `${site.name} is ${curVal.toFixed(1)} feet and ${status}. The next ${eventType} is ${eventHeight} feet at ${formattedTime}.`;
    }));

    return new Response(results.join(" "), {
      status: 200,
      headers: { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (e) {
    // If anything fails, return a friendly error Siri can read
    return new Response("I'm sorry, I'm having trouble connecting to the tide sensors right now.", { status: 200 });
  }
}