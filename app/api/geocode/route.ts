export const dynamic = "force-dynamic";

type YandexGeoObject = {
  GeoObject?: {
    metaDataProperty?: {
      GeocoderMetaData?: {
        kind?: string;
        precision?: string;
        text?: string;
        Address?: { formatted?: string };
      };
    };
    Point?: { pos?: string };
    name?: string;
    description?: string;
  };
};

const REGION_BOUNDS = {
  bishkek: "74.32,42.72~74.91,43.02",
  osh: "72.61,40.35~73.08,40.69",
} as const;

export async function GET(request: Request) {
  const apiKey =
    process.env.YANDEX_GEOCODER_API_KEY ||
    process.env.YANDEX_MAPS_API_KEY ||
    "";
  if (!apiKey) {
    return Response.json({ error: "Геокодер не настроен" }, { status: 503 });
  }

  const source = new URL(request.url).searchParams;
  const text = source.get("text")?.trim() || "";
  const uri = source.get("uri")?.trim() || "";
  const region = source.get("region");
  const kind = source.get("kind");

  if (!text && !uri) {
    return Response.json({ error: "Не указан адрес или URI объекта" }, { status: 400 });
  }
  if (text.length > 500 || uri.length > 2_000) {
    return Response.json({ error: "Слишком длинный запрос" }, { status: 400 });
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    lang: "ru_RU",
    format: "json",
    results: "5",
  });
  if (uri) params.set("uri", uri);
  else params.set("geocode", text);
  if (kind && ["house", "street", "district", "locality"].includes(kind)) {
    params.set("kind", kind);
  }
  if (region === "bishkek" || region === "osh") {
    params.set("bbox", REGION_BOUNDS[region]);
    params.set("rspn", "1");
  }

  try {
    const response = await fetch(`https://geocode-maps.yandex.ru/v1/?${params}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Yandex Geocoder failed", response.status, await response.text());
      return Response.json(
        { error: "Сервис определения адреса временно недоступен" },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const data = await response.json() as {
      response?: {
        GeoObjectCollection?: { featureMember?: YandexGeoObject[] };
      };
    };
    const items = (data.response?.GeoObjectCollection?.featureMember || []).flatMap(({ GeoObject }) => {
      const position = GeoObject?.Point?.pos?.split(/\s+/).map(Number);
      if (!position || position.length < 2 || !position.every(Number.isFinite)) return [];
      const metadata = GeoObject?.metaDataProperty?.GeocoderMetaData;
      const [longitude, latitude] = position;
      return [{
        address: metadata?.Address?.formatted || metadata?.text || GeoObject?.name || "",
        coordinates: [latitude, longitude] as [number, number],
        kind: metadata?.kind || "",
        precision: metadata?.precision || "",
        name: GeoObject?.name || "",
        description: GeoObject?.description || "",
      }];
    });

    return Response.json(
      { items },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Yandex Geocoder request failed", error);
    return Response.json(
      { error: "Не удалось определить адрес" },
      { status: 502 },
    );
  }
}
