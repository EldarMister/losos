import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from "react-native";
import YaMap, {
  Marker,
  Polyline,
  Search,
  type CameraPosition,
} from "react-native-yamap";
import { WEB_URL } from "../api";
import { localizedAddressLabel } from "../geocoding";
import { colors } from "../theme";
import {
  getRegionMapConfig,
  getDeliveryZone,
  isPointInDeliveryZone,
  type MapPoint,
  type YandexMapProps,
} from "./yandexMapShared";
import { MapCenterMarker } from "./MapCenterMarker";

const mapKitApiKey = process.env.EXPO_PUBLIC_YANDEX_MAPKIT_API_KEY?.trim() || "";
const deliveryMarkerImage = require("../../assets/delivery.png");

function PickupMapMarker() {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <View
      collapsable={false}
      style={[styles.pickupMarker, imageLoaded && styles.pickupMarkerLoaded]}
    >
      <View style={styles.pickupMarkerHead}>
        <Image
          onLoadEnd={() => setImageLoaded(true)}
          resizeMode="contain"
          source={deliveryMarkerImage}
          style={styles.pickupMarkerImage}
        />
      </View>
      <View style={styles.pickupMarkerStem} />
    </View>
  );
}

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

function addressFromDeviceGeocoder(place: Location.LocationGeocodedAddress, city: string) {
  const street = localizedAddressLabel(place.street || place.name || "", city);
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
const reverseGeocodeCache = new Map<string, MapPoint>();

function reverseGeocodeCacheKey(regionSlug: string, latitude: number, longitude: number) {
  return `${regionSlug}:${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function cacheReverseGeocode(key: string, point: MapPoint) {
  reverseGeocodeCache.delete(key);
  reverseGeocodeCache.set(key, point);
  if (reverseGeocodeCache.size > 64) {
    const oldestKey = reverseGeocodeCache.keys().next().value;
    if (oldestKey) reverseGeocodeCache.delete(oldestKey);
  }
}

function initializeMapKit() {
  if (Platform.OS === "ios") return Promise.resolve();
  if (!mapKitInitialization) {
    mapKitInitialization = Promise.race([
      YaMap.setLocale("ru_RU").then(() => YaMap.init(mapKitApiKey)),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error("Не удалось загрузить Yandex MapKit. Проверьте интернет и повторите.")), 12_000);
      }),
    ]).catch((error) => {
      mapKitInitialization = null;
      throw error;
    });
  }
  return mapKitInitialization;
}

export function preloadYandexMapKit() {
  if (!mapKitApiKey) return Promise.reject(new Error("Не задан ключ Yandex MapKit"));
  return initializeMapKit();
}

export function YandexMap({
  regionSlug,
  deliveryZone,
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState("");
  const region = getRegionMapConfig(regionSlug);
  const effectiveDeliveryZone = useMemo(
    () => getDeliveryZone(regionSlug, deliveryZone),
    [deliveryZone, regionSlug],
  );
  const deliveryZoneMapPoints = useMemo(() => effectiveDeliveryZone.map((point) => ({
    lat: point.latitude,
    lon: point.longitude,
  })), [effectiveDeliveryZone]);
  const deliveryZoneOutlinePoints = useMemo(() => (
    deliveryZoneMapPoints.length
      ? [...deliveryZoneMapPoints, deliveryZoneMapPoints[0]]
      : []
  ), [deliveryZoneMapPoints]);
  const hasInitialPoint = Number.isFinite(initialLatitude)
    && Number.isFinite(initialLongitude);
  const initialPoint = hasInitialPoint
    ? { latitude: initialLatitude as number, longitude: initialLongitude as number }
    : { latitude: region.center[0], longitude: region.center[1] };
  const focusMarkers = useCallback(() => {
    if (markers.length === 1) {
      mapRef.current?.setCenter(
        { lat: markers[0].latitude, lon: markers[0].longitude },
        16.5,
        0,
        0,
        0.32,
      );
      return;
    }
    if (markers.length > 1) {
      mapRef.current?.fitMarkers(markers.map((marker) => ({
        lat: marker.latitude,
        lon: marker.longitude,
      })));
    }
  }, [markers]);

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
    if (!ready || mapLoaded) return undefined;
    const timer = setTimeout(() => {
      setError("Карта загружается слишком долго. Проверьте интернет-соединение.");
    }, 15_000);
    return () => clearTimeout(timer);
  }, [mapLoaded, ready]);

  useEffect(() => {
    if (!ready || !markers.length) return;
    focusMarkers();
  }, [focusMarkers, markers.length, ready]);

  useEffect(() => {
    if (!showCenterMarker) setError("");
  }, [showCenterMarker]);

  const resolveAddress = useCallback(async (latitude: number, longitude: number) => {
    const insideDeliveryRegion = isPointInDeliveryZone(
      latitude,
      longitude,
      effectiveDeliveryZone,
    );
    if (!insideDeliveryRegion) {
      setError(`Доставка доступна только в городе ${region.city}.`);
    }

    const revision = ++geocodingRevision.current;
    geocodingController.current?.abort();
    const controller = new AbortController();
    geocodingController.current = controller;
    const cacheKey = reverseGeocodeCacheKey(regionSlug, latitude, longitude);
    const cachedPoint = reverseGeocodeCache.get(cacheKey);
    if (cachedPoint) {
      if (insideDeliveryRegion) setError("");
      onLocationChange(cachedPoint);
      return;
    }

    const nativeRequest = Search.searchPoint(
      { lat: latitude, lon: longitude },
      20,
      { geometry: true, searchTypes: 1 as never },
    ).then((place) => {
      const address = localizedAddressLabel(
        (place as unknown as { formatted?: string })?.formatted || "",
        region.city,
      );
      if (!address) return null;
      const complete = /(?:,|\s)\s*\d+[\dA-Za-zА-Яа-я/-]*\s*$/u.test(address);
      return {
        address,
        latitude,
        longitude,
        kind: complete ? "house" : "street",
        precision: complete ? "exact" : "street",
        isComplete: insideDeliveryRegion && complete,
      } satisfies MapPoint;
    }).catch(() => null);

    const serverRequest = (async (): Promise<MapPoint | null> => {
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        // Keep compatibility with the currently deployed geocoder, which
        // accepts reverse-geocoding coordinates through the text parameter.
        // The newer endpoint also accepts lat/lon and limits this to one item.
        text: `${longitude},${latitude}`,
        kind: "house",
      });
      if (insideDeliveryRegion) params.set("region", regionSlug);
      const response = await fetch(`${WEB_URL}/api/geocode?${params.toString()}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const result = await response.json() as GeocodingResponse;
      const suggestion = result.suggestions?.[0];
      const legacySuggestion = result.items?.[0];
      const address = localizedAddressLabel(
        suggestion?.label || legacySuggestion?.address || legacySuggestion?.name || "",
        region.city,
      );
      if (!response.ok || !address) return null;
      return {
        address,
        latitude,
        longitude,
        kind: suggestion?.kind || legacySuggestion?.kind || "",
        precision: suggestion?.precision || legacySuggestion?.precision || "",
        isComplete: insideDeliveryRegion && (
          suggestion?.isComplete === true
          || (legacySuggestion?.kind === "house" && legacySuggestion.precision === "exact")
        ),
      };
    })().catch(() => null);

    // Cold MapKit search and the HTTP geocoder now race instead of blocking one
    // another. A complete house wins immediately; otherwise keep the best
    // partial result after both sources have answered.
    const firstPoint = await Promise.race([nativeRequest, serverRequest]);
    if (revision !== geocodingRevision.current) return;
    if (firstPoint?.isComplete) {
      controller.abort();
      cacheReverseGeocode(cacheKey, firstPoint);
      if (insideDeliveryRegion) setError("");
      onLocationChange(firstPoint);
      return;
    }
    if (firstPoint) {
      // Show a street/district immediately while the other source keeps
      // resolving a precise house in the background.
      if (insideDeliveryRegion) setError("");
      onLocationChange(firstPoint);
    }

    const [nativePoint, serverPoint] = await Promise.all([nativeRequest, serverRequest]);
    if (revision !== geocodingRevision.current) return;
    const resolvedPoint = [serverPoint, nativePoint].find((point) => point?.isComplete)
      || serverPoint
      || nativePoint;
    if (resolvedPoint) {
      cacheReverseGeocode(cacheKey, resolvedPoint);
      if (insideDeliveryRegion) setError("");
      if (resolvedPoint.address !== firstPoint?.address
        || resolvedPoint.isComplete !== firstPoint?.isComplete) {
        onLocationChange(resolvedPoint);
      }
      return;
    }

    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const fallback = place ? addressFromDeviceGeocoder(place, region.city) : null;
      if (!fallback?.address || revision !== geocodingRevision.current) {
        throw new Error("Адрес не найден");
      }
      const point = {
        ...fallback,
        latitude,
        longitude,
        isComplete: insideDeliveryRegion && fallback.isComplete,
      };
      cacheReverseGeocode(cacheKey, point);
      if (insideDeliveryRegion) setError("");
      onLocationChange(point);
    } catch (reason) {
      if (controller.signal.aborted || revision !== geocodingRevision.current) return;
      setError(reason instanceof Error && reason.message === "Адрес не найден"
        ? "Не удалось определить адрес. Передвиньте метку ближе к дому."
        : "Сервис адресов временно недоступен. Попробуйте ещё раз.");
    }
  }, [effectiveDeliveryZone, onLocationChange, region.city, regionSlug]);

  useEffect(() => {
    if (!ready || !hasInitialPoint || markers.length) return;
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
    markers.length,
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
      scale={1}
      zIndex={20}
    >
      <PickupMapMarker />
    </Marker>
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
        initialRegion={{ lat: initialPoint.latitude, lon: initialPoint.longitude, zoom: hasInitialPoint ? 17 : 16 }}
        onCameraPositionChangeEnd={handleCameraPositionChangeEnd}
        onMapLoaded={() => {
          setMapLoaded(true);
          setError("");
          if (markers.length) {
            focusMarkers();
          } else if (showCenterMarker && hasInitialPoint) {
            void resolveAddress(initialPoint.latitude, initialPoint.longitude);
          }
        }}
        ref={mapRef}
        rotateGesturesEnabled={false}
        showUserPosition={false}
        style={styles.map}
        tiltGesturesEnabled={false}
      >
        {showCenterMarker ? (
          <Polyline
            points={deliveryZoneOutlinePoints}
            strokeColor="#FF5A1F"
            strokeWidth={0.1}
            outlineColor="#FF5A1F"
            outlineWidth={0}
            zIndex={11}
          />
        ) : null}
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
  pickupMarker: {
    width: 48,
    height: 65,
    alignItems: "center",
  },
  pickupMarkerLoaded: {
    height: 66,
  },
  pickupMarkerHead: {
    zIndex: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    elevation: 4,
  },
  pickupMarkerImage: {
    width: 31,
    height: 31,
  },
  pickupMarkerStem: {
    position: "absolute",
    top: 46,
    width: 3,
    height: 18,
    borderRadius: 3,
    backgroundColor: colors.orange,
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
