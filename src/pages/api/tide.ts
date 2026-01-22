export const prerender = false;

export async function GET() {
  try {
    const station = "8454000"; 
    // Using 'water_level' for real-time data instead of 'predictions'
    const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&date=latest&product=water_level&datum=MLLW&time_zone=lst_ldt&units=english&format=json`;

    const res = await fetch(api);
    const data = await res.json();

    // NOAA's real-time data uses the 'data' key, not 'predictions'
    if (!data.data || data.data.length === 0) {
        return new Response("I'm sorry, the tide sensor is currently not reporting data.", { status: 200 });
    }

    const latest = data.data[0];
    const feet = latest.v;
    
    const speech = `The water is currently ${feet} feet deep at the Providence station.`;

    return new Response(speech, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (error) {
    return new Response("Sorry, I had trouble connecting to the tide service.", { status: 500 });
  }
}