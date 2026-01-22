export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach", type: "water_level" },
    { id: "8517201", name: "Jamaica Bay", type: "predictions" }
  ];

  try {
    const results = await Promise.all(
      stations.map(async (site) => {
        const product = site.type;
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&product=${product}&datum=MLLW&time_zone=lst_ldt&units=english&format=json`;
        
        const res = await fetch(api);
        const data = await res.json();
        
        // Handle both live data (.data) and predictions (.predictions)
        const list = data.data || data.predictions;

        if (list && list.length > 0) {
          return `${site.name} is ${list[0].v} feet.`;
        }
        return `${site.name} data is currently unavailable.`;
      })
    );

    const speech = `Current water levels: ${results.join(" ")}`;

    return new Response(speech, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("Sorry, I couldn't reach the tide sensors right now.", { status: 500 });
  }
}