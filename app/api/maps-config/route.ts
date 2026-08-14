import { readServerEnv } from "../../lib/server-env";

export const dynamic = "force-dynamic";

export async function GET() {
  const mapsApiKey = readServerEnv(
    "YANDEX_MAPS_API_KEY",
    "NEXT_PUBLIC_YANDEX_MAPS_API_KEY",
  );
  const suggestApiKey = readServerEnv(
    "YANDEX_SUGGEST_API_KEY",
    "NEXT_PUBLIC_YANDEX_SUGGEST_API_KEY",
  ) || mapsApiKey;

  return Response.json(
    { mapsApiKey, suggestApiKey },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
