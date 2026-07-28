import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { colors, radii } from "../theme";
import { useStore } from "../store";

type Props = {
  onComplete: () => void;
};

const pages = [
  {
    colors: ["#FF5207", "#FF4B00"] as const,
    title: "Качественно\nи вкусно",
    copy: "Делаем выбор в пользу лучших продуктов, технологичных процессов и заботы о клиентах. В Бишкеке и Оше.",
    image: null,
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
    image: null,
    imageStyle: "heart" as const,
  },
];

export function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { setOnboarded, setNotificationsAsked } = useStore();
  const [page, setPage] = useState(0);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const current = pages[page];
  const buttonLabel = page === pages.length - 1 ? "Выбрать адрес доставки" : "Далее";
  const isNotificationPage = current.imageStyle === "bag";

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
          {current.imageStyle === "brand" ? (
            <View style={styles.brandTile}>
              <View style={styles.brandPattern}>
                <Text style={styles.brandPatternText}>ЛОСОСЬ</Text>
                <Text style={styles.brandPatternText}>ЛОСОСЬ</Text>
                <Text style={styles.brandPatternText}>ЛОСОСЬ</Text>
              </View>
            </View>
          ) : current.imageStyle === "heart" ? (
            <View style={styles.heartWrap}>
              <MaterialCommunityIcons name="heart" size={230} color="#FF9A21" />
              <View style={[styles.heartStripe, styles.heartStripeOne]} />
              <View style={[styles.heartStripe, styles.heartStripeTwo]} />
              <View style={[styles.heartStripe, styles.heartStripeThree]} />
            </View>
          ) : (
            <Image
              resizeMode="contain"
              source={current.image}
              style={current.imageStyle === "bag" ? styles.bagImage : styles.basketImage}
            />
          )}
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{current.title}</Text>
          {current.copy ? <Text style={styles.copy}>{current.copy}</Text> : null}
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
          {page === pages.length - 1 ? (
            <Pressable
              accessibilityRole="button"
              onPress={complete}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Войти</Text>
            </Pressable>
          ) : null}
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
    flex: 1.18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTile: {
    width: 230,
    height: 230,
    borderRadius: 62,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#FF7800",
  },
  brandPattern: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    opacity: 0.92,
    transform: [{ rotate: "-4deg" }, { scale: 1.25 }],
  },
  brandPatternText: {
    color: colors.white,
    fontSize: 48,
    lineHeight: 45,
    fontWeight: "900",
  },
  bagImage: {
    width: 285,
    height: 285,
  },
  basketImage: {
    width: 300,
    height: 300,
  },
  heartWrap: {
    width: 260,
    height: 245,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heartStripe: {
    position: "absolute",
    width: 170,
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.74)",
    transform: [{ rotate: "32deg" }],
  },
  heartStripeOne: {
    top: 84,
    left: 48,
  },
  heartStripeTwo: {
    top: 121,
    left: 41,
  },
  heartStripeThree: {
    top: 157,
    left: 52,
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
    backgroundColor: "rgba(255,255,255,0.82)",
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
