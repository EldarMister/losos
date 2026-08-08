import type { MapsConfig } from "../api";

export type MapPoint = {
  address: string;
  latitude: number;
  longitude: number;
  kind: string;
  precision: string;
  isComplete: boolean;
};

export type DeliveryZonePoint = {
  latitude: number;
  longitude: number;
};

export type YandexMapProps = {
  regionSlug: string;
  regionName?: string;
  deliveryZone?: DeliveryZonePoint[];
  initialLatitude?: number;
  initialLongitude?: number;
  allowOutOfRegionInitialPoint?: boolean;
  focusRequest?: number;
  onLocationChange: (point: MapPoint) => void;
  showCenterMarker?: boolean;
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
  }>;
  onMarkerPress?: (id: string) => void;
};

type RegionMapConfig = {
  city: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
};

const regions: Record<string, RegionMapConfig> = {
  bishkek: {
    city: "Бишкек",
    center: [42.851968, 74.624326],
    bounds: [[42.72, 74.32], [43.02, 74.91]],
  },
  osh: {
    city: "Ош",
    center: [40.513, 72.8161],
    bounds: [[40.35, 72.61], [40.69, 73.08]],
  },
};

const defaultDeliveryZones: Record<string, DeliveryZonePoint[]> = {
  bishkek: [
    { latitude: 42.94, longitude: 74.48 },
    { latitude: 42.945, longitude: 74.62 },
    { latitude: 42.925, longitude: 74.71 },
    { latitude: 42.89, longitude: 74.75 },
    { latitude: 42.835, longitude: 74.74 },
    { latitude: 42.795, longitude: 74.68 },
    { latitude: 42.78, longitude: 74.57 },
    { latitude: 42.795, longitude: 74.48 },
    { latitude: 42.84, longitude: 74.43 },
    { latitude: 42.9, longitude: 74.44 },
  ],
  osh: [
    { latitude: 40.59, longitude: 72.75 },
    { latitude: 40.6, longitude: 72.84 },
    { latitude: 40.565, longitude: 72.9 },
    { latitude: 40.505, longitude: 72.91 },
    { latitude: 40.46, longitude: 72.86 },
    { latitude: 40.445, longitude: 72.78 },
    { latitude: 40.475, longitude: 72.72 },
    { latitude: 40.535, longitude: 72.7 },
  ],
};

export function getRegionMapConfig(
  regionSlug: string,
  deliveryZone?: DeliveryZonePoint[],
  regionName?: string,
) {
  const fallback = regions[regionSlug] ?? regions.bishkek;
  const validZone = deliveryZone?.filter((point) => (
    Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  ));
  if (!validZone || validZone.length < 3) {
    return { ...fallback, city: regionName || fallback.city };
  }

  const latitudes = validZone.map((point) => point.latitude);
  const longitudes = validZone.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudePadding = Math.max((maxLatitude - minLatitude) * 0.18, 0.01);
  const longitudePadding = Math.max((maxLongitude - minLongitude) * 0.18, 0.01);
  return {
    city: regionName || fallback.city,
    center: [
      (minLatitude + maxLatitude) / 2,
      (minLongitude + maxLongitude) / 2,
    ] as [number, number],
    bounds: [
      [minLatitude - latitudePadding, minLongitude - longitudePadding],
      [maxLatitude + latitudePadding, maxLongitude + longitudePadding],
    ] as [[number, number], [number, number]],
  };
}

export function isPointInRegionBounds(
  regionSlug: string,
  latitude?: number,
  longitude?: number,
  deliveryZone?: DeliveryZonePoint[],
) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  const { bounds } = getRegionMapConfig(regionSlug, deliveryZone);
  return (latitude as number) >= bounds[0][0]
    && (latitude as number) <= bounds[1][0]
    && (longitude as number) >= bounds[0][1]
    && (longitude as number) <= bounds[1][1];
}

export function isUsableInitialMapPoint(
  regionSlug: string,
  latitude?: number,
  longitude?: number,
  allowOutOfRegion = false,
  deliveryZone?: DeliveryZonePoint[],
) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return allowOutOfRegion
    || isPointInRegionBounds(regionSlug, latitude, longitude, deliveryZone);
}

