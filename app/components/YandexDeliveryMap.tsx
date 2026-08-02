"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type DeliveryLocation = {
  address: string;
  coordinates: [number, number];
};

type RegionSlug = string;
type DeliveryZonePoint = { latitude: number; longitude: number };

type RegionMapConfig = {
  city: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
};

const regionMapConfig: Record<string, RegionMapConfig> = {
  bishkek: {
    city: "Бишкек",
    center: [42.8746, 74.5698],
    bounds: [[42.72, 74.32], [43.02, 74.91]],
  },
  osh: {
    city: "Ош",
    center: [40.513, 72.8161],
    bounds: [[40.35, 72.61], [40.69, 73.08]],
  },
};

function getRegionMapConfig(
  region: RegionSlug,
  cityName?: string,
  deliveryZone?: DeliveryZonePoint[],
): RegionMapConfig {
  const fallback = regionMapConfig[region] ?? regionMapConfig.bishkek;
  const validZone = deliveryZone?.filter((point) => (
    Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  )) ?? [];
  if (validZone.length < 3) return { ...fallback, city: cityName || fallback.city };

  const latitudes = validZone.map((point) => point.latitude);
  const longitudes = validZone.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.08, 0.01);
  const lonPadding = Math.max((maxLon - minLon) * 0.08, 0.01);
  return {
    city: cityName || fallback.city,
    center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
    bounds: [
      [minLat - latPadding, minLon - lonPadding],
      [maxLat + latPadding, maxLon + lonPadding],
    ],
  };
}

let yandexMapsPromise: Promise<any> | null = null;

function loadYandexMaps(apiKey: string, suggestApiKey: string) {
  if (typeof window === "undefined") return Promise.reject(new Error("Карта доступна только в браузере"));
  if ((window as any).ymaps) {
    return new Promise<any>((resolve) => (window as any).ymaps.ready(() => resolve((window as any).ymaps)));
  }
  if (yandexMapsPromise) return yandexMapsPromise;

  yandexMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      apikey: apiKey,
      suggest_apikey: suggestApiKey,
      lang: "ru_RU",
      load: "package.full",
      csp: "202512",
      key_revision: "20260724-2",
    });
    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.dataset.yandexMaps = "true";
    script.onload = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) {
        reject(new Error("Яндекс Карты не загрузились"));
        return;
      }
      ymaps.ready(() => resolve(ymaps));
    };
    script.onerror = () => reject(new Error("Не удалось загрузить Яндекс Карты"));
    document.head.appendChild(script);
  });

  return yandexMapsPromise;
}

function isInsideBounds(point: [number, number], bounds: RegionMapConfig["bounds"]) {
  const [[minLat, minLon], [maxLat, maxLon]] = bounds;
  return point[0] >= minLat && point[0] <= maxLat && point[1] >= minLon && point[1] <= maxLon;
}

