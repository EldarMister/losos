const YANDEX_HOSTS = new Set([
  "yandex.ru",
  "www.yandex.ru",
  "yandex.com",
  "www.yandex.com",
  "yandex.kz",
  "www.yandex.kz",
  "yandex.uz",
  "www.yandex.uz",
  "yandex.by",
  "www.yandex.by",
]);

export type PickupMapCoordinates = {
  latitude: number;
  longitude: number;
};

function validCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

function coordinates(longitude: number, latitude: number): PickupMapCoordinates | null {
  return validCoordinates(latitude, longitude) ? { latitude, longitude } : null;
}

export function assertYandexMapUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Укажите корректную ссылку Яндекс Карт");
  }
  if (url.protocol !== "https:" || !YANDEX_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Поддерживаются только HTTPS-ссылки Яндекс Карт");
  }
  return url;
}

export function pickupCoordinatesFromYandexUrl(value: string) {
  const url = assertYandexMapUrl(value);
  const direct = [
    url.searchParams.get("ll"),
    url.searchParams.get("pt"),
    url.searchParams.get("whatshere[point]"),
  ];
  for (const candidate of direct) {
    if (!candidate) continue;
    const [longitude, latitude] = candidate.split(",").map(Number);
    const result = coordinates(longitude, latitude);
    if (result) return result;
  }

  const locationMatch = decodeURIComponent(`${url.pathname}${url.hash}`)
    .match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (locationMatch) {
    return coordinates(Number(locationMatch[1]), Number(locationMatch[2]));
  }

  return null;
}

export async function resolvePickupMapLink(value: string) {
  let current = assertYandexMapUrl(value);
  for (let redirect = 0; redirect <= 6; redirect += 1) {
    const direct = pickupCoordinatesFromYandexUrl(current.toString());
    if (direct) return { ...direct, resolvedUrl: current.toString() };

    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "NaktaSushiAdmin/1.0",
      },
      signal: AbortSignal.timeout(8_000),
    });
    const location = response.headers.get("location");
    if (location && response.status >= 300 && response.status < 400) {
      current = assertYandexMapUrl(new URL(location, current).toString());
      continue;
    }

    const finalCoordinates = pickupCoordinatesFromYandexUrl(response.url || current.toString());
    if (finalCoordinates) {
      return { ...finalCoordinates, resolvedUrl: response.url || current.toString() };
    }
    break;
  }
  throw new Error("Не удалось определить координаты по ссылке. Скопируйте ссылку на точку из Яндекс Карт.");
}
