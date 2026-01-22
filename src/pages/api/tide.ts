export const prerender = false;

export async function GET() {
  return new Response("The tide is high!", {
    status: 200,
    headers: { "Content-Type": "text/plain" }
  });
}