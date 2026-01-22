export const prerender = false;

export async function GET() {
  try {
    const station = "8454000"; 
    // This URL grabs the latest predictions for a 24-hour window
    const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&date=latest&range=24&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

    const res = await fetch(api);
    const data = await res.json();

    // NOAA's list is called 'predictions'
    if (!data.predictions || data.predictions.length === 0) {
        return new Response("I'm sorry, the tide data is currently unavailable from NOAA.", { status: 200 });
    }

    // We want the prediction closest to 'now'
    // Usually, the first item in a 'latest' request is the most recent
    const latest = data.predictions[0];
    const feet = latest.v;
    
    // Using backticks (`) for the template literal
    const speech = `The water is currently ${feet} feet deep in Providence.`;

    return new Response(speech, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("Sorry, I had trouble connecting to the tide service.", { status: 500 });
  }
}