export const prerender = false;

const stations = [
  { id: "8661070", name: "Myrtle Beach" },
  { id: "8517201", name: "Jamaica Bay" }
];

export async function GET() {
  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        // --- NEW LOGIC STARTS HERE ---
        const now = new Date();
        const nowTimestamp = now.getTime();

        return {
          name: site.name,
          // We filter out any hours that have already passed today
          predictions: json.predictions
            .filter((p: any) => {
              // Convert NOAA time string "YYYY-MM-DD HH:MM" to a timestamp
              const predictionTime = new Date(p.t.replace(/-/g, "/")).getTime(); 
              // Only keep data from 1 hour ago onwards (to show the immediate trend)
              return predictionTime > (nowTimestamp - 3600000);
            })
            .map((p: any) => ({
              t: p.t,
              v: parseFloat(p.v)
            }))
        };
        // --- NEW LOGIC ENDS HERE ---
      })
    );

    return new Response(JSON.stringify(allData), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to fetch dashboard data" }), { status: 500 });
  }
}