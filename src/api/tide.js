//primary code to get tide data from API

export const prerender = false; //force this to run live on cloudflare

export async function GET() {
  try { 
    const station = "8454000"; //NOAA STATION ID
    const api = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=NOS.COOPS.TAC.WL&begin_date=20240101&end_date=20240102&datum=MLLW&station=${station}&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

    const res = await fetch(api);
    const data = await res.json();

    // safety check for NOAA data
    if (!data.data || data.data.length === 0) {
        return new Response("Tide data is currently unavailable.", { status: 200 });
    }

    const latest = data.data[data.data.length - 1];
    const speech = 'The water is ${latest.v} feet deep.';

    return new Response(speech, {
        status: 200,
        headers: { "Content-Type": "text/plain" }
    });
 } catch (error) {
    return new Response("Sorry, I couldn't retrieve the tide data at this time.", { status: 500 });
 }
}
