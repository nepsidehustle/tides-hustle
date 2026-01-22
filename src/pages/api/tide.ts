export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach", type: "water_level" },
    { id: "8517201", name: "Jamaica Bay", type: "predictions" }
  ];

  try {
    const results = await Promise.all(
      stations.map(async (site) => {
        // We fetch 'predictions' for everyone now to see the "Next" tide
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
        
        const res = await fetch(api);
        const data = await res.json();
        const predictions = data.predictions;

        if (!predictions || predictions.length < 2) {
          return `${site.name} data is unavailable.`;
        }

        const current = predictions[0];
        const next = predictions[1];
        
        // Determine if rising or falling
        const direction = parseFloat(next.v) > parseFloat(current.v) ? "rising" : "falling";
        
        // Find the next High (H) or Low (L)
        const nextEvent = next.type === "H" ? "high tide" : "low tide";
        const eventTime = next.t.split(" ")[1]; // Gets just the time part

        return `${site.name} is ${current.v} feet and ${direction}. Next is ${nextEvent} at ${eventTime}.`;
      })
    );

    const speech = `Tide Report. ${results.join(" ")}`;

    return new Response(speech, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("Sorry, the tide sensors are acting up.", { status: 500 });
  }
}