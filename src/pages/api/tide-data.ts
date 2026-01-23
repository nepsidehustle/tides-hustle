export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // We changed interval=h to interval=6. 
        // This gives us a data point every 6 minutes instead of every hour.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=6&format=json&cb=${Date.now()}`;
        
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
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}