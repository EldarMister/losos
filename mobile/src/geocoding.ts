import { Platform } from "react-native";
import {
  Search,
  Suggest,
  SuggestTypes,
} from "react-native-yamap";
import { WEB_URL } from "./api";
import { getRegionMapConfig } from "./components/yandexMapShared";

export type AddressSuggestion = {
  id: string;
  label: string;
  subtitle: string;
  latitude?: number;
  longitude?: number;
  uri?: string;
  kind: string;
  precision: string;
  isComplete: boolean;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

type GeocodingProxyResponse = {
  suggestions?: AddressSuggestion[];
  items?: Array<{
    address?: string;
    coordinates?: [number, number];
    kind?: string;
    precision?: string;
    name?: string;
    description?: string;
  }>;
};

function insideRegion(latitude: number, longitude: number, regionSlug: string) {
  const { bounds } = getRegionMapConfig(regionSlug);
  return latitude >= bounds[0][0]
    && latitude <= bounds[1][0]
    && longitude >= bounds[0][1]
    && longitude <= bounds[1][1];
}

const transliterationPairs: Array<[RegExp, string]> = [
  [/shch/gi, "щ"], [/yo/gi, "ё"], [/zh/gi, "ж"], [/kh/gi, "х"],
  [/ts/gi, "ц"], [/ch/gi, "ч"], [/sh/gi, "ш"], [/yu/gi, "ю"],
  [/ya/gi, "я"], [/ye/gi, "е"], [/a/gi, "а"], [/b/gi, "б"],
  [/v/gi, "в"], [/g/gi, "г"], [/d/gi, "д"], [/e/gi, "е"],
  [/z/gi, "з"], [/i/gi, "и"], [/y/gi, "й"], [/k/gi, "к"],
  [/l/gi, "л"], [/m/gi, "м"], [/n/gi, "н"], [/o/gi, "о"],
  [/p/gi, "п"], [/r/gi, "р"], [/s/gi, "с"], [/t/gi, "т"],
  [/u/gi, "у"], [/f/gi, "ф"], [/h/gi, "х"], [/c/gi, "к"],
  [/j/gi, "дж"], [/q/gi, "к"], [/w/gi, "в"], [/x/gi, "кс"],
];

function transliterateStreet(value: string) {
  if (!/[A-Za-z]/.test(value)) return value;
  let normalized = value
    .replace(/^(.+?)\s+Avenue$/i, "проспект $1")
    .replace(/^(.+?)\s+Street$/i, "улица $1")
    .replace(/^(.+?)\s+Road$/i, "дорога $1")
    .replace(/^(.+?)\s+Lane$/i, "переулок $1")
    .replace(/^(.+?)\s+Boulevard$/i, "бульвар $1");
  for (const [pattern, replacement] of transliterationPairs) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

export function localizedAddressLabel(value: string, city: string) {
  const cleaned = value
    .replace(/^(?:Кыргызстан|Кыргызская Республика|Kyrgyzstan)\s*,?\s*/i, "")
    .replace(new RegExp(`^(?:г\\.\\s*)?${city}(?:\\s+город)?\\s*,?\\s*`, "i"), "")
    .trim();
  return transliterateStreet(cleaned);
}

const trailingHouseNumber = /(?:,|\s)\s*\d+[\dA-Za-zА-Яа-я/-]*\s*$/u;

export function isSpecificDeliveryAddress(
  address: string,
  kind = "",
  precision = "",
) {
  const normalizedKind = kind.trim().toLocaleLowerCase("ru-RU");
  const normalizedPrecision = precision.trim().toLocaleLowerCase("ru-RU");
  if (normalizedKind && normalizedKind !== "house") return false;
  if (["street", "other", "range"].includes(normalizedPrecision)) return false;
  return trailingHouseNumber.test(address.trim());
}

export function photonFeatureToSuggestion(
  feature: PhotonFeature,
  regionSlug: string,
): AddressSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates) return null;
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || !insideRegion(latitude, longitude, regionSlug)) {
    return null;
  }

  const properties = feature.properties || {};
  const street = properties.street?.trim() || "";
  const house = properties.housenumber?.trim() || "";
  const name = properties.name?.trim() || "";
  const streetAndHouse = [street, house].filter(Boolean).join(", ");
  const label = streetAndHouse || name;
  if (!label) return null;
  const subtitle = [
    name && name !== street ? name : "",
    properties.city,
    properties.district,
  ].filter(Boolean).join(", ");

  return {
    id: String(properties.osm_id || `${latitude}:${longitude}:${label}`),
    label,
    subtitle,
    latitude,
    longitude,
    kind: house ? "house" : "street",
    precision: house ? "exact" : "street",
    isComplete: Boolean(house),
  };
}

