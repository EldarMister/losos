import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { colors, radii } from "../theme";
import { useStore } from "../store";

type Props = {
  onComplete: () => void;
};

const pages = [
  {
    colors: ["#FF5B06", "#FF3F00"] as const,
    title: "Качественно\nи вкусно",
    copy: "Выбираем лучшие продукты и готовим только после вашего заказа.",
    image: require("../../assets/smile.webp"),
    imageStyle: "smile" as const,
  },
  {
    colors: ["#D698FF", "#B968F1"] as const,
    title: "Заказ всегда\nпод контролем",
    copy: "Покажем статус заказа и вовремя сообщим, когда курьер уже рядом.",
    image: require("../../assets/delivery.png"),
    imageStyle: "bag" as const,
  },
  {
    colors: ["#FFC86D", "#FF8A24"] as const,
    title: "Доставка\nили самовывоз",
    copy: "Выберите удобный вариант, адрес и сразу переходите к каталогу.",
    image: require("../../assets/pickup.png"),
    imageStyle: "pickup" as const,
  },
];

export function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { setOnboarded, setNotificationsAsked } = useStore();
  const [page, setPage] = useState(0);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const current = pages[page];
  const buttonLabel = page === pages.length - 1 ? "Выбрать адрес" : "Далее";
  const isNotificationPage = page === 1;

  const imageStyle = useMemo(() => {
    if (current.imageStyle === "smile") return styles.smileImage;
    if (current.imageStyle === "bag") return styles.bagImage;
    return styles.pickupImage;
  }, [current.imageStyle]);

  const complete = () => {
    setOnboarded(true);
    onComplete();
  };

  const next = () => {
    if (page < pages.length - 1) setPage((value) => value + 1);
    else complete();
  };

  const requestNotifications = async () => {
    setRequestingPermission(true);
    setNotificationsAsked(true);
    try {
      if (Platform.OS !== "web") {
        const Notifications = await import("expo-notifications");
        await Notifications.requestPermissionsAsync();
      }
    } finally {
      setRequestingPermission(false);
      next();
    }
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
              style={[styles.progress, index <= page && styles.progressActive]}
            />
          ))}
        </View>

        <View style={styles.visual}>
          <View style={styles.visualGlow} />
          {page === 0 ? (
            <View style={styles.brandTile}>
              <View style={styles.brandPattern}>
                <Text style={styles.brandPatternText}>много</Text>
                <Text style={styles.brandPatternText}>лосося</Text>
              </View>
              <Image resizeMode="contain" source={current.image} style={imageStyle} />
            </View>
          ) : (
            <Image resizeMode="contain" source={current.image} style={imageStyle} />
          )}
          {isNotificationPage ? (
            <View style={styles.notificationBadge}>
              <MaterialCommunityIcons name="bell" size={20} color={colors.orange} />
            </View>
          ) : null}
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.copy}>{current.copy}</Text>
        </View>

        <View style={styles.actions}>
          {isNotificationPage ? (
            <PrimaryButton
              label="Включить уведомления"
              loading={requestingPermission}
              onPress={requestNotifications}
              style={styles.translucentButton}
              tone="white"
            />
          ) : null}
          <PrimaryButton
            label={buttonLabel}
            onPress={next}
            style={styles.translucentButton}
            tone="white"
          />
        </View>
      </View>
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
    flex: 1.12,
    alignItems: "center",
    justifyContent: "center",
  },
  visualGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  brandTile: {
    width: 180,
    height: 180,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FF6D00",
    transform: [{ rotate: "-4deg" }],
  },
  brandPattern: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "space-around",
    opacity: 0.92,
    transform: [{ rotate: "15deg" }, { scale: 1.25 }],
  },
  brandPatternText: {
    color: colors.white,
    fontSize: 47,
    lineHeight: 52,
    fontWeight: "900",
  },
  smileImage: {
    width: 90,
    height: 90,
  },
  bagImage: {
    width: 240,
    height: 240,
  },
  pickupImage: {
    width: 250,
    height: 250,
  },
  notificationBadge: {
    position: "absolute",
    right: "22%",
    top: "26%",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  copyBlock: {
    minHeight: 170,
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
    backgroundColor: "rgba(255,255,255,0.82)",
  },
});
