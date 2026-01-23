export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  // Helper to get YYYYMMDD format for "Today"
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayString = `${yyyy}${mm}${dd}`;

  try {
    const allData = await Promise.all(
      stations.map(async (site) => {
        // STRATEGY CHANGE:
        // 1. Use 'begin_date' instead of 'date=today' to be explicit.
        // 2. range=120 (5 days) to guarantee we cover the graph.
        // 3. Cache Buster on the NOAA side just in case.
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&begin_date=${todayString}&range=120&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json&application=TideTrack&cb=${Date.now()}`;
        
        const res = await fetch(api);
        const json = await res.json();

        if (json.error) return { name: site.name, predictions: [], error: json.error };

        return {
          name: site.name,
          // We attach a version tag to prove this is the new code
          server_version: "3.1", 
          predictions: json.predictions.map((p: any) => ({
            t: p.t,
            v: parseFloat(p.v)
          }))
        };
      })
    );

    // CACHING STRATEGY:
    // "s-maxage=21600" -> Tells Cloudflare CDN to hold this data for 6 hours.
    // "max-age=0" -> Tells your browser to always ask Cloudflare (so you get fresh cache).
    return new Response(JSON.stringify(allData), { 
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, s-maxage=21600"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "System Error" }), { status: 500 });
  }
}