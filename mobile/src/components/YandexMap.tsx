import { createElement, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { mapsApi, type MapsConfig } from "../api";
import { colors } from "../theme";
import {
  createYandexMapHtml,
  parseMapMessage,
  type YandexMapProps,
} from "./yandexMapShared";
import { MapCenterMarker } from "./MapCenterMarker";

export function YandexMap({
  regionSlug,
  initialLatitude,
  initialLongitude,
  focusRequest = 0,
  onLocationChange,
  showCenterMarker = true,
}: YandexMapProps) {
  const [credentials, setCredentials] = useState<MapsConfig | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    mapsApi.config()
      .then((value) => {
        if (active) setCredentials(value);
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Карта временно недоступна");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const point = parseMapMessage(event.data);
      if (point) onLocationChange(point);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onLocationChange]);

  const html = useMemo(() => (
    credentials
      ? createYandexMapHtml(
          credentials,
          regionSlug,
          initialLatitude,
          initialLongitude,
        )
      : ""
  ), [credentials, focusRequest, initialLatitude, initialLongitude, regionSlug]);

  if (error) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>{error}</Text>
      </View>
    );
  }
  if (!credentials) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={colors.orange} />
        <Text style={styles.stateText}>Загружаем Яндекс Карту…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {createElement("iframe", {
        allow: "geolocation",
        "aria-label": "Яндекс Карта выбора адреса",
        srcDoc: html,
        style: {
          width: "100%",
          height: "100%",
          display: "block",
          border: 0,
          background: "#ecebe7",
        },
        title: "Яндекс Карта выбора адреса",
      })}
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
});
