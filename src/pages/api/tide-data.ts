export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // FIX: Changed 'date=latest' to 'date=today'. 
        // This is the industry standard for prediction requests.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        if (json.error) {
             console.error(`NOAA Error for ${site.name}:`, json.error);
             // Return empty predictions so the dashboard doesn't crash
             return { name: site.name, predictions: [] };
        }

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
    return new Response(JSON.stringify({ error: "System Error" }), { status: 500 });
  }
}