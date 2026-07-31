import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import YaMap, { type CameraPosition } from "react-native-yamap";
import { WEB_URL } from "../api";
import { colors } from "../theme";
import {
  getRegionMapConfig,
  type YandexMapProps,
} from "./yandexMapShared";
import { MapCenterMarker } from "./MapCenterMarker";

const mapKitApiKey = process.env.EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY?.trim() || "";

type GeocodingResponse = {
  suggestions?: Array<{
    label?: string;
    kind?: string;
    precision?: string;
    isComplete?: boolean;
  }>;
};

let mapKitInitialization: Promise<void> | null = null;

function initializeMapKit() {
  if (Platform.OS === "ios") return Promise.resolve();
  if (!mapKitInitialization) {
    mapKitInitialization = YaMap.init(mapKitApiKey);
  }
  return mapKitInitialization;
}

export function YandexMap({
  regionSlug,
  initialLatitude,
  initialLongitude,
  onLocationChange,
}: YandexMapProps) {
  const mapRef = useRef<YaMap>(null);
  const geocodingController = useRef<AbortController | null>(null);
  const geocodingRevision = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const region = getRegionMapConfig(regionSlug);
  const hasInitialPoint = Number.isFinite(initialLatitude)
    && Number.isFinite(initialLongitude)
    && (initialLatitude as number) >= region.bounds[0][0]
    && (initialLatitude as number) <= region.bounds[1][0]
    && (initialLongitude as number) >= region.bounds[0][1]
    && (initialLongitude as number) <= region.bounds[1][1];
  const initialPoint = hasInitialPoint
    ? { latitude: initialLatitude as number, longitude: initialLongitude as number }
    : { latitude: region.center[0], longitude: region.center[1] };

  useEffect(() => {
    let active = true;
    if (!mapKitApiKey) {
      setError("Не задан ключ Yandex MapKit для мобильного приложения.");
      return () => {
        active = false;
      };
    }
    initializeMapKit()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Не удалось запустить Yandex MapKit");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    geocodingController.current?.abort();
  }, []);

  useEffect(() => {
    if (!ready || !hasInitialPoint) return;
    mapRef.current?.setCenter(
      { lat: initialPoint.latitude, lon: initialPoint.longitude },
      17,
      0,
      0,
      0.22,
    );
  }, [hasInitialPoint, initialPoint.latitude, initialPoint.longitude, ready]);

  const resolveAddress = useCallback(async (latitude: number, longitude: number) => {
    if (latitude < region.bounds[0][0]
      || latitude > region.bounds[1][0]
      || longitude < region.bounds[0][1]
      || longitude > region.bounds[1][1]) {
      setError(`Доставка доступна только в городе ${region.city}.`);
      return;
    }

    const revision = ++geocodingRevision.current;
    geocodingController.current?.abort();
    const controller = new AbortController();
    geocodingController.current = controller;
    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        region: regionSlug,
      });
      const response = await fetch(`${WEB_URL}/api/geocode?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const result = await response.json() as GeocodingResponse;
      const suggestion = result.suggestions?.[0];
      if (!response.ok || !suggestion?.label || revision !== geocodingRevision.current) {
        throw new Error("Адрес не найден");
      }
      setError("");
      onLocationChange({
        address: suggestion.label,
        latitude,
        longitude,
        kind: suggestion.kind || "",
        precision: suggestion.precision || "",
        isComplete: suggestion.isComplete === true,
      });
    } catch (reason) {
      if (controller.signal.aborted || revision !== geocodingRevision.current) return;
      setError(reason instanceof Error && reason.message === "Адрес не найден"
        ? "Передвиньте карту ближе к нужному дому"
        : "Не удалось определить адрес. Передвиньте карту ближе к дому.");
    }
  }, [onLocationChange, region.bounds, region.city, regionSlug]);

  const handleCameraPositionChangeEnd = useCallback((event: { nativeEvent: CameraPosition }) => {
    const { point } = event.nativeEvent;
    void resolveAddress(point.lat, point.lon);
  }, [resolveAddress]);

  if (error) {
    return (
      <View style={styles.container}>
        {ready ? (
          <YaMap
            initialRegion={{ lat: initialPoint.latitude, lon: initialPoint.longitude, zoom: hasInitialPoint ? 17 : 15 }}
            onCameraPositionChangeEnd={handleCameraPositionChangeEnd}
            rotateGesturesEnabled={false}
            showUserPosition={false}
            style={styles.map}
            tiltGesturesEnabled={false}
          />
        ) : null}
        <View pointerEvents="none" style={styles.errorBanner}>
          <Text style={styles.stateText}>{error}</Text>
        </View>
        {ready ? <MapCenterMarker /> : null}
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.orange} />
        <Text style={styles.stateText}>Загружаем Яндекс Карту…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YaMap
        initialRegion={{ lat: initialPoint.latitude, lon: initialPoint.longitude, zoom: hasInitialPoint ? 17 : 15 }}
        onCameraPositionChangeEnd={handleCameraPositionChangeEnd}
        onMapLoaded={() => void resolveAddress(initialPoint.latitude, initialPoint.longitude)}
        ref={mapRef}
        rotateGesturesEnabled={false}
        showUserPosition={false}
        style={styles.map}
        tiltGesturesEnabled={false}
      />
      <MapCenterMarker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#ECEBE7",
  },
  map: {
    flex: 1,
    backgroundColor: "#ECEBE7",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
    backgroundColor: "#ECEBE7",
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBanner: {
    position: "absolute",
    zIndex: 10,
    right: 16,
    bottom: 16,
    left: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
});
