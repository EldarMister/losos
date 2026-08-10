import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
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
import { WebView } from "react-native-webview";
import { colors } from "../theme";

type Props = {
  onClose: () => void;
  title: string;
  url: string;
  visible: boolean;
};

const CLEAN_LEGAL_PAGE_SCRIPT = `
  (function () {
    var style = document.createElement('style');
    style.setAttribute('data-nakta-mobile-legal', 'true');
    style.textContent = \`
      :root { color-scheme: light !important; background: #ffffff !important; }
      html, body {
        width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        background: #ffffff !important;
        color: #191919 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      .info-page {
        min-height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .info-page-shell { width: 100% !important; margin: 0 !important; }
      .info-page-header,
      .info-page-logo,
      .info-page-back,
      .info-page-card > h1 { display: none !important; }
      .info-page-card {
        margin: 0 !important;
        padding: 18px 20px 44px !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        box-shadow: none !important;
      }
      .info-page-card h2 {
        margin: 25px 0 8px !important;
        color: #191919 !important;
        font-size: 15px !important;
        line-height: 21px !important;
        font-weight: 700 !important;
        letter-spacing: 0 !important;
      }
      .info-page-card p,
      .info-page-card li {
        margin-top: 0 !important;
        color: #444444 !important;
        font-size: 14px !important;
        line-height: 1.55 !important;
        font-weight: 400 !important;
      }
      .info-page-card p { margin-bottom: 13px !important; }
      .info-page-card ul,
      .info-page-card ol {
        margin: 8px 0 15px !important;
        padding-left: 20px !important;
      }
      .info-page-card li { margin-bottom: 5px !important; padding-left: 2px !important; }
      .info-page-card strong { color: #191919 !important; font-weight: 650 !important; }
      .info-page-card a {
        color: #191919 !important;
        text-decoration-color: #9a9a9a !important;
        text-decoration-thickness: 1px !important;
        text-underline-offset: 2px !important;
      }
      .info-page-card .legal-updated {
        margin: 0 0 19px !important;
        color: #8a8a8a !important;
        font-size: 12px !important;
        line-height: 17px !important;
      }
      .legal-document-list {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
      }
      .legal-document-list li {
        margin: 0 !important;
        padding: 16px 0 !important;
        border: 0 !important;
        border-bottom: 1px solid #eeeeee !important;
        border-radius: 0 !important;
        background: #ffffff !important;
      }
      .legal-document-list a { font-size: 15px !important; }
      .info-page-action {
        margin-top: 16px !important;
        padding: 0 !important;
        background: transparent !important;
        color: #191919 !important;
      }
    \`;
    (document.head || document.documentElement).appendChild(style);
  })();
  true;
`;

const LEGAL_PAGE_TITLES: Record<string, string> = {
  "/privacy": "Политика конфиденциальности",
  "/terms": "Условия использования",
  "/account-deletion": "Удаление аккаунта и данных",
};

function getPathname(value: string) {
  return `/${value.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() ?? ""}`;
}

export function InAppWebPage({ onClose, title, url, visible }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [currentTitle, setCurrentTitle] = useState(title);
  const initialPathname = getPathname(url);

  useEffect(() => {
    setCurrentTitle(title);
  }, [title, url, visible]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <StatusBar backgroundColor={colors.white} style="dark" />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Закрыть документ"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={25} color={colors.ink} />
          </Pressable>
          <Text numberOfLines={2} style={styles.title}>{currentTitle}</Text>
        </View>
        <WebView
          accessibilityLabel={title}
          injectedJavaScript={CLEAN_LEGAL_PAGE_SCRIPT}
          injectedJavaScriptBeforeContentLoaded={CLEAN_LEGAL_PAGE_SCRIPT}
          onLoadEnd={() => setLoading(false)}
          onLoadStart={() => setLoading(true)}
          onNavigationStateChange={({ url: nextUrl }) => {
            const nextPathname = getPathname(nextUrl);
            setCurrentTitle(
              nextPathname === initialPathname
                ? title
                : LEGAL_PAGE_TITLES[nextPathname] ?? title,
            );
          }}
          source={{ uri: url }}
          style={styles.webView}
        />
        {loading ? (
          <View pointerEvents="none" style={styles.loader}>
            <ActivityIndicator color="#FF5706" size="large" />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    minHeight: 62,
    paddingLeft: 8,
    paddingRight: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.55 },
  title: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "left",
  },
  webView: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    top: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
