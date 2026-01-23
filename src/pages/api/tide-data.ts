export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // CHANGED: interval=h (Hourly) for smooth curves
        // CHANGED: range=48 (48 Hours) gives us a perfect 2-day wave
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=48&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        return {
          name: site.name,
          predictions: json.predictions.map((p: any) => ({
            t: p.t,
            v: parseFloat(p.v) // Ensure this is a number right here
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