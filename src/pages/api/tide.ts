export const prerender = false;

export async function GET() {
  try {
    const station = "8454000"; 
    // This URL is the most robust way to get current/upcoming predictions
    const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

    const res = await fetch(api);
    const data = await res.json();

    // Check if the property 'predictions' exists and has items
    if (!data.predictions || data.predictions.length === 0) {
        console.error("NOAA Response Error:", data);
        return new Response("I'm sorry, the tide data is currently unavailable from NOAA.", { status: 200 });
    }

    // We take the first prediction in the 'latest' window
    const latest = data.predictions[0];
    const feet = latest.v;
    
    // Note: Using backticks ` for the template string
    const speech = `The water is currently ${feet} feet deep in Providence.`;

    return new Response(speech, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    console.error("API Fetch Error:", error);
    return new Response("Sorry, I had trouble connecting to the tide service.", { status: 500 });
  }
}