export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // We use 48 hours of HOURLY data. This is the most stable request.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        // DEFENSIVE CHECK: Did NOAA return an error?
        if (json.error) {
            console.error(`NOAA Error for ${site.name}:`, json.error);
            return { name: site.name, error: "NOAA API Error", predictions: [] };
        }
        
        // DEFENSIVE CHECK: Is the data missing?
        if (!json.predictions) {
            return { name: site.name, error: "No predictions found", predictions: [] };
        }

        return {
          name: site.name,
          predictions: json.predictions.map((p: any) => ({
            t: p.t, // Keep the time string
            v: parseFloat(p.v) // Force the value to be a number
          }))
        };
      })
    );

    return new Response(JSON.stringify(allData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    // Return the actual error message so we can see it
    return new Response(JSON.stringify({ error: e.message || "Unknown Error" }), { status: 500 });
  }
}