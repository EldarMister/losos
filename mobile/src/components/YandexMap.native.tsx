import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { mapsApi, type MapsConfig } from "../api";
import { colors } from "../theme";
import {
  createYandexMapHtml,
  parseMapMessage,
  type YandexMapProps,
} from "./yandexMapShared";

export function YandexMap({
  regionSlug,
  initialLatitude,
  initialLongitude,
  onLocationChange,
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

  const html = useMemo(() => (
    credentials
      ? createYandexMapHtml(credentials, regionSlug, initialLatitude, initialLongitude)
      : ""
  ), [credentials, initialLatitude, initialLongitude, regionSlug]);

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

  const receive = (event: WebViewMessageEvent) => {
    const point = parseMapMessage(event.nativeEvent.data);
    if (point) onLocationChange(point);
  };

  return (
    <WebView
      javaScriptEnabled
      domStorageEnabled
      onMessage={receive}
      originWhitelist={["*"]}
      setBuiltInZoomControls={false}
      source={{ html, baseUrl: "https://api-maps.yandex.ru" }}
      style={styles.webView}
    />
  );
}

const styles = StyleSheet.create({
  webView: {
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
});
