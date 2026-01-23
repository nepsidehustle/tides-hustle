export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // FORCE REFRESH: range=96 AND a random number at the end
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=96&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&nocache=${Date.now()}`;
        
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