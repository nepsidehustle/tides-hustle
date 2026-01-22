export const prerender = false;

export async function GET() {
  const stations = [
    { id: "8661070", name: "Myrtle Beach" },
    { id: "8517201", name: "Jamaica Bay" }
  ];

  try {
    const results = await Promise.all(
      stations.map(async (site) => {
        // We use interval=h (hourly) to ensure we always get a data list
        const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${site.id}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=h&format=json`;
        
        const res = await fetch(api);
        const data = await res.json();
        const predictions = data.predictions;

        if (!predictions || predictions.length < 2) {
          return `${site.name} is currently offline.`;
        }

        // The first prediction is the current/most recent hour
        const current = predictions[0];
        const next = predictions[1];
        
        const curVal = parseFloat(current.v);
        const nextVal = parseFloat(next.v);
        const direction = nextVal > curVal ? "rising" : "falling";

        // Optional: Look for the next peak in the 24h set
        let nextHigh = predictions.find((p, i) => i > 0 && parseFloat(p.v) > parseFloat(predictions[i-1].v) && (predictions[i+1] ? parseFloat(p.v) > parseFloat(predictions[i+1].v) : true));
        let nextLow = predictions.find((p, i) => i > 0 && parseFloat(p.v) < parseFloat(predictions[i-1].v) && (predictions[i+1] ? parseFloat(p.v) < parseFloat(predictions[i+1].v) : true));

        // Simplified response for Siri clarity
        return `${site.name} is ${curVal} feet and ${direction}.`;
      })
    );

    const speech = `Tide Update. ${results.join(" ")}`;

    return new Response(speech, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("I couldn't reach the NOAA sensors right now.", { status: 500 });
  }
}