export async function suggestAddresses(
  query: string,
  regionSlug: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const trimmed = query.replace(/%20/gi, " ").trim();
  if (trimmed.length < 2) return [];
  const config = getRegionMapConfig(regionSlug);

  if (Platform.OS !== "web") {
    try {
      const nativeQuery = new RegExp(config.city, "i").test(trimmed)
        ? trimmed
        : `${config.city}, ${trimmed}`;
      const nativeItems = await Suggest.suggestWithCoords(nativeQuery, {
        userPosition: { lat: config.center[0], lon: config.center[1] },
        boundingBox: {
          southWest: { lat: config.bounds[0][0], lon: config.bounds[0][1] },
          northEast: { lat: config.bounds[1][0], lon: config.bounds[1][1] },
        },
        suggestWords: true,
        suggestTypes: [
          SuggestTypes.YMKSuggestTypeGeo,
          SuggestTypes.YMKSuggestTypeBiz,
        ],
      });
      if (signal?.aborted) return [];
      const unique = new Map<string, AddressSuggestion>();
      for (const item of nativeItems.slice(0, 10)) {
        const latitude = Number.isFinite(item.lat) ? item.lat as number : undefined;
        const longitude = Number.isFinite(item.lon) ? item.lon as number : undefined;
        if (latitude !== undefined && longitude !== undefined
          && !insideRegion(latitude, longitude, regionSlug)) continue;
        if ((latitude === undefined || longitude === undefined) && !item.uri) continue;
        const label = localizedAddressLabel(item.title || "", config.city);
        if (!label) continue;
        const complete = isSpecificDeliveryAddress(label);
        const key = item.uri
          || `${label.toLocaleLowerCase("ru-RU")}:${latitude?.toFixed(5)}:${longitude?.toFixed(5)}`;
        if (!unique.has(key)) {
          unique.set(key, {
            id: key,
            label,
            subtitle: localizedAddressLabel(item.subtitle || "", config.city),
            latitude,
            longitude,
            uri: item.uri,
            kind: complete ? "house" : "street",
            precision: complete ? "exact" : "street",
            isComplete: complete,
          });
        }
      }
      if (unique.size) return [...unique.values()].slice(0, 10);
    } catch {
      // The HTTP proxy remains available while MapKit is still starting.
    }
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      text: `${config.city}, ${trimmed}`,
      region: regionSlug,
    });
    const response = await fetch(`${WEB_URL}/api/geocode?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const body = await response.json() as GeocodingProxyResponse;
      const legacySuggestions = (body.items || []).flatMap((item, index) => {
        const coordinates = item.coordinates;
        if (!coordinates || coordinates.length < 2) return [];
        const [latitude, longitude] = coordinates;
        const label = localizedAddressLabel(
          String(item.address || item.name || ""),
          config.city,
        );
        if (!label) return [];
        const kind = String(item.kind || "");
        const precision = String(item.precision || "");
        return [{
          id: `legacy:${latitude}:${longitude}:${index}`,
          label,
          subtitle: String(item.description || ""),
          latitude,
          longitude,
          kind,
          precision,
          isComplete: isSpecificDeliveryAddress(label, kind, precision),
        }];
      });
      const candidates = body.suggestions?.length
        ? body.suggestions
        : legacySuggestions;
      const suggestions = candidates.filter((suggestion) => (
        typeof suggestion.id === "string"
        && typeof suggestion.label === "string"
        && Number.isFinite(suggestion.latitude)
        && Number.isFinite(suggestion.longitude)
        && insideRegion(
          suggestion.latitude as number,
          suggestion.longitude as number,
          regionSlug,
        )
      ));
      if (suggestions.length) return suggestions.slice(0, 10);
    }
    return [];
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Сервис адресов временно недоступен");
  }
}

export async function resolveAddressSuggestion(
  suggestion: AddressSuggestion,
  regionSlug: string,
): Promise<AddressSuggestion & { latitude: number; longitude: number }> {
  if (Number.isFinite(suggestion.latitude) && Number.isFinite(suggestion.longitude)) {
    return suggestion as AddressSuggestion & { latitude: number; longitude: number };
  }
  const config = getRegionMapConfig(regionSlug);
  if (Platform.OS !== "web" && suggestion.uri) {
    try {
      const resolved = await Search.resolveURI(suggestion.uri, {
        geometry: true,
        searchTypes: 1 as never,
      }) as unknown as { point?: { lat?: number; lon?: number }; formatted?: string };
      const latitude = resolved.point?.lat;
      const longitude = resolved.point?.lon;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)
        && insideRegion(latitude as number, longitude as number, regionSlug)) {
        const label = localizedAddressLabel(resolved.formatted || suggestion.label, config.city);
        const complete = isSpecificDeliveryAddress(label || suggestion.label);
        return {
          ...suggestion,
          label: label || suggestion.label,
          latitude: latitude as number,
          longitude: longitude as number,
          kind: complete ? "house" : suggestion.kind,
          precision: complete ? "exact" : suggestion.precision,
          isComplete: complete || suggestion.isComplete,
        };
      }
    } catch {
      // Fall through to the server geocoder.
    }
  }
  if (suggestion.uri) {
    const params = new URLSearchParams({ uri: suggestion.uri, region: regionSlug });
    const response = await fetch(`${WEB_URL}/api/geocode?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const body = await response.json() as GeocodingProxyResponse;
      const item = body.suggestions?.[0];
      if (item && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) {
        return item as AddressSuggestion & { latitude: number; longitude: number };
      }
    }
  }
  throw new Error("Не удалось определить координаты адреса. Выберите другой вариант.");
}
