export const prerender = false;

export async function GET() {
  try {
    const station = "8454000"; // NOAA STATION ID
    
    // Updated URL: Uses 'date=latest' and 'range=24' so it always works regardless of the year
    const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

    const res = await fetch(api);
    const data = await res.json();

    // Safety check for NOAA data
    if (!data.predictions || data.predictions.length === 0) {
        return new Response("I'm sorry, the tide data is currently unavailable from NOAA.", { status: 200 });
    }

    // Get the very last prediction in the list
    const latest = data.predictions[data.predictions.length - 1];
    
    // Use BACKTICKS (the key next to the 1) so Siri says the actual number
    const speech = `The water is currently ${latest.v} feet deep.`;

    return new Response(speech, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("Sorry, I had trouble connecting to the tide service.", { status: 500 });
  }
}