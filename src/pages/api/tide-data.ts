export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // We use date=today and range=96 to ensure we have a massive 4-day window 
        // covering all timezones and "now" moments.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=96&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        // If NOAA is failing, return a clear error in the predictions
        if (!json.predictions) return { name: site.name, predictions: [] };

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
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Fetch failed" }), { status: 500 });
  }
}