function isInsideDeliveryArea(
  point: [number, number],
  bounds: RegionMapConfig["bounds"],
  deliveryZone?: DeliveryZonePoint[],
) {
  if (!deliveryZone || deliveryZone.length < 3) return isInsideBounds(point, bounds);
  const [latitude, longitude] = point;
  let inside = false;
  for (let index = 0, previous = deliveryZone.length - 1; index < deliveryZone.length; previous = index, index += 1) {
    const current = deliveryZone[index];
    const before = deliveryZone[previous];
    const intersects = ((current.latitude > latitude) !== (before.latitude > latitude))
      && longitude < ((before.longitude - current.longitude) * (latitude - current.latitude))
        / (before.latitude - current.latitude) + current.longitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

function cleanAddress(value: string) {
  return value
    .replace(/^Кыргызстан,\s*/i, "")
    .replace(/^город\s+республиканского\s+подчинения\s*,?\s*/i, "")
    .trim();
}

function addressWithoutCity(value: string, city: string) {
  const cleaned = cleanAddress(value);
  const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cityPrefix = `(?:г\\.\\s*)?${escapedCity}(?:\\s+город)?`;

  return cleaned
    .replace(new RegExp(`^(?:${cityPrefix}\\s*,?\\s*)+`, "i"), "")
    .trim();
}

function yandexErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; statusText?: unknown; description?: unknown };
    for (const value of [candidate.message, candidate.statusText, candidate.description]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return fallback;
}

function organizationIdFromUri(uri?: string) {
  if (!uri) return null;
  try {
    const params = new URL(uri).searchParams;
    return params.get("oid");
  } catch {
    const match = uri.match(/[?&]oid=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

function addressFromSuggestionSubtitle(subtitle: string | undefined, city: string) {
  if (!subtitle) return "";
  const parts = subtitle.split(/\s*[·•]\s*/).map((part) => part.trim()).filter(Boolean);
  const addressPart = parts.find((part) => (
    new RegExp(city, "i").test(part) ||
    /(?:улица|проспект|переулок|микрорайон|шоссе|бульвар|набережная|\d)/i.test(part)
  ));
  return addressPart || parts.at(-1) || "";
}

type YandexDeliveryMapProps = {
  inputId: string;
  query: string;
  region: RegionSlug;
  regionName?: string;
  deliveryZone?: DeliveryZonePoint[];
  searchRequest: number;
  onQueryChange: (value: string) => void;
  onLocationChange: (location: DeliveryLocation | null) => void;
};

type MapCredentials = {
  mapsApiKey: string;
  suggestApiKey: string;
};

type YandexPickupMapProps = {
  region: RegionSlug;
  yandexUrl?: string;
  selected: boolean;
};

const pickupShortLinkCoordinates: Record<string, [number, number]> = {
  "https://yandex.com/maps/-/CTfwi-O-": [42.857126, 74.605106],
};

function pickupCoordinates(yandexUrl: string | undefined, region: RegionSlug): [number, number] {
  const fallback = getRegionMapConfig(region).center;
  const normalizedUrl = yandexUrl?.trim().replace(/\/$/, "");
  if (normalizedUrl && pickupShortLinkCoordinates[normalizedUrl]) return pickupShortLinkCoordinates[normalizedUrl];

  try {
    const value = yandexUrl ? new URL(yandexUrl).searchParams.get("ll") : null;
    if (value) {
      const [longitude, latitude] = value.split(",").map(Number);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) return [latitude, longitude];
    }
  } catch {
    // Неполная ссылка не мешает показать карту города.
  }
  return fallback;
}

type AddressSuggestion = {
  value: string;
  subtitle?: string;
  uri?: string;
  formattedAddress?: string;
};

type GeocodedLocation = {
  address: string;
  coordinates: [number, number];
  kind: string;
  precision: string;
  name: string;
  description: string;
};

async function geocodeViaApi(options: {
  region: RegionSlug;
  text?: string;
  uri?: string;
  kind?: string;
}): Promise<GeocodedLocation[]> {
  const params = new URLSearchParams({ region: options.region });
  if (options.text) params.set("text", options.text);
  if (options.uri) params.set("uri", options.uri);
  if (options.kind) params.set("kind", options.kind);
  const response = await fetch(`/api/geocode?${params}`, { cache: "no-store" });
  const data = await response.json() as { items?: GeocodedLocation[]; error?: string };
  if (!response.ok) throw new Error(data.error || "Не удалось определить адрес");
  return data.items || [];
}

export function YandexDeliveryMap({
  inputId,
  query,
  region,
  regionName,
  deliveryZone,
  searchRequest,
  onQueryChange,
  onLocationChange,
}: YandexDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geocodeAddressRef = useRef<(
    value: string,
    uri?: string,
    subtitle?: string,
    formattedAddress?: string,
  ) => Promise<void>>(async () => undefined);
  const reverseGeocodeRef = useRef<(point: [number, number]) => Promise<void>>(async () => undefined);
  const suppressSuggestionsRef = useRef(query.trim());
  const handledSearchRequestRef = useRef(searchRequest);
  const [credentials, setCredentials] = useState<MapCredentials | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Настраиваем карту…");
  const [suggestionResult, setSuggestionResult] = useState<{ query: string; items: AddressSuggestion[] }>({
    query: "",
    items: [],
  });
  const config = useMemo(
    () => getRegionMapConfig(region, regionName, deliveryZone),
    [deliveryZone, region, regionName],
  );
  const mapsApiKey = credentials?.mapsApiKey || "";
  const suggestApiKey = credentials?.suggestApiKey || mapsApiKey;
  const suggestionsHost = typeof document === "undefined" ? null : document.getElementById(`${inputId}-suggestions`);
  const suggestions = suggestionResult.query === query.trim() ? suggestionResult.items : [];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/maps-config", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Настройки карты недоступны")))
      .then((data: MapCredentials) => {
        const nextCredentials = {
          mapsApiKey: data.mapsApiKey || "",
          suggestApiKey: data.suggestApiKey || data.mapsApiKey || "",
        };
        setCredentials(nextCredentials);
        if (!nextCredentials.mapsApiKey || !nextCredentials.suggestApiKey) {
          setStatus("error");
          setMessage("Нужен бесплатный ключ Яндекс Карт");
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Настройки карты недоступны");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (status !== "ready" || !suggestApiKey || trimmed.length < 2) return;
    if (suppressSuggestionsRef.current === trimmed) {
      suppressSuggestionsRef.current = "";
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const [[minLat, minLon], [maxLat, maxLon]] = config.bounds;
      const request = new RegExp(config.city, "i").test(trimmed) ? trimmed : `${config.city} ${trimmed}`;
      const params = new URLSearchParams({
        apikey: suggestApiKey,
        text: request,
        lang: "ru",
        results: "6",
        highlight: "0",
        bbox: `${minLon},${minLat}~${maxLon},${maxLat}`,
        strict_bounds: "1",
        types: "geo,biz",
        attrs: "uri",
        org_address_kind: "house",
        print_address: "1",
      });

      try {
        const response = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Геосаджест: ${response.status}`);
        const data = await response.json() as {
          results?: Array<{
            title?: { text?: string };
            subtitle?: { text?: string };
            uri?: string;
            address?: { formatted_address?: string };
          }>;
        };
        const nextSuggestions = (data.results || []).flatMap((item) => {
          const value = addressWithoutCity(item.title?.text?.trim() || "", config.city);
          if (!value) return [];
          return [{
            value,
            subtitle: item.subtitle?.text?.trim(),
            uri: item.uri,
            formattedAddress: item.address?.formatted_address?.trim(),
          }];
        }).filter((suggestion, index, items) => (
          items.findIndex((candidate) => candidate.value === suggestion.value && candidate.subtitle === suggestion.subtitle) === index
        ));
        setSuggestionResult({ query: trimmed, items: nextSuggestions });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Yandex suggestions failed", error);
        setSuggestionResult({ query: trimmed, items: [] });
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [config, query, status, suggestApiKey]);

  useEffect(() => {
    if (!credentials) return;
    if (!mapsApiKey || !suggestApiKey) return;

    let cancelled = false;
    let map: any;
    let placemark: any;
    let placemarkVisible = false;
    let fitMapToPanel: (() => void) | null = null;
    let fitTimers: number[] = [];

    const updatePoint = (point: [number, number], zoom = 15) => {
      if (!placemarkVisible && placemark && map) {
        map.geoObjects.add(placemark);
        placemarkVisible = true;
      }
      placemark?.geometry.setCoordinates(point);
      map?.setCenter(point, zoom, { duration: 250 });
    };

    const reverseGeocode = async (point: [number, number]) => {
      if (!isInsideDeliveryArea(point, config.bounds, deliveryZone)) {
        setMessage(`Выберите адрес в городе ${config.city}`);
        onLocationChange(null);
        updatePoint(config.center, 13);
        return;
      }

      // Ручной выбор должен быть виден сразу. Координаты метки сохраняем
      // ровно в месте клика, а не переносим её к центру найденного здания.
      updatePoint(point);
      onLocationChange({
        address: `${config.city}, выбранная точка на карте`,
        coordinates: point,
      });
      setMessage("Определяем адрес…");
      try {
        let result = await geocodeViaApi({
          region,
          text: `${point[1]},${point[0]}`,
          kind: "house",
        });
        // На дороге, во дворе или внутри большого объекта ближайшего дома
        // может не быть. Тогда получаем улицу, район или другой топоним.
        if (result.length === 0) {
          result = await geocodeViaApi({
            region,
            text: `${point[1]},${point[0]}`,
          });
        }
        if (cancelled) return;
        const geoObject = result[0];
        if (!geoObject) throw new Error("Адрес не найден");
        if (!isInsideDeliveryArea(geoObject.coordinates, config.bounds, deliveryZone)) throw new Error(`Выберите адрес в городе ${config.city}`);
        const resolvedAddress = addressWithoutCity(geoObject.address, config.city);
        suppressSuggestionsRef.current = resolvedAddress;
        onQueryChange(resolvedAddress);
        onLocationChange({ address: resolvedAddress, coordinates: point });
        setMessage("Адрес найден");
      } catch (error) {
        if (cancelled) return;
        console.error("Yandex reverse geocoding failed", error);
        setMessage("Точка выбрана — при необходимости уточните адрес");
      }
    };

    const geocodeAddress = async (
      value: string,
      uri?: string,
      subtitle?: string,
      formattedAddress?: string,
    ) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setMessage("Ищем адрес…");
      onLocationChange(null);

      try {
        const request = new RegExp(config.city, "i").test(trimmed) ? trimmed : `${config.city}, ${trimmed}`;
        const organizationId = organizationIdFromUri(uri);
        const isOrganization = Boolean(organizationId || uri?.toLowerCase().includes("://org"));

        // URI из Геосаджеста однозначно указывает на выбранный объект. Его
        // используем раньше текстового поиска, чтобы метка попадала в выбранную
        // организацию, а не в одноимённое место.
        if (uri) {
          try {
            const uriResult = await geocodeViaApi({ region, uri });
            if (cancelled) return;
            const uriObject = uriResult[0];
            const uriPoint = uriObject?.coordinates;
            if (uriPoint && isInsideDeliveryArea(uriPoint, config.bounds, deliveryZone)) {
              const resolvedAddress = addressWithoutCity(
                uriObject.address || formattedAddress || subtitle || trimmed,
                config.city,
              ) || trimmed;
              updatePoint(uriPoint, isOrganization ? 17 : 16);
              suppressSuggestionsRef.current = trimmed;
              onQueryChange(trimmed);
              onLocationChange({ address: resolvedAddress, coordinates: uriPoint });
              setMessage(isOrganization ? "Место найдено" : "Адрес найден");
              return;
            }
          } catch (error) {
            console.warn("Yandex suggestion URI geocoding failed", { uri, error });
          }
        }

        if (organizationId) {
          try {
            const organization = await (window as any).ymaps.findOrganization(organizationId);
            if (cancelled) return;
            const organizationPoint = organization?.geometry?.getCoordinates() as [number, number] | undefined;
            if (organizationPoint && isInsideDeliveryArea(organizationPoint, config.bounds, deliveryZone)) {
              const addressLine = typeof organization.getAddressLine === "function" ? organization.getAddressLine() : "";
              const resolvedAddress = addressWithoutCity(addressLine, config.city) || trimmed;
              updatePoint(organizationPoint, 17);
              suppressSuggestionsRef.current = trimmed;
              onQueryChange(trimmed);
              onLocationChange({ address: resolvedAddress, coordinates: organizationPoint });
              setMessage("Место найдено");
              return;
            }
          } catch (error) {
            // Некоторые организации из Геосаджеста недоступны через findOrganization.
            console.warn("Yandex organization lookup failed", error);
          }
        }

        if (isOrganization) {
          // Если Яндекс не вернул точку самой организации, используем её
          // отображаемый адрес. Не запускаем повторный поиск по названию:
          // он мог выбрать другую организацию с тем же именем.
          const suggestedAddress = formattedAddress || addressFromSuggestionSubtitle(subtitle, config.city);
          if (suggestedAddress) {
            try {
              const addressRequest = new RegExp(config.city, "i").test(suggestedAddress)
                ? suggestedAddress
                : `${config.city}, ${suggestedAddress}`;
              const addressResult = await geocodeViaApi({ region, text: addressRequest });
              if (cancelled) return;
              for (const candidate of addressResult) {
                const candidatePoint = candidate.coordinates;
                if (!candidatePoint || !isInsideDeliveryArea(candidatePoint, config.bounds, deliveryZone)) continue;
                const resolvedAddress = addressWithoutCity(candidate.address || suggestedAddress, config.city) || trimmed;
                updatePoint(candidatePoint, 17);
                suppressSuggestionsRef.current = trimmed;
                onQueryChange(trimmed);
                onLocationChange({ address: resolvedAddress, coordinates: candidatePoint });
                setMessage("Место найдено");
                return;
              }
            } catch (error) {
              console.warn("Yandex suggested address geocoding failed", error);
            }
          }
        }

        const result = await geocodeViaApi({ region, text: request });
        if (cancelled) return;
        let geoObject: GeocodedLocation | undefined;
        for (const candidate of result) {
          const candidatePoint = candidate.coordinates;
          if (candidatePoint && isInsideDeliveryArea(candidatePoint, config.bounds, deliveryZone)) {
            geoObject = candidate;
            break;
          }
        }
        if (!geoObject) throw new Error(`Адрес в городе ${config.city} не найден`);
        const point = geoObject.coordinates;
        if (!isInsideDeliveryArea(point, config.bounds, deliveryZone)) throw new Error(`Выберите адрес в городе ${config.city}`);
        const resolvedAddress = addressWithoutCity(geoObject.address, config.city);
        updatePoint(point);
        suppressSuggestionsRef.current = resolvedAddress;
        onQueryChange(resolvedAddress);
        onLocationChange({ address: resolvedAddress, coordinates: point });
        setMessage("Адрес найден");
      } catch (error) {
        if (cancelled) return;
        console.error("Yandex geocoding failed", error);
        setMessage(yandexErrorMessage(error, "Не удалось найти адрес"));
      }
    };

    loadYandexMaps(mapsApiKey, suggestApiKey)
      .then((ymaps) => {
        if (cancelled || !mapContainerRef.current) return;
        map = new ymaps.Map(mapContainerRef.current, {
          center: config.center,
          zoom: 13,
          controls: ["zoomControl"],
          type: "yandex#map",
        }, {
          restrictMapArea: config.bounds,
          suppressMapOpenBlock: false,
          yandexMapDisablePoiInteractivity: true,
        });
        if (deliveryZone && deliveryZone.length >= 3) {
          map.geoObjects.add(new ymaps.Polygon(
            [deliveryZone.map((point) => [point.latitude, point.longitude])],
            {},
            {
              fillColor: "#FF5A1F0D",
              strokeColor: "#FF5A1F",
              strokeOpacity: 0.35,
              strokeWidth: 1,
              interactivityModel: "default#transparent",
            },
          ));
        }
        const markerLayout = ymaps.templateLayoutFactory.createClass(
          '<div class="delivery-map-marker" aria-hidden="true"><img src="/delivery.png" alt=""></div>',
        );
        placemark = new ymaps.Placemark(config.center, {}, {
          draggable: true,
          iconLayout: markerLayout,
          iconShape: {
            type: "Rectangle",
            coordinates: [[-30, -68], [30, 0]],
          },
          iconOffset: [-30, -68],
        });
        map.events.add("click", (event: any) => reverseGeocode(event.get("coords")));
        placemark.events.add("dragend", () => reverseGeocode(placemark.geometry.getCoordinates()));
        fitMapToPanel = () => map?.container.fitToViewport();
        window.addEventListener("resize", fitMapToPanel);
        fitTimers = [
          window.setTimeout(fitMapToPanel, 0),
          window.setTimeout(fitMapToPanel, 250),
        ];
        reverseGeocodeRef.current = reverseGeocode;
        geocodeAddressRef.current = geocodeAddress;
        setStatus("ready");
        setMessage("Введите адрес или выберите точку на карте");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Yandex Maps loading failed", error);
        setStatus("error");
        setMessage(yandexErrorMessage(error, "Карта временно недоступна"));
      });

    return () => {
      cancelled = true;
      fitTimers.forEach((timer) => window.clearTimeout(timer));
      if (fitMapToPanel) window.removeEventListener("resize", fitMapToPanel);
      map?.destroy();
    };
  }, [config, credentials, deliveryZone, inputId, mapsApiKey, onLocationChange, onQueryChange, region, suggestApiKey]);

  useEffect(() => {
    if (status !== "ready" || searchRequest <= handledSearchRequestRef.current) return;
    handledSearchRequestRef.current = searchRequest;
    void geocodeAddressRef.current(query);
  }, [query, searchRequest, status]);

  const locateUser = () => {
    if (!navigator.geolocation || status !== "ready") {
      setMessage("Геолокация недоступна");
      return;
    }

    const usePosition = ({ coords }: GeolocationPosition) => {
      void reverseGeocodeRef.current([coords.latitude, coords.longitude]);
    };
    const showLocationError = (error: GeolocationPositionError, retried = false) => {
      if (error.code === error.TIMEOUT && !retried) {
        navigator.geolocation.getCurrentPosition(
          usePosition,
          (retryError) => showLocationError(retryError, true),
          { enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 },
        );
        return;
      }
      if (error.code === error.PERMISSION_DENIED) {
        setMessage("Разрешите доступ к геолокации в настройках браузера");
        return;
      }
      if (error.code === error.POSITION_UNAVAILABLE) {
        setMessage("Не удалось получить геопозицию — проверьте GPS или интернет");
        return;
      }
      setMessage("Не удалось определить местоположение — попробуйте ещё раз");
    };

    setMessage("Определяем местоположение…");
    navigator.geolocation.getCurrentPosition(
      usePosition,
      (error) => showLocationError(error),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    suppressSuggestionsRef.current = suggestion.value;
    setSuggestionResult({ query: "", items: [] });
    onQueryChange(suggestion.value);
    void geocodeAddressRef.current(
      suggestion.value,
      suggestion.uri,
      suggestion.subtitle,
      suggestion.formattedAddress,
    );
  };

  return (
    <>
      <div ref={mapContainerRef} className="yandex-map-canvas" aria-label={`Интерактивная карта города ${config.city}`} />
      {suggestionsHost && suggestions.length > 0 ? createPortal(
        <div className="custom-address-suggestions" role="listbox" aria-label="Подсказки адресов">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${suggestion.subtitle || ""}-${index}`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <strong>{suggestion.value}</strong>
              {suggestion.subtitle ? <small>{suggestion.subtitle}</small> : null}
            </button>
          ))}
        </div>,
        suggestionsHost,
      ) : null}
      {status === "ready" ? <button className="map-locate" type="button" onClick={locateUser} aria-label="Определить моё местоположение">➤</button> : null}
      {status !== "ready" ? (
        <div className={`map-state map-state-${status}`} role={status === "error" ? "alert" : "status"}>
          {status === "loading" ? <span className="map-spinner" aria-hidden="true" /> : null}
          <span>{message}</span>
        </div>
      ) : null}
      {status === "ready" ? <div className="map-status" aria-live="polite">{message}</div> : null}
    </>
  );
}

