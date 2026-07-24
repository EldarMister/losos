"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type DeliveryLocation = {
  address: string;
  coordinates: [number, number];
};

type RegionSlug = "bishkek" | "osh";

type RegionMapConfig = {
  city: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
};

const regionMapConfig: Record<RegionSlug, RegionMapConfig> = {
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

function cleanAddress(value: string) {
  return value.replace(/^Кыргызстан,\s*/i, "").trim();
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

type YandexDeliveryMapProps = {
  inputId: string;
  query: string;
  region: RegionSlug;
  searchRequest: number;
  onQueryChange: (value: string) => void;
  onLocationChange: (location: DeliveryLocation | null) => void;
};

type MapCredentials = {
  mapsApiKey: string;
  suggestApiKey: string;
};

type AddressSuggestion = {
  value: string;
  subtitle: string;
};

export function YandexDeliveryMap({
  inputId,
  query,
  region,
  searchRequest,
  onQueryChange,
  onLocationChange,
}: YandexDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geocodeAddressRef = useRef<(value: string) => Promise<void>>(async () => undefined);
  const reverseGeocodeRef = useRef<(point: [number, number]) => Promise<void>>(async () => undefined);
  const suppressSuggestionsRef = useRef("");
  const handledSearchRequestRef = useRef(searchRequest);
  const [credentials, setCredentials] = useState<MapCredentials | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Настраиваем карту…");
  const [suggestionResult, setSuggestionResult] = useState<{ query: string; items: AddressSuggestion[] }>({
    query: "",
    items: [],
  });
  const config = regionMapConfig[region];
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
        types: "geo",
        print_address: "1",
      });

      try {
        const response = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Геосаджест: ${response.status}`);
        const data = await response.json() as {
          results?: Array<{ title?: { text?: string }; subtitle?: { text?: string } }>;
        };
        const nextSuggestions = (data.results || []).flatMap((item) => {
          const value = item.title?.text?.trim();
          if (!value) return [];
          return [{ value, subtitle: item.subtitle?.text?.trim() || config.city }];
        });
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

    const updatePoint = (point: [number, number], zoom = 17) => {
      placemark?.geometry.setCoordinates(point);
      map?.setCenter(point, zoom, { duration: 250 });
    };

    const reverseGeocode = async (point: [number, number]) => {
      if (!isInsideBounds(point, config.bounds)) {
        setMessage(`Выберите адрес в городе ${config.city}`);
        onLocationChange(null);
        updatePoint(config.center, 13);
        return;
      }

      setMessage("Определяем адрес…");
      try {
        const result = await (window as any).ymaps.geocode(point, { results: 1, kind: "house" });
        if (cancelled) return;
        const geoObject = result.geoObjects.get(0);
        if (!geoObject) throw new Error("Адрес не найден");
        const resolvedPoint = geoObject.geometry.getCoordinates() as [number, number];
        if (!isInsideBounds(resolvedPoint, config.bounds)) throw new Error(`Выберите адрес в городе ${config.city}`);
        const resolvedAddress = cleanAddress(geoObject.getAddressLine());
        updatePoint(resolvedPoint);
        suppressSuggestionsRef.current = resolvedAddress;
        onQueryChange(resolvedAddress);
        onLocationChange({ address: resolvedAddress, coordinates: resolvedPoint });
        setMessage("Адрес найден");
      } catch (error) {
        if (cancelled) return;
        console.error("Yandex reverse geocoding failed", error);
        setMessage(yandexErrorMessage(error, "Не удалось определить адрес"));
        onLocationChange(null);
      }
    };

    const geocodeAddress = async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setMessage("Ищем адрес…");
      onLocationChange(null);

      try {
        const request = new RegExp(config.city, "i").test(trimmed) ? trimmed : `${config.city}, ${trimmed}`;
        const result = await (window as any).ymaps.geocode(request, {
          boundedBy: config.bounds,
          strictBounds: true,
          results: 1,
        });
        if (cancelled) return;
        const geoObject = result.geoObjects.get(0);
        if (!geoObject) throw new Error(`Адрес в городе ${config.city} не найден`);
        const point = geoObject.geometry.getCoordinates() as [number, number];
        if (!isInsideBounds(point, config.bounds)) throw new Error(`Выберите адрес в городе ${config.city}`);
        const resolvedAddress = cleanAddress(geoObject.getAddressLine());
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
        }, {
          restrictMapArea: config.bounds,
          suppressMapOpenBlock: false,
        });
        placemark = new ymaps.Placemark(config.center, {}, {
          draggable: true,
          preset: "islands#redFoodIcon",
        });
        map.geoObjects.add(placemark);
        map.events.add("click", (event: any) => reverseGeocode(event.get("coords")));
        placemark.events.add("dragend", () => reverseGeocode(placemark.geometry.getCoordinates()));
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
      map?.destroy();
    };
  }, [config, credentials, inputId, mapsApiKey, onLocationChange, onQueryChange, suggestApiKey]);

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
    setMessage("Определяем местоположение…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => void reverseGeocodeRef.current([coords.latitude, coords.longitude]),
      () => setMessage("Не удалось определить местоположение"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const selectSuggestion = (value: string) => {
    suppressSuggestionsRef.current = value;
    setSuggestionResult({ query: "", items: [] });
    onQueryChange(value);
    void geocodeAddressRef.current(value);
  };

  return (
    <>
      <div ref={mapContainerRef} className="yandex-map-canvas" aria-label={`Интерактивная карта города ${config.city}`} />
      {suggestionsHost && suggestions.length > 0 ? createPortal(
        <div className="custom-address-suggestions" role="listbox" aria-label="Подсказки адресов">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion.value)}
            >
              <strong>{suggestion.value}</strong>
              <small>{suggestion.subtitle}</small>
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
