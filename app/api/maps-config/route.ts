export const dynamic = "force-dynamic";

export async function GET() {
  const mapsApiKey =
    process.env.YANDEX_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ||
    "";
  const suggestApiKey =
    process.env.YANDEX_SUGGEST_API_KEY ||
    process.env.NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY ||
    mapsApiKey;

  return Response.json(
    { mapsApiKey, suggestApiKey },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