export function YandexPickupMap({ region, yandexUrl, selected }: YandexPickupMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [credentials, setCredentials] = useState<MapCredentials | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Настраиваем карту…");
  const config = regionMapConfig[region];
  const point = pickupCoordinates(yandexUrl, region);
  const mapsApiKey = credentials?.mapsApiKey || "";
  const suggestApiKey = credentials?.suggestApiKey || mapsApiKey;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/maps-config", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Настройки карты недоступны")))
      .then((data: MapCredentials) => {
        const nextCredentials = {
          mapsApiKey: data.mapsApiKey || "",
          suggestApiKey: data.suggestApiKey || data.mapsApiKey || "",
        };
        setCredentials(nextCredentials);
        if (!nextCredentials.mapsApiKey || !nextCredentials.suggestApiKey) {
          setStatus("error");
          setMessage("Нужен бесплатный ключ Яндекс Карт");
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Настройки карты недоступны");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!credentials || !mapsApiKey || !suggestApiKey) return;
    let cancelled = false;
    let map: any;
    let fitMapToPanel: (() => void) | null = null;
    let fitTimers: number[] = [];

    loadYandexMaps(mapsApiKey, suggestApiKey)
      .then((ymaps) => {
        if (cancelled || !mapContainerRef.current) return;
        map = new ymaps.Map(mapContainerRef.current, {
          center: point,
          zoom: 17,
          controls: ["zoomControl"],
          type: "yandex#map",
        }, {
          restrictMapArea: config.bounds,
          suppressMapOpenBlock: false,
          yandexMapDisablePoiInteractivity: true,
        });
        if (selected) {
          const markerLayout = ymaps.templateLayoutFactory.createClass(
            '<div class="delivery-map-marker" aria-hidden="true"><img src="/delivery.png" alt=""></div>',
          );
          const placemark = new ymaps.Placemark(point, {}, {
            iconLayout: markerLayout,
            iconShape: { type: "Rectangle", coordinates: [[-30, -68], [30, 0]] },
            iconOffset: [-30, -68],
          });
          map.geoObjects.add(placemark);
        }
        fitMapToPanel = () => map?.container.fitToViewport();
        window.addEventListener("resize", fitMapToPanel);
        fitTimers = [window.setTimeout(fitMapToPanel, 0), window.setTimeout(fitMapToPanel, 250)];
        setStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Yandex pickup map loading failed", error);
        setStatus("error");
        setMessage(yandexErrorMessage(error, "Карта временно недоступна"));
      });

    return () => {
      cancelled = true;
      fitTimers.forEach((timer) => window.clearTimeout(timer));
      if (fitMapToPanel) window.removeEventListener("resize", fitMapToPanel);
      map?.destroy();
    };
  }, [config.bounds, credentials, mapsApiKey, point, selected, suggestApiKey]);

  return (
    <>
      <div ref={mapContainerRef} className="yandex-map-canvas" aria-label={`Интерактивная карта самовывоза в городе ${config.city}`} />
      {status !== "ready" ? (
        <div className={`map-state map-state-${status}`} role={status === "error" ? "alert" : "status"}>
          {status === "loading" ? <span className="map-spinner" aria-hidden="true" /> : null}
          <span>{message}</span>
        </div>
      ) : null}
    </>
  );
}
