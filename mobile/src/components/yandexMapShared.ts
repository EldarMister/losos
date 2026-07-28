import type { MapsConfig } from "../api";

export type MapPoint = {
  address: string;
  latitude: number;
  longitude: number;
};

export type YandexMapProps = {
  regionSlug: string;
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationChange: (point: MapPoint) => void;
};

type RegionMapConfig = {
  city: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
};

const regions: Record<string, RegionMapConfig> = {
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

export function getRegionMapConfig(regionSlug: string) {
  return regions[regionSlug] ?? regions.bishkek;
}

export function createYandexMapHtml(
  credentials: MapsConfig,
  regionSlug: string,
  initialLatitude?: number,
  initialLongitude?: number,
) {
  const config = getRegionMapConfig(regionSlug);
  const hasInitialPoint = Number.isFinite(initialLatitude) && Number.isFinite(initialLongitude);
  const center: [number, number] = hasInitialPoint
    ? [initialLatitude as number, initialLongitude as number]
    : config.center;
  const markerSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
    '<rect x="11" y="14" width="26" height="27" rx="5" fill="#ff4d00"/>',
    '<path d="M17 17v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>',
    '<path d="M17 24h14M17 30h9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
    "</svg>",
  ].join("");
  const markerImageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg)}`;

  if (!credentials.mapsApiKey) {
    const widgetUrl = new URL("https://yandex.com/map-widget/v1/");
    widgetUrl.searchParams.set("ll", `${center[1]},${center[0]}`);
    widgetUrl.searchParams.set("z", hasInitialPoint ? "17" : "15");
    return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <style>
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #ecebe7; }
    * { box-sizing: border-box; }
    iframe { width: 100%; height: 100%; border: 0; }
    .pin {
      position: fixed;
      z-index: 10;
      left: 50%;
      top: 50%;
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 6px 18px rgba(64, 36, 18, .2);
      transform: translate(-50%, -82%);
      pointer-events: none;
    }
    .pin::after {
      content: "";
      position: absolute;
      left: 27px;
      bottom: -21px;
      width: 4px;
      height: 23px;
      border-radius: 4px;
      background: #ff4d00;
    }
    .pin img { position: relative; z-index: 1; width: 36px; height: 36px; object-fit: contain; }
  </style>
</head>
<body>
  <iframe src="${widgetUrl.toString()}" allowfullscreen title="Яндекс Карта"></iframe>
  <div class="pin" aria-hidden="true"><img src="${markerImageUrl}" alt=""></div>
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
    .pin {
      position: fixed;
      z-index: 10;
      left: 50%;
      top: 50%;
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 6px 18px rgba(64, 36, 18, .2);
      transform: translate(-50%, -82%);
      pointer-events: none;
    }
    .pin::after {
      content: "";
      position: absolute;
      left: 27px;
      bottom: -21px;
      width: 4px;
      height: 23px;
      border-radius: 4px;
      background: #ff4d00;
    }
    .pin img { position: relative; z-index: 1; width: 36px; height: 36px; object-fit: contain; }
    .state {
      position: fixed;
      z-index: 20;
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
  <div class="pin" aria-hidden="true"><img src="${markerImageUrl}" alt=""></div>
  <div class="state" id="state">Загружаем карту…</div>
  <script>
    (function () {
      const config = ${JSON.stringify(config)};
      const initialCenter = ${JSON.stringify(center)};
      const state = document.getElementById("state");
      let map;
      let timer;

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

      function resolveCenter() {
        if (!map) return;
        const point = map.getCenter();
        window.ymaps.geocode(point, { results: 1, kind: "house" })
          .then(function (result) {
            const object = result.geoObjects.get(0);
            if (!object) throw new Error("Адрес не найден");
            const coordinates = object.geometry.getCoordinates();
            send("location", {
              address: cleanAddress(object.getAddressLine()),
              latitude: coordinates[0],
              longitude: coordinates[1]
            });
          })
          .catch(function () {
            send("status", { message: "Передвиньте карту ближе к нужному дому" });
          });
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
          zoom: ${hasInitialPoint ? 17 : 15},
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
          map.setCenter(event.get("coords"), Math.max(map.getZoom(), 16), { duration: 220 });
          scheduleResolve();
        });
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
      };
    }
  } catch {
    // Сообщения от других iframe/WebView не относятся к карте.
  }
  return null;
}
