import { WEB_URL } from "./api";
import { getRegionMapConfig } from "./components/yandexMapShared";

export type AddressSuggestion = {
  id: string;
  label: string;
  subtitle: string;
  latitude: number;
  longitude: number;
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
        const label = String(item.name || item.address || "")
          .replace(/^Кыргызстан,\s*/i, "")
          .replace(new RegExp(`^(?:г\\.\\s*)?${config.city}\\s*,?\\s*`, "i"), "")
          .trim();
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
        && insideRegion(suggestion.latitude, suggestion.longitude, regionSlug)
      ));
      if (suggestions.length) return suggestions.slice(0, 6);
    }
    return [];
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("Сервис адресов временно недоступен");
  }
}
