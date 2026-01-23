export const prerender = false;

const stations = [
  { id: "8661070", name: "Myrtle Beach" },
  { id: "8517201", name: "Jamaica Bay" }
];

export async function GET() {
  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // We use date=latest and range=72 to get 3 days starting FROM NOW
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=72&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        if (!json.predictions) return { name: site.name, predictions: [] };

        const now = new Date();
        const nowTimestamp = now.getTime();

        return {
          name: site.name,
          // Filter out only the stuff that is more than 1 hour old
          // This keeps the 71 hours of future "wave" intact
          predictions: json.predictions
            .filter((p: any) => {
              const pTime = new Date(p.t.replace(/-/g, "/")).getTime();
              return pTime > (nowTimestamp - 3600000);
            })
            .map((p: any) => ({
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
    return new Response(JSON.stringify({ error: "Wave fetch failed" }), { status: 500 });
  }
}