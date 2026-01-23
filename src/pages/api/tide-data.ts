export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=today&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        const res = await fetch(api);
        const json = await res.json();
        return {
          name: site.name,
          predictions: json.predictions.map((p: any) => ({ t: p.t, v: parseFloat(p.v) }))
        };
      })
    );
    return new Response(JSON.stringify(allData), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e }), { status: 500 });
  }
}