import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { WEB_URL } from "../api";
import { colors, shadow } from "../theme";

type Props = {
  onCancel: () => void;
  onError: (message: string) => void;
  onVerified: (token: string) => void;
  visible: boolean;
};

type CaptchaMessage =
  | { type: "success"; token: string }
  | { type: "error" }
  | { type: "expired" };

const CAPTCHA_URL = `${WEB_URL}/mobile-captcha`;

function parseMessage(value: string): CaptchaMessage | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return null;
    const type = (parsed as { type?: unknown }).type;
    if (type === "success") {
      const token = (parsed as { token?: unknown }).token;
      return typeof token === "string" && token.length > 0 ? { type, token } : null;
    }
    if (type === "error" || type === "expired") return { type };
    return null;
  } catch {
    return null;
  }
}

export function CaptchaVerification({ onCancel, onError, onVerified, visible }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [instanceKey, setInstanceKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setInstanceKey((current) => current + 1);
    }
  }, [visible]);

  const receiveMessage = (event: WebViewMessageEvent) => {
    const message = parseMessage(event.nativeEvent.data);
    if (!message) return;
    if (message.type === "success") {
      onVerified(message.token);
      return;
    }
    onError(
      message.type === "expired"
        ? "Проверка истекла. Пройдите её ещё раз."
        : "Не удалось пройти проверку. Попробуйте ещё раз.",
    );
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Проверка безопасности</Text>
              <Text style={styles.subtitle}>Подтвердите, что запрос отправляет человек</Text>
            </View>
            <Pressable
              accessibilityLabel="Отменить проверку"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onCancel}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="close" size={25} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.webViewShell}>
            <WebView
              accessibilityLabel="Проверка, что вы человек"
              allowsInlineMediaPlayback
              domStorageEnabled
              javaScriptEnabled
              key={instanceKey}
              mixedContentMode="never"
              onError={() => onError("Не удалось загрузить проверку. Проверьте интернет и попробуйте ещё раз.")}
              onHttpError={() => onError("Сервис проверки временно недоступен. Попробуйте ещё раз.")}
              onLoadEnd={() => setLoading(false)}
              onMessage={receiveMessage}
              originWhitelist={["https://*", "about:blank", "about:srcdoc"]}
              setSupportMultipleWindows={false}
              sharedCookiesEnabled
              source={{ uri: CAPTCHA_URL }}
              style={styles.webView}
              thirdPartyCookiesEnabled
            />
            {loading ? (
              <View pointerEvents="none" style={styles.loader}>
                <ActivityIndicator color="#FF5706" />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  card: {
    width: "100%",
    maxWidth: 390,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.white,
    ...shadow,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  close: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.55 },
  webViewShell: {
    height: 128,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
