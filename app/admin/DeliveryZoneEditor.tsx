"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { DeliveryZonePoint } from "./admin-types";

type DeliveryZoneEditorProps = {
  cityName: string;
  points: DeliveryZonePoint[];
  regionSlug: string;
  onChange: (points: DeliveryZonePoint[]) => void;
};

const regionCenters: Record<string, [number, number]> = {
  bishkek: [42.8746, 74.5698],
  osh: [40.513, 72.8161],
  "otuz-adyr": [40.606046, 72.966095],
};

let mapsPromise: Promise<any> | null = null;

function loadMaps() {
  if (typeof window === "undefined") return Promise.reject(new Error("Карта доступна только в браузере"));
  if ((window as any).ymaps) return new Promise<any>((resolve) => (window as any).ymaps.ready(() => resolve((window as any).ymaps)));
  if (mapsPromise) return mapsPromise;

  mapsPromise = fetch("/api/maps-config", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error("Настройки карты недоступны")))
    .then((credentials: { mapsApiKey?: string }) => new Promise<any>((resolve, reject) => {
      if (!credentials.mapsApiKey) {
        reject(new Error("Не задан ключ Яндекс Карт"));
        return;
      }
      const script = document.createElement("script");
      const params = new URLSearchParams({ apikey: credentials.mapsApiKey, lang: "ru_RU", load: "package.full" });
      script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
      script.async = true;
      script.dataset.adminZoneMap = "true";
      script.onload = () => {
        const ymaps = (window as any).ymaps;
        if (!ymaps) reject(new Error("Яндекс Карты не загрузились"));
        else ymaps.ready(() => resolve(ymaps));
      };
      script.onerror = () => reject(new Error("Не удалось загрузить Яндекс Карты"));
      document.head.appendChild(script);
    }))
    .catch((error) => {
      mapsPromise = null;
      throw error;
    });
  return mapsPromise;
}

function coordinateKey(points: DeliveryZonePoint[]) {
  return points.map((point) => `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`).join(";");
}

export function DeliveryZoneEditor({ cityName, points, regionSlug, onChange }: DeliveryZoneEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const externalKeyRef = useRef(coordinateKey(points));
  const [status, setStatus] = useState("Загружаем карту…");

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let map: any;
    const center = regionCenters[regionSlug] || regionCenters.bishkek;

    void loadMaps().then((ymaps) => {
      if (cancelled || !containerRef.current) return;
      map = new ymaps.Map(containerRef.current, { center, zoom: 11, controls: ["zoomControl", "typeSelector"] }, { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true });
      const polygon = new ymaps.Polygon(
        points.length >= 3 ? [points.map((point) => [point.latitude, point.longitude])] : [],
        { hintContent: `Зона доставки: ${cityName}` },
        { editorDrawingCursor: "crosshair", editorMaxPoints: 500, fillColor: "#2563EB20", strokeColor: "#2563EB", strokeWidth: 3 },
      );
      map.geoObjects.add(polygon);
      polygon.geometry.events.add("change", () => {
        const outerRing = polygon.geometry.getCoordinates()?.[0] || [];
        const nextPoints = outerRing.map(([latitude, longitude]: [number, number]) => ({ latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) }));
        const nextKey = coordinateKey(nextPoints);
        if (nextKey === externalKeyRef.current) return;
        externalKeyRef.current = nextKey;
        onChangeRef.current(nextPoints);
        setStatus(nextPoints.length >= 3 ? `${nextPoints.length} точек. Перетаскивайте вершины.` : "Поставьте на карте минимум три точки.");
      });
      polygonRef.current = polygon;
      mapRef.current = map;
      if (points.length >= 3) {
        polygon.editor.startEditing();
        map.setBounds(polygon.geometry.getBounds(), { checkZoomRange: true, zoomMargin: 42 });
        setStatus(`${points.length} точек. Перетаскивайте вершины.`);
      } else {
        polygon.editor.startDrawing();
        setStatus("Кликайте по карте, чтобы нарисовать границу.");
      }
    }).catch((error) => {
      if (!cancelled) setStatus(error instanceof Error ? error.message : "Карта недоступна");
    });

    return () => {
      cancelled = true;
      polygonRef.current = null;
      mapRef.current = null;
      map?.destroy();
    };
    // The map must be recreated only when the selected city changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionSlug]);

  useEffect(() => {
    const polygon = polygonRef.current;
    if (!polygon) return;
    const nextKey = coordinateKey(points);
    if (nextKey === externalKeyRef.current) return;
    externalKeyRef.current = nextKey;
    polygon.editor.stopDrawing();
    polygon.editor.stopEditing();
    polygon.geometry.setCoordinates(points.length >= 3 ? [points.map((point) => [point.latitude, point.longitude])] : []);
    if (points.length >= 3) polygon.editor.startEditing();
    else polygon.editor.startDrawing();
  }, [points]);

  const redraw = () => {
    const polygon = polygonRef.current;
    if (!polygon) return;
    polygon.editor.stopEditing();
    polygon.editor.stopDrawing();
    externalKeyRef.current = "";
    polygon.geometry.setCoordinates([]);
    onChangeRef.current([]);
    polygon.editor.startDrawing();
    setStatus("Кликайте по карте, чтобы нарисовать новую границу.");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="h-[360px] w-full bg-slate-100 sm:h-[440px]" ref={containerRef} />
      <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <span className="text-sm text-slate-600">{status}</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-50" disabled={points.length < 3} onClick={() => {
            const bounds = polygonRef.current?.geometry.getBounds();
            if (bounds) mapRef.current?.setBounds(bounds, { checkZoomRange: true, zoomMargin: 42 });
          }}>Показать всю зону</button>
          <button type="button" className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={redraw}>Нарисовать заново</button>
        </div>
      </div>
    </div>
  );
}
