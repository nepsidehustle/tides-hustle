export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // Fetch 24 hours of data
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      
      const res = await fetch(api);
      const data = await res.json();
      const predictions = data.predictions;

      const current = predictions[0];
      const nextPoint = predictions[1];
      const curVal = parseFloat(current.v);
      const isRising = parseFloat(nextPoint.v) > curVal;

      // Identify the "Next Event" by finding the Max or Min in the array
      let eventType = isRising ? "high tide" : "low tide";
      
      // If rising, find the highest point. If falling, find the lowest.
      const targetPoint = predictions.reduce((prev, curr) => {
        const v1 = parseFloat(prev.v);
        const v2 = parseFloat(curr.v);
        return isRising ? (v2 > v1 ? curr : prev) : (v2 < v1 ? curr : prev);
      });

      const eventHeight = parseFloat(targetPoint.v).toFixed(1);
      const [datePart, timePart] = targetPoint.t.split(" ");
      let [hour, min] = timePart.split(":");
      let h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedTime = `${h % 12 || 12}:${min} ${ampm}`;

      return `${site.name} is ${curVal.toFixed(1)} feet and ${isRising ? "rising" : "falling"}. The next ${eventType} is ${eventHeight} feet at ${formattedTime}.`;
    }));

    return new Response(results.join(" "), { status: 200 });
  } catch (e) {
    return new Response("Tide data unavailable.", { status: 200 });
  }
}