export const dynamic = "force-dynamic";

type YandexAddressComponent = {
  kind?: string;
  name?: string;
};

type YandexGeoObject = {
  GeoObject?: {
    metaDataProperty?: {
      GeocoderMetaData?: {
        kind?: string;
        precision?: string;
        text?: string;
        Address?: {
          formatted?: string;
          Components?: YandexAddressComponent[];
        };
      };
    };
    Point?: { pos?: string };
    name?: string;
    description?: string;
  };
};

const REGION_CONFIG = {
  bishkek: {
    city: "Бишкек",
    bbox: "74.32,42.72~74.91,43.02",
  },
  osh: {
    city: "Ош",
    bbox: "72.61,40.35~73.08,40.69",
  },
  "otuz-adyr": {
    city: "Отуз-Адыр",
    bbox: "72.88,40.54~73.06,40.68",
  },
} as const;

type RegionSlug = keyof typeof REGION_CONFIG;

function cleanAddress(value: string, city: string) {
  const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value
    .replace(/^Кыргызстан,\s*/i, "")
    .replace(/^город\s+республиканского\s+подчинения\s*,?\s*/i, "")
    .replace(new RegExp(`^(?:(?:г\\.\\s*)?${escapedCity}(?:\\s+город)?\\s*,?\\s*)+`, "i"), "")
    .trim();
}

export async function GET(request: Request) {
  const apiKey =
    process.env.YANDEX_GEOCODER_API_KEY?.trim() ||
    process.env.YANDEX_MAPS_API_KEY?.trim() ||
    "";
  if (!apiKey) {
    return Response.json(
      {
        error: "Геокодер не настроен",
        message: "Поиск адресов временно недоступен.",
      },
      { status: 503 },
    );
  }

  const source = new URL(request.url).searchParams;
  const mobileQuery = (source.get("q") || "").replace(/%20/gi, " ").trim();
  const text = source.get("text")?.trim() || mobileQuery;
  const uri = source.get("uri")?.trim() || "";
  const latitudeSource = source.get("lat")?.trim() || "";
  const longitudeSource = source.get("lon")?.trim() || "";
  const hasCoordinateInput = Boolean(latitudeSource || longitudeSource);
  const latitude = Number(latitudeSource);
  const longitude = Number(longitudeSource);
  const hasCoordinates = Boolean(
    latitudeSource
    && longitudeSource
    && Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180,
  );
  const requestedRegion = source.get("region") || "";
  const region: RegionSlug | null = requestedRegion in REGION_CONFIG
    ? requestedRegion as RegionSlug
    : null;
  const kind = source.get("kind");

  if (!text && !uri && !hasCoordinates) {
    return Response.json(
      {
        error: hasCoordinateInput
          ? "Некорректные координаты"
          : "Не указан адрес, URI объекта или координаты",
        message: "Укажите улицу и номер дома.",
      },
      { status: 400 },
    );
  }
  if ((mobileQuery && mobileQuery.length < 2) || text.length > 500 || uri.length > 2_000) {
    return Response.json(
      {
        error: mobileQuery.length < 2 ? "Слишком короткий запрос" : "Слишком длинный запрос",
        message: "Укажите улицу и номер дома.",
      },
      { status: 400 },
    );
  }

  const regionConfig = region ? REGION_CONFIG[region] : null;
  const geocode = hasCoordinates
    ? `${longitude},${latitude}`
    : mobileQuery && regionConfig
      ? `${regionConfig.city}, ${mobileQuery}`
      : text;
  const params = new URLSearchParams({
    apikey: apiKey,
    lang: "ru_RU",
    format: "json",
    results: hasCoordinates ? "1" : mobileQuery ? "8" : "5",
  });
  if (uri) params.set("uri", uri);
  else params.set("geocode", geocode);
  if (kind && ["house", "street", "district", "locality"].includes(kind)) {
    params.set("kind", kind);
  }
  if (regionConfig) {
    params.set("bbox", regionConfig.bbox);
    params.set("rspn", "1");
  }

  try {
    const response = await fetch(`https://geocode-maps.yandex.ru/v1/?${params}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.error("Yandex Geocoder failed", response.status, await response.text());
      return Response.json(
        {
          error: "Сервис определения адреса временно недоступен",
          message: "Сервис адресов временно недоступен.",
        },
        { status: response.status === 429 ? 429 : 502 },
      );
    }

    const data = await response.json() as {
      response?: {
        GeoObjectCollection?: { featureMember?: YandexGeoObject[] };
      };
    };
    const parsed = (data.response?.GeoObjectCollection?.featureMember || []).flatMap(
      ({ GeoObject }, index) => {
        const position = GeoObject?.Point?.pos?.trim().split(/\s+/).map(Number);
        if (!position || position.length < 2 || !position.every(Number.isFinite)) return [];

        const metadata = GeoObject?.metaDataProperty?.GeocoderMetaData;
        const [longitude, latitude] = position;
        const address = metadata?.Address?.formatted || metadata?.text || GeoObject?.name || "";
        const components = metadata?.Address?.Components || [];
        const house = components.find((component) => component.kind === "house")?.name || "";
        const street = components.find((component) => component.kind === "street")?.name || "";
        const district = components.find((component) => (
          component.kind === "district" || component.kind === "area"
        ))?.name || "";
        const itemKind = metadata?.kind || (house ? "house" : "");
        const precision = metadata?.precision || (house ? "exact" : "");
        const city = regionConfig?.city || "";
        const label = city
          ? cleanAddress(address, city)
          : address.trim();
        const fallbackLabel = [street, house].filter(Boolean).join(", ");
        const suggestionLabel = label || fallbackLabel || GeoObject?.name || "";

        return [{
          item: {
            address,
            coordinates: [latitude, longitude] as [number, number],
            kind: itemKind,
            precision,
            name: GeoObject?.name || "",
            description: GeoObject?.description || "",
          },
          suggestion: suggestionLabel ? {
            id: `${longitude}:${latitude}:${index}`,
            label: suggestionLabel,
            subtitle: [district, city].filter(Boolean).join(", ")
              || GeoObject?.description
              || "",
            latitude,
            longitude,
            kind: itemKind,
            precision,
            isComplete: itemKind === "house" && (
              Boolean(house) ||
              /(?:,|\s)\s*\d+[\dA-Za-zА-Яа-я/-]*\s*$/u.test(suggestionLabel)
            ),
          } : null,
        }];
      },
    );

    return Response.json(
      {
        items: parsed.map(({ item }) => item),
        suggestions: parsed.flatMap(({ suggestion }) => suggestion ? [suggestion] : []),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Yandex Geocoder request failed", error);
    return Response.json(
      {
        error: "Не удалось определить адрес",
        message: "Сервис адресов временно недоступен.",
      },
      { status: 502 },
    );
  }
}
