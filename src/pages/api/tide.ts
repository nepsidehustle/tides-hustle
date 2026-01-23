export const prerender = false;

export async function GET() {
  const stations = [{ id: "8661070", name: "Myrtle Beach" }, { id: "8517201", name: "Jamaica Bay" }];

  try {
    const results = await Promise.all(stations.map(async (site) => {
      // Use range=24 to ensure we have enough data points to find "Now"
      const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
      const res = await fetch(api);
      const data = await res.json();
      
      const now = new Date();
      // Format: YYYY-MM-DD HH:00
      const currentHourStr = now.getFullYear() + "-" + 
        String(now.getMonth() + 1).padStart(2, '0') + "-" + 
        String(now.getDate()).padStart(2, '0') + " " + 
        String(now.getHours()).padStart(2, '0');

      // Find the prediction for the current hour
      const current = data.predictions.find(p => p.t.startsWith(currentHourStr)) || data.predictions[0];
      const next = data.predictions[data.predictions.indexOf(current) + 1] || current;
      
      const direction = parseFloat(next.v) > parseFloat(current.v) ? "rising" : "falling";

      return `${site.name} is ${current.v} feet and ${direction}.`;
    }));

    return new Response(results.join(" "), {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-cache" }
    });
  } catch (e) { return new Response("Error", { status: 500 }); }
}