export function getDeliveryZone(regionSlug: string, points?: DeliveryZonePoint[]) {
  const valid = points?.filter((point) => (
    Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  ));
  return valid && valid.length >= 3
    ? valid
    : defaultDeliveryZones[regionSlug] ?? defaultDeliveryZones.bishkek;
}

export function isPointInDeliveryZone(
  latitude: number,
  longitude: number,
  zone: DeliveryZonePoint[],
) {
  let inside = false;
  for (let index = 0, previous = zone.length - 1; index < zone.length; previous = index, index += 1) {
    const currentPoint = zone[index];
    const previousPoint = zone[previous];
    const intersects = ((currentPoint.latitude > latitude) !== (previousPoint.latitude > latitude))
      && longitude < ((previousPoint.longitude - currentPoint.longitude) * (latitude - currentPoint.latitude))
        / (previousPoint.latitude - currentPoint.latitude) + currentPoint.longitude;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function createYandexMapHtml(
  credentials: MapsConfig,
  regionSlug: string,
  initialLatitude?: number,
  initialLongitude?: number,
  deliveryZone?: DeliveryZonePoint[],
  allowOutOfRegionInitialPoint = false,
  regionName?: string,
) {
  const config = getRegionMapConfig(regionSlug, deliveryZone, regionName);
  const zone = getDeliveryZone(regionSlug, deliveryZone);
  const geocoderUrl = credentials.geocoderUrl?.trim() || "";
  const hasInitialPoint = isUsableInitialMapPoint(
    regionSlug,
    initialLatitude,
    initialLongitude,
    allowOutOfRegionInitialPoint,
    deliveryZone,
  );
  const center: [number, number] = hasInitialPoint
    ? [initialLatitude as number, initialLongitude as number]
    : config.center;

  if (!credentials.mapsApiKey) {
    return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #ecebe7; }
    * { box-sizing: border-box; }
    .state {
      position: fixed;
      z-index: 2000;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 28px;
      color: #696969;
      font: 600 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
      background: #ecebe7;
    }
    .leaflet-control-zoom {
      border: 0 !important;
      box-shadow: 0 3px 13px rgba(0,0,0,.18) !important;
    }
    .leaflet-control-zoom a {
      width: 42px !important;
      height: 42px !important;
      line-height: 40px !important;
      color: #454545 !important;
      border: 0 !important;
    }
    .leaflet-control-attribution { font-size: 8px; }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <div class="state" id="state">Загружаем карту…</div>
  <script>
    (function () {
      const config = ${JSON.stringify(config)};
      const deliveryZone = ${JSON.stringify(zone)};
      const initialCenter = ${JSON.stringify(center)};
      const geocoderUrl = ${JSON.stringify(geocoderUrl)};
      const state = document.getElementById("state");
      let timer;
      let geocodeRevision = 0;

      function send(type, payload) {
        const message = JSON.stringify({ source: "losos-yandex-map", type, ...payload });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        }
        window.parent.postMessage(message, "*");
      }

      function addressFromProperties(properties) {
        const street = String(properties.street || properties.name || "").trim();
        const house = String(properties.housenumber || "").trim();
        const district = String(properties.district || "").trim();
        return [street, house].filter(Boolean).join(", ")
          || district
          || config.city;
      }

      async function reverseViaProxy(point, revision) {
        if (!geocoderUrl) return false;
        const params = new URLSearchParams({
          lat: String(point.lat),
          lon: String(point.lng),
          region: ${JSON.stringify(regionSlug)}
        });
        const response = await fetch(geocoderUrl + "?" + params.toString(), {
          headers: { Accept: "application/json" }
        });
        if (!response.ok) return false;
        const data = await response.json();
        const suggestion = data.suggestions && data.suggestions[0];
        if (!suggestion) return false;
        if (revision !== geocodeRevision) return true;
        send("location", {
          address: suggestion.label,
          latitude: point.lat,
          longitude: point.lng,
          kind: String(suggestion.kind || ""),
          precision: String(suggestion.precision || ""),
          isComplete: suggestion.isComplete === true
        });
        return true;
      }

      async function resolveCenter(map) {
        const point = map.getCenter();
        const revision = ++geocodeRevision;
        try {
          if (await reverseViaProxy(point, revision)) return;
          const params = new URLSearchParams({
            lat: String(point.lat),
            lon: String(point.lng),
            lang: "default"
          });
          const response = await fetch("https://photon.komoot.io/reverse?" + params.toString(), {
            headers: { Accept: "application/json" }
          });
          if (!response.ok) throw new Error("reverse geocoding failed");
          const data = await response.json();
          const feature = data.features && data.features[0];
          if (!feature) throw new Error("address not found");
          if (revision !== geocodeRevision) return;
          const properties = feature.properties || {};
          const houseNumber = String(properties.housenumber || "").trim();
          send("location", {
            address: addressFromProperties(properties),
            latitude: point.lat,
            longitude: point.lng,
            kind: houseNumber ? "house" : String(properties.type || "street"),
            precision: houseNumber ? "exact" : "street",
            isComplete: Boolean(houseNumber)
          });
        } catch {
          // Keep the map clear if reverse geocoding has no result yet.
        }
      }

      function scheduleResolve(map) {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { resolveCenter(map); }, 520);
      }

      if (!window.L) {
        state.textContent = "Не удалось загрузить интерактивную карту";
        send("error", { message: state.textContent });
        return;
      }

      const map = window.L.map("map", {
        zoomControl: false,
        attributionControl: true,
        maxBounds: config.bounds,
        maxBoundsViscosity: 1
      }).setView(initialCenter, ${hasInitialPoint ? 17 : 11});
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 10,
        maxZoom: 19,
        attribution: "© OpenStreetMap"
      }).addTo(map);
      window.L.polygon(deliveryZone.map(function (point) {
        return [point.latitude, point.longitude];
      }), {
        color: "#ff5a1f",
        weight: 0.1,
        fillColor: "#ff5a1f",
        fillOpacity: 0,
        interactive: false
      }).addTo(map);
      window.L.control.zoom({ position: "topright" }).addTo(map);
      map.on("moveend", function () { scheduleResolve(map); });
      map.on("click", function (event) {
        map.setView(event.latlng, Math.max(map.getZoom(), 16), { animate: true });
      });
      state.style.display = "none";
      send("ready", {});
      scheduleResolve(map);
    }());
  </script>
