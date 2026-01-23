export const prerender = false;

const stations = [
  { id: "8661070", name: "Myrtle Beach" },
  { id: "8517201", name: "Jamaica Bay" }
];

export async function GET() {
  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // Requesting 72 hours (3 days) of hourly data
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();
        
        return {
          name: site.name,
          predictions: json.predictions.map((p: any) => ({
            t: p.t,
            v: parseFloat(p.v)
          }))
        };
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