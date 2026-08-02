export const dynamic = "force-dynamic";

type YandexGeoObject = {
  GeoObject?: {
    metaDataProperty?: {
      GeocoderMetaData?: {
        kind?: string;
        precision?: string;
        text?: string;
        Address?: {
          formatted?: string;
          Components?: Array<{ kind?: string; name?: string }>;
        };
      };
    };
    Point?: { pos?: string };
    name?: string;
    description?: string;
  };
};

type Region = "bishkek" | "osh";

const REGION_BOUNDS: Record<Region, string> = {
  bishkek: "74.32,42.72~74.91,43.02",
  osh: "72.61,40.35~73.08,40.69",
};

const REGION_CITY: Record<Region, string> = {
  bishkek: "Бишкек",
  osh: "Ош",
};

function shortRussianAddress(
  metadata: NonNullable<NonNullable<YandexGeoObject["GeoObject"]>["metaDataProperty"]>["GeocoderMetaData"],
  fallback: string,
  region: Region | null,
) {
  const components = metadata?.Address?.Components || [];
  const street = components.find((component) => component.kind === "street")?.name?.trim() || "";
  const house = components.find((component) => component.kind === "house")?.name?.trim() || "";
  if (street) return [street, house].filter(Boolean).join(", ");
  const city = region ? REGION_CITY[region] : "";
  return (metadata?.Address?.formatted || metadata?.text || fallback)
    .replace(/^(?:Кыргызстан|Кыргызская Республика)\s*,?\s*/i, "")
    .replace(city ? new RegExp(`^(?:г\\.\\s*)?${city}\\s*,?\\s*`, "i") : /$^/, "")
    .trim();
}

function validCoordinate(value: string | null, minimum: number, maximum: number) {
  if (value === null || value.trim() === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum
    ? coordinate
    : Number.NaN;
}

export async function GET(request: Request) {
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY || process.env.YANDEX_MAPS_API_KEY || "";
  if (!apiKey) {
    return Response.json({ error: "Геокодер не настроен" }, { status: 503 });
  }

  const source = new URL(request.url).searchParams;
  const text = source.get("text")?.trim() || "";
  const uri = source.get("uri")?.trim() || "";
  const latitude = validCoordinate(source.get("lat"), -90, 90);
  const longitude = validCoordinate(source.get("lon"), -180, 180);
  const requestedRegion = source.get("region");
  const region: Region | null = requestedRegion === "bishkek" || requestedRegion === "osh"
    ? requestedRegion
    : null;
  const kind = source.get("kind");

  if (Number.isNaN(latitude) || Number.isNaN(longitude) || (latitude === null) !== (longitude === null)) {
    return Response.json({ error: "Координаты указаны некорректно" }, { status: 400 });
  }
  if (!text && !uri && (latitude === null || longitude === null)) {
    return Response.json({ error: "Не указан адрес, URI объекта или координаты" }, { status: 400 });
  }
  if (text.length > 500 || uri.length > 2_000) {
    return Response.json({ error: "Слишком длинный запрос" }, { status: 400 });
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    lang: "ru_RU",
    format: "json",
    results: latitude === null ? "10" : "1",
  });
  if (uri) params.set("uri", uri);
  else if (text) params.set("geocode", text);
  else params.set("geocode", `${longitude},${latitude}`);
  if (latitude !== null) {
    params.set("kind", kind && ["house", "street", "district", "locality"].includes(kind)
      ? kind
      : "house");
  }
  if (region) {
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
      response?: { GeoObjectCollection?: { featureMember?: YandexGeoObject[] } };
    };
    const items = (data.response?.GeoObjectCollection?.featureMember || []).flatMap(({ GeoObject }) => {
      const position = GeoObject?.Point?.pos?.split(/\s+/).map(Number);
      if (!position || position.length < 2 || !position.every(Number.isFinite)) return [];
      const metadata = GeoObject?.metaDataProperty?.GeocoderMetaData;
      const [itemLongitude, itemLatitude] = position;
      const address = metadata?.Address?.formatted || metadata?.text || GeoObject?.name || "";
      const name = shortRussianAddress(metadata, GeoObject?.name || address, region);
      const kind = metadata?.kind || "";
      const precision = metadata?.precision || "";
      return [{
        address,
        coordinates: [itemLatitude, itemLongitude] as [number, number],
        kind,
        precision,
        name,
        description: GeoObject?.description || "",
      }];
    });
    const suggestions = items.map((item, index) => ({
      id: `${item.coordinates[0]}:${item.coordinates[1]}:${index}`,
      label: item.name,
      subtitle: item.description,
      latitude: item.coordinates[0],
      longitude: item.coordinates[1],
      kind: item.kind,
      precision: item.precision,
      isComplete: item.kind === "house" && item.precision === "exact",
    }));

    return Response.json(
      { suggestions, items },
      { headers: { "Cache-Control": "no-store, max-age=0", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (error) {
    console.error("Yandex Geocoder request failed", error);
    return Response.json({ error: "Не удалось определить адрес" }, { status: 502 });
  }
}
