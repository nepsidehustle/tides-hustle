export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(
      stations.map(async (site) => {
        // Asking for 'today' is much more stable than 'latest'
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
        
        const res = await fetch(api);
        const data = await res.json();
        const predictions = data.predictions;

        if (!predictions || predictions.length === 0) {
          return `${site.name} data is currently unavailable.`;
        }

        // Get the current time in NOAA's format (YYYY-MM-DD HH:MM)
        const now = new Date();
        const nowStr = now.getFullYear() + "-" + 
                      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                      String(now.getDate()).padStart(2, '0') + " " + 
                      String(now.getHours()).padStart(2, '0');

        // Find the next tide event in the list
        const nextTide = predictions.find(p => p.t > nowStr) || predictions[0];
        const type = nextTide.type === "H" ? "High Tide" : "Low Tide";
        const trend = nextTide.type === "H" ? "rising" : "falling";
        const time = nextTide.t.split(" ")[1]; // Just the HH:MM

        return `${site.name} is ${nextTide.v} feet and ${trend}. Next ${type} is at ${time}.`;
      })
    );

    return new Response(results.join(" "), {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("I'm having trouble connecting to NOAA.", { status: 500 });
  }
}