</body>
</html>`;
  }

  const apiUrl = new URL("https://api-maps.yandex.ru/2.1/");
  apiUrl.searchParams.set("apikey", credentials.mapsApiKey);
  apiUrl.searchParams.set("suggest_apikey", credentials.suggestApiKey);
  apiUrl.searchParams.set("lang", "ru_RU");
  apiUrl.searchParams.set("load", "package.full");

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #ecebe7; }
    * { box-sizing: border-box; }
    .state {
      position: fixed;
      z-index: 2000;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 28px;
      color: #696969;
      font: 600 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      text-align: center;
      background: #ecebe7;
    }
  </style>
  <script src="${apiUrl.toString()}"></script>
</head>
<body>
  <div id="map"></div>
  <div class="state" id="state">Загружаем карту…</div>
  <script>
    (function () {
      const config = ${JSON.stringify(config)};
      const deliveryZone = ${JSON.stringify(zone)};
      const initialCenter = ${JSON.stringify(center)};
      const geocoderUrl = ${JSON.stringify(geocoderUrl)};
      const state = document.getElementById("state");
      let map;
      let timer;
      let geocodeRevision = 0;

      function send(type, payload) {
        const message = JSON.stringify({ source: "losos-yandex-map", type, ...payload });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        }
        window.parent.postMessage(message, "*");
      }

      function cleanAddress(value) {
        return String(value || "")
          .replace(/^Кыргызстан,\\s*/i, "")
          .replace(new RegExp("^(?:г\\\\.\\\\s*)?" + config.city + "(?:\\\\s+город)?\\\\s*,?\\\\s*", "i"), "")
          .trim();
      }

      function sendSuggestion(point, suggestion) {
        send("location", {
          address: String(suggestion.label || ""),
          latitude: point[0],
          longitude: point[1],
          kind: String(suggestion.kind || ""),
          precision: String(suggestion.precision || ""),
          isComplete: suggestion.isComplete === true
        });
      }

      function reverseViaProxy(point, revision) {
        if (!geocoderUrl) return Promise.resolve(false);
        const params = new URLSearchParams({
          lat: String(point[0]),
          lon: String(point[1]),
          region: ${JSON.stringify(regionSlug)}
        });
        return fetch(geocoderUrl + "?" + params.toString(), {
          headers: { Accept: "application/json" }
        })
          .then(function (response) {
            if (!response.ok) return false;
            return response.json().then(function (data) {
              const suggestion = data.suggestions && data.suggestions[0];
              if (!suggestion) return false;
              if (revision !== geocodeRevision) return true;
              sendSuggestion(point, suggestion);
              return true;
            });
          })
          .catch(function () { return false; });
      }

      function resolvePoint(point) {
        const revision = ++geocodeRevision;
        reverseViaProxy(point, revision).then(function (resolved) {
          if (resolved || revision !== geocodeRevision) return;
          return window.ymaps.geocode(point, { results: 1 })
          .then(function (result) {
            if (revision !== geocodeRevision) return;
            const object = result.geoObjects.get(0);
            if (!object) throw new Error("Адрес не найден");
            const metadata = object.properties.get("metaDataProperty.GeocoderMetaData") || {};
            const components = metadata.Address && Array.isArray(metadata.Address.Components)
              ? metadata.Address.Components
              : [];
            const houseNumber = components.find(function (component) {
              return component && component.kind === "house";
            });
            const address = cleanAddress(object.getAddressLine());
            const kind = String(metadata.kind || "");
            const precision = String(metadata.precision || "");
            const isComplete = kind === "house"
              && Boolean(houseNumber && houseNumber.name || /(?:,|\\s)\\s*\\d+[\\wА-Яа-я/-]*\\s*$/u.test(address));
            send("location", {
              address,
              latitude: point[0],
              longitude: point[1],
              kind,
              precision,
              isComplete
            });
          })
          .catch(function () {
            if (revision !== geocodeRevision) return;
          });
        });
      }

      function resolveCenter() {
        if (!map) return;
        resolvePoint(map.getCenter());
      }

      function scheduleResolve() {
        window.clearTimeout(timer);
        timer = window.setTimeout(resolveCenter, 380);
      }

      if (!window.ymaps) {
        state.textContent = "Не удалось загрузить Яндекс Карту";
        send("error", { message: state.textContent });
        return;
      }

      window.ymaps.ready(function () {
        map = new window.ymaps.Map("map", {
          center: initialCenter,
          zoom: ${hasInitialPoint ? 17 : 11},
          controls: ["zoomControl"],
          type: "yandex#map"
        }, {
          restrictMapArea: config.bounds,
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true
        });
        map.controls.get("zoomControl").options.set({ position: { right: 12, top: 76 } });
        map.events.add("actionend", scheduleResolve);
        map.events.add("click", function (event) {
          const clickedPoint = event.get("coords");
          map.setCenter(clickedPoint, Math.max(map.getZoom(), 16), { duration: 220 });
          window.clearTimeout(timer);
          timer = window.setTimeout(function () { resolvePoint(clickedPoint); }, 260);
        });
        map.geoObjects.add(new window.ymaps.Polygon(
          [deliveryZone.map(function (point) { return [point.latitude, point.longitude]; })],
          { hintContent: "Зона доставки" },
          {
            fillColor: "#FF5A1F00",
            strokeColor: "#FF5A1F",
            strokeWidth: 1,
            interactivityModel: "default#transparent",
            zIndex: 1
          }
        ));
        state.style.display = "none";
        send("ready", {});
        scheduleResolve();
      });
    }());
  </script>
</body>
</html>`;
}

export function parseMapMessage(value: unknown): MapPoint | null {
  try {
    const payload = typeof value === "string" ? JSON.parse(value) : value;
    if (
      payload?.source === "losos-yandex-map" &&
      payload?.type === "location" &&
      typeof payload.address === "string" &&
      Number.isFinite(payload.latitude) &&
      Number.isFinite(payload.longitude)
    ) {
      return {
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        kind: typeof payload.kind === "string" ? payload.kind : "",
        precision: typeof payload.precision === "string" ? payload.precision : "",
        isComplete: payload.isComplete === true,
      };
    }
  } catch {
    // Сообщения от других iframe/WebView не относятся к карте.
  }
  return null;
}
