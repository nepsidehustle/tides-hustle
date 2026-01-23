export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // CHANGED: range=96 (4 Days). 
        // This ensures the chart always has 48+ hours of future data to draw.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=96&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        if (json.error) return { name: site.name, predictions: [], error: json.error };

        return {
          name: site.name,
          predictions: json.predictions.map((p: any) => ({
            t: p.t,
            v: parseFloat(p.v)
          }))
        };
      })
    );

    return new Response(JSON.stringify(allData), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "System Error" }), { status: 500 });
  }
}