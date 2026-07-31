import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import YaMap, { Marker, type CameraPosition } from "react-native-yamap";
import { WEB_URL } from "../api";
import { colors } from "../theme";
import {
  getRegionMapConfig,
  type YandexMapProps,
} from "./yandexMapShared";
import { MapCenterMarker } from "./MapCenterMarker";

const mapKitApiKey = process.env.EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY?.trim() || "";
const pickupMarkerImage = require("../../assets/pickup-marker.png");

type GeocodingResponse = {
  suggestions?: Array<{
    label?: string;
    kind?: string;
    precision?: string;
    isComplete?: boolean;
  }>;
  items?: Array<{
    address?: string;
    name?: string;
    kind?: string;
    precision?: string;
  }>;
};

function addressFromDeviceGeocoder(place: Location.LocationGeocodedAddress) {
  const street = place.street || place.name || "";
  const streetNumber = place.streetNumber || "";
  const address = [street, streetNumber].filter(Boolean).join(", ");
  const fallback = [place.district, place.city, place.region].filter(Boolean).join(", ");
  return {
    address: address || fallback,
    kind: streetNumber ? "house" : street ? "street" : "district",
    precision: streetNumber ? "exact" : street ? "street" : "other",
    isComplete: Boolean(street && streetNumber),
  };
}

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
  focusRequest = 0,
  onLocationChange,
  showCenterMarker = true,
  markers = [],
  onMarkerPress,
}: YandexMapProps) {
  const mapRef = useRef<YaMap>(null);
  const geocodingController = useRef<AbortController | null>(null);
  const geocodingRevision = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const region = getRegionMapConfig(regionSlug);
  const hasInitialPoint = Number.isFinite(initialLatitude)
    && Number.isFinite(initialLongitude);
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
    if (!ready || !markers.length) return;
    mapRef.current?.fitMarkers(markers.map((marker) => ({
      lat: marker.latitude,
      lon: marker.longitude,
    })));
  }, [markers, ready]);

  useEffect(() => {
    if (!showCenterMarker) setError("");
  }, [showCenterMarker]);

  const resolveAddress = useCallback(async (latitude: number, longitude: number) => {
    const insideDeliveryRegion = !(latitude < region.bounds[0][0]
      || latitude > region.bounds[1][0]
      || longitude < region.bounds[0][1]
      || longitude > region.bounds[1][1]);
    if (!insideDeliveryRegion) {
      setError(`Доставка доступна только в городе ${region.city}.`);
    }

    const revision = ++geocodingRevision.current;
    geocodingController.current?.abort();
    const controller = new AbortController();
    geocodingController.current = controller;
    try {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
      });
      if (insideDeliveryRegion) params.set("region", regionSlug);
      const response = await fetch(`${WEB_URL}/api/geocode?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const result = await response.json() as GeocodingResponse;
      const suggestion = result.suggestions?.[0];
      const legacySuggestion = result.items?.[0];
      const address = suggestion?.label || legacySuggestion?.name || legacySuggestion?.address || "";
      if (!response.ok || !address || revision !== geocodingRevision.current) {
        throw new Error("Адрес не найден");
      }
      if (insideDeliveryRegion) setError("");
      onLocationChange({
        address,
        latitude,
        longitude,
        kind: suggestion?.kind || legacySuggestion?.kind || "",
        precision: suggestion?.precision || legacySuggestion?.precision || "",
        isComplete: insideDeliveryRegion && (
          suggestion?.isComplete === true
          || (legacySuggestion?.kind === "house" && legacySuggestion.precision === "exact")
        ),
      });
    } catch (reason) {
      if (controller.signal.aborted || revision !== geocodingRevision.current) return;
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const fallback = place ? addressFromDeviceGeocoder(place) : null;
        if (!fallback?.address || revision !== geocodingRevision.current) {
          throw new Error("Адрес не найден");
        }
        if (insideDeliveryRegion) setError("");
        onLocationChange({
          ...fallback,
          latitude,
          longitude,
          isComplete: insideDeliveryRegion && fallback.isComplete,
        });
      } catch {
        if (revision !== geocodingRevision.current) return;
        setError(reason instanceof Error && reason.message === "Адрес не найден"
          ? "Не удалось определить адрес. Передвиньте метку ближе к дому."
          : "Сервис адресов временно недоступен. Попробуйте ещё раз.");
      }
    }
  }, [onLocationChange, region.bounds, region.city, regionSlug]);

  useEffect(() => {
    if (!ready || !hasInitialPoint) return;
    mapRef.current?.setCenter(
      { lat: initialPoint.latitude, lon: initialPoint.longitude },
      17,
      0,
      0,
      0.28,
    );
    if (focusRequest > 0) {
      void resolveAddress(initialPoint.latitude, initialPoint.longitude);
    }
  }, [
    focusRequest,
    hasInitialPoint,
    initialPoint.latitude,
    initialPoint.longitude,
    ready,
    resolveAddress,
  ]);

  const handleCameraPositionChangeEnd = useCallback((event: { nativeEvent: CameraPosition }) => {
    if (!showCenterMarker) return;
    const { point } = event.nativeEvent;
    void resolveAddress(point.lat, point.lon);
  }, [resolveAddress, showCenterMarker]);

  const markerElements = markers.map((marker) => (
    <Marker
      anchor={{ x: 0.5, y: 1 }}
      key={marker.id}
      onPress={() => onMarkerPress?.(marker.id)}
      point={{ lat: marker.latitude, lon: marker.longitude }}
      scale={0.14}
      source={pickupMarkerImage}
    />
  ));

  if (!ready) {
    return (
      <View style={styles.state}>
        {error ? null : <ActivityIndicator color={colors.orange} />}
        <Text style={styles.stateText}>{error || "Загружаем Яндекс Карту…"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YaMap
        initialRegion={{ lat: initialPoint.latitude, lon: initialPoint.longitude, zoom: hasInitialPoint ? 17 : 15 }}
        onCameraPositionChangeEnd={handleCameraPositionChangeEnd}
        onMapLoaded={() => {
          if (markers.length) {
            mapRef.current?.fitMarkers(markers.map((marker) => ({
              lat: marker.latitude,
              lon: marker.longitude,
            })));
          } else if (showCenterMarker) {
            void resolveAddress(initialPoint.latitude, initialPoint.longitude);
          }
        }}
        ref={mapRef}
        rotateGesturesEnabled={false}
        showUserPosition={false}
        style={styles.map}
        tiltGesturesEnabled={false}
      >
        {markerElements}
      </YaMap>
      {error ? (
        <View pointerEvents="none" style={styles.errorBanner}>
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : null}
      {showCenterMarker ? <MapCenterMarker /> : null}
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
