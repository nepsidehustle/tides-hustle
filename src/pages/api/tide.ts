export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // Use interval=h and range=48 to ensure we find the next High/Low easily
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();
      const predictions = data.predictions;

      const current = predictions[0];
      const nextPoint = predictions[1];
      const curVal = parseFloat(current.v);
      const isRising = parseFloat(nextPoint.v) > curVal;

      let eventType = "", eventTime = "", eventHeight = "";

      // Look for the "flip" in direction
      for (let i = 1; i < predictions.length - 1; i++) {
        const prev = parseFloat(predictions[i - 1].v);
        const curr = parseFloat(predictions[i].v);
        const next = parseFloat(predictions[i + 1].v);

        if (isRising && curr >= prev && curr >= next) {
          eventType = "high tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
        if (!isRising && curr <= prev && curr <= next) {
          eventType = "low tide";
          eventTime = predictions[i].t;
          eventHeight = curr.toFixed(1);
          break;
        }
      }

      let formattedTime = "shortly";
      if (eventTime) {
        const timePart = eventTime.split(" ")[1];
        let [hour, min] = timePart.split(":");
        let h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        formattedTime = `${h % 12 || 12}:${min} ${ampm}`;
      }

      return `${site.name} is ${curVal.toFixed(1)} feet and ${isRising ? "rising" : "falling"}. The next ${eventType} is ${eventHeight} feet at ${formattedTime}.`;
    }));

    return new Response(results.join(" "), { status: 200 });
  } catch (e) {
    return new Response("Tide data is temporarily unavailable.", { status: 200 });
  }
}