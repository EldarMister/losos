import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { NotificationPermissionPrompt } from "../components/NotificationPermissionPrompt";
import { colors, radii } from "../theme";
import { useStore } from "../store";

type Props = {
  onComplete: () => void;
  onLogin: () => void;
};

const pages = [
  {
    colors: ["#FF5207", "#FF4B00"] as const,
    title: "Качественно\nи вкусно",
    copy: "Делаем выбор в пользу лучших продуктов, технологичных процессов и заботы о клиентах. В Бишкеке и Оше.",
    image: require("../../assets/app-icon.jpeg"),
    imageStyle: "brand" as const,
  },
  {
    colors: ["#FF6D0A", "#FF4C00"] as const,
    title: "Много вкусного\nв одном месте",
    copy: "Собрали роллы, поке, супы и горячие блюда. Готовим после оформления заказа.",
    image: require("../../assets/pickup.png"),
    imageStyle: "basket" as const,
  },
  {
    colors: ["#D59AF5", "#C47BEF"] as const,
    title: "Пришлём пуш\nо статусе заказа",
    copy: "Сами доставляем заказы и следим за скоростью. Покажем статус заказа в режиме реального времени.",
    image: require("../../assets/delivery.png"),
    imageStyle: "bag" as const,
  },
  {
    colors: ["#FF5907", "#FF4B00"] as const,
    title: "Приятного вам аппетита!",
    copy: "",
    image: require("../../assets/heart.png"),
    imageStyle: "heart" as const,
  },
];

export function OnboardingScreen({ onComplete, onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const { setOnboarded, setNotificationsAsked } = useStore();
  const [page, setPage] = useState(0);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [permissionPromptVisible, setPermissionPromptVisible] = useState(false);
  const pageIndex = Math.min(Math.max(page, 0), pages.length - 1);
  const current = pages[pageIndex];
  const buttonLabel = pageIndex === pages.length - 1 ? "Выбрать адрес доставки" : "Далее";
  const isNotificationPage = current.imageStyle === "bag";

  const complete = () => {
    setOnboarded(true);
    onComplete();
  };

  const next = () => {
    if (pageIndex < pages.length - 1) setPage((value) => Math.min(value + 1, pages.length - 1));
    else complete();
  };

  const allowNotifications = async () => {
    setRequestingPermission(true);
    setNotificationsAsked(true);
    try {
      if (Platform.OS !== "web") {
        const Notifications = await import("expo-notifications");
        await Notifications.requestPermissionsAsync();
      }
    } finally {
      setRequestingPermission(false);
      setPermissionPromptVisible(false);
      next();
    }
  };

  const denyNotifications = () => {
    if (requestingPermission) return;
    setNotificationsAsked(true);
    setPermissionPromptVisible(false);
    next();
  };

  return (
    <LinearGradient colors={current.colors} style={styles.root}>
      <StatusBar style="light" />
      <View
        style={[
          styles.safe,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 18),
          },
        ]}
      >
        <View style={styles.progressRow}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[styles.progress, index <= pageIndex && styles.progressActive]}
            />
          ))}
        </View>

        <View style={[styles.visual, current.imageStyle === "heart" && styles.heartVisual]}>
          {current.imageStyle === "brand" ? (
            <Image resizeMode="cover" source={current.image} style={styles.brandTile} />
          ) : current.imageStyle === "heart" ? (
            <Image resizeMode="contain" source={current.image} style={styles.heartImage} />
          ) : (
            <Image
              resizeMode="contain"
              source={current.image}
              style={current.imageStyle === "bag" ? styles.bagImage : styles.basketImage}
            />
          )}
        </View>

        {current.imageStyle !== "heart" ? (
          <View style={styles.copyBlock}>
            <Text style={styles.title}>{current.title}</Text>
            {current.copy ? <Text style={styles.copy}>{current.copy}</Text> : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {isNotificationPage ? (
            <PrimaryButton
              label="Включить пуш-уведомления"
              labelStyle={styles.onboardingButtonLabel}
              onPress={() => setPermissionPromptVisible(true)}
              style={styles.translucentButton}
              tone="white"
            />
          ) : null}
          <PrimaryButton
            label={buttonLabel}
            labelStyle={styles.onboardingButtonLabel}
            onPress={next}
            style={styles.translucentButton}
            tone="white"
          />
          {pageIndex === pages.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOnboarded(true);
                onLogin();
              }}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Войти</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <NotificationPermissionPrompt
        busy={requestingPermission}
        onAllow={() => void allowNotifications()}
        onDeny={denyNotifications}
        visible={permissionPromptVisible}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
  },
  progressRow: {
    flexDirection: "row",
    gap: 7,
  },
  progress: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressActive: {
    backgroundColor: colors.white,
  },
  visual: {
    flex: 1.18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTile: {
    width: 176,
    height: 176,
    borderRadius: 49,
  },
  bagImage: {
    width: 230,
    height: 230,
  },
  basketImage: {
    width: 300,
    height: 300,
  },
  heartVisual: {
    flex: 1,
    marginHorizontal: -8,
  },
  heartImage: {
    width: "100%",
    maxWidth: 380,
    aspectRatio: 1,
  },
  copyBlock: {
    minHeight: 188,
  },
  title: {
    color: colors.white,
    fontSize: 34,
    lineHeight: 37,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  copy: {
    maxWidth: 350,
    marginTop: 16,
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
  },
  translucentButton: {
    borderRadius: radii.large,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  onboardingButtonLabel: {
    color: colors.white,
  },
  loginButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
