export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(
      stations.map(async (site) => {
        // The cb=${Date.now()} ensures the data is fresh every time
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&date=today&format=json&nocache=${Date.now()}`;
        const res = await fetch(api);
        const data = await res.json();
        const predictions = data.predictions;

        if (!predictions || predictions.length === 0) {
          return `${site.name} data is currently unavailable.`;
        }

        const now = new Date();
        const nowStr = now.getFullYear() + "-" + 
                      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                      String(now.getDate()).padStart(2, '0') + " " + 
                      String(now.getHours()).padStart(2, '0');

        const nextTide = predictions.find(p => p.t > nowStr) || predictions[0];
        const type = nextTide.type === "H" ? "High Tide" : "Low Tide";
        const trend = nextTide.type === "H" ? "rising" : "falling";
        const time = nextTide.t.split(" ")[1]; 

        return `${site.name} is ${nextTide.v} feet and ${trend}. Next ${type} is at ${time}.`;
      })
    );

    return new Response(results.join(" "), {
      status: 200,
      headers: { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    return new Response("I'm having trouble connecting to NOAA.", { status: 500 });
  }
}