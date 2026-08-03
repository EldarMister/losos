import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "../components/PrimaryButton";
import { RipplePressable } from "../components/RipplePressable";
import { requestOrderNotificationPermission } from "../pushNotifications";
import { useStore } from "../store";

type Props = {
  onComplete: () => void;
  onLogin: () => void;
};

type Page = {
  assetLabel: string;
  backgroundColor: string;
  copy: string;
  image: number;
  imageStyle: "basket" | "brand" | "bag" | "heart";
  title: string;
};

const PROGRESS_SEGMENTS = 4;

const pages: Page[] = [
  {
    assetLabel: "Пакет с блюдами Накта суши",
    backgroundColor: "#FF5A00",
    title: "Много вкусного\nв одном месте",
    copy: "Собрали роллы, поке, супы и горячие блюда. Готовим после оформления заказа.",
    image: require("../../assets/pickup.png"),
    imageStyle: "basket",
  },
  {
    assetLabel: "Иконка приложения NAKTASUSHI",
    backgroundColor: "#FF5A00",
    title: "Качественно\nи вкусно",
    copy: "Делаем выбор в пользу лучших продуктов, технологичных процессов и заботы о клиентах. В Бишкеке и Оше.",
    image: require("../../assets/app-icon.png"),
    imageStyle: "brand",
  },
  {
    assetLabel: "Термосумка Накта суши",
    backgroundColor: "#C894F2",
    title: "Пришлём пуш\nо статусе заказа",
    copy: "Сами доставляем заказы и следим за скоростью. Покажем статус заказа в режиме реального времени.",
    image: require("../../assets/delivery.png"),
    imageStyle: "bag",
  },
  {
    assetLabel: "Сердце из лосося",
    backgroundColor: "#FF5A00",
    title: "Приятного вам аппетита!",
    copy: "",
    image: require("../../assets/heart.png"),
    imageStyle: "heart",
  },
];

function clampAssetWidth(
  windowWidth: number,
  horizontalPadding: number,
  ratio: number,
  minimum: number,
  maximum: number,
) {
  const desired = Math.min(maximum, Math.max(minimum, windowWidth * ratio));
  return Math.min(desired, windowWidth - horizontalPadding * 2);
}

export function OnboardingScreen({ onComplete, onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { setOnboarded, setNotificationsAsked } = useStore();
  const [page, setPage] = useState(0);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const pageIndex = Math.min(Math.max(page, 0), pages.length - 1);
  const current = pages[pageIndex];
  const compact = height < 820 || width <= 360;
  const horizontalPadding = compact ? 24 : 28;
  const assetWidth = current.imageStyle === "brand"
    ? clampAssetWidth(width, horizontalPadding, 0.56, 205, 225)
    : current.imageStyle === "bag"
      ? clampAssetWidth(width, horizontalPadding, 0.62, 230, 255)
      : current.imageStyle === "heart"
        ? clampAssetWidth(width, horizontalPadding, 0.9, 300, 380)
      : clampAssetWidth(width, horizontalPadding, 0.74, 285, 300);
  const assetHeight = current.imageStyle === "bag" ? assetWidth * 1.053 : assetWidth;
  const isNotificationPage = current.imageStyle === "bag";
  const isFinalPage = current.imageStyle === "heart";

  const complete = () => {
    setOnboarded(true);
    onComplete();
  };

  const next = () => {
    if (pageIndex < pages.length - 1) {
      setPage((value) => Math.min(value + 1, pages.length - 1));
      return;
    }
    complete();
  };

  const allowNotifications = async () => {
    if (requestingPermission) return;
    setRequestingPermission(true);
    try {
      const permission = await requestOrderNotificationPermission();
      if (permission.granted) next();
    } finally {
      setNotificationsAsked(true);
      setRequestingPermission(false);
    }
  };

  return (
    <View
      testID={`onboarding-page-${pageIndex + 1}`}
      style={[styles.root, { backgroundColor: current.backgroundColor }]}
    >
      <StatusBar
        backgroundColor={current.backgroundColor}
        style="light"
        translucent
      />
      <View
        style={[
          styles.safe,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + (compact ? 18 : 22),
            paddingBottom: Math.max(insets.bottom + 18, 22),
          },
        ]}
      >
        <View style={styles.progressRow}>
          {Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
            <View
              key={index}
              testID={`onboarding-progress-${index + 1}`}
              style={[
                styles.progress,
                index <= pageIndex && styles.progressActive,
              ]}
            />
          ))}
        </View>

        <View style={[
          styles.visual,
          compact && styles.visualCompact,
          isNotificationPage && styles.notificationVisual,
          isFinalPage && styles.finalVisual,
        ]}>
          <Image
            accessibilityLabel={current.assetLabel}
            resizeMode="contain"
            source={current.image}
            style={{ width: assetWidth, height: assetHeight }}
          />
        </View>

        {!isFinalPage ? <View style={styles.copyBlock}>
          <Text style={[
            styles.title,
            compact && styles.titleCompact,
            isNotificationPage && styles.notificationTitle,
            isNotificationPage && compact && styles.notificationTitleCompact,
          ]}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={2}
          >
            {current.title}
          </Text>
          <Text style={[
            styles.copy,
            compact && styles.copyCompact,
            isNotificationPage && styles.notificationCopy,
            isNotificationPage && compact && styles.notificationCopyCompact,
          ]}>
            {current.copy}
          </Text>
        </View> : null}

        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {isNotificationPage ? (
            <PrimaryButton
              label="Включить пуш-уведомления"
              labelStyle={[styles.buttonLabel, compact && styles.buttonLabelCompact]}
              loading={requestingPermission}
              onPress={() => void allowNotifications()}
              style={[
                styles.actionButton,
                styles.notificationButton,
                compact && styles.actionButtonCompact,
                styles.notificationActionButton,
              ]}
              tone="white"
            />
          ) : null}
          <PrimaryButton
            label={isFinalPage ? "Выбрать адрес доставки" : "Далее"}
            labelStyle={[styles.buttonLabel, compact && styles.buttonLabelCompact]}
            onPress={next}
            style={[
              styles.actionButton,
              isNotificationPage ? styles.purpleButton : styles.orangeButton,
              compact && styles.actionButtonCompact,
              isNotificationPage && styles.notificationActionButton,
            ]}
            tone="white"
          />
          {isFinalPage ? (
            <RipplePressable
              accessibilityLabel="Войти"
              accessibilityRole="button"
              onPress={() => {
                setOnboarded(true);
                onLogin();
              }}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Войти</Text>
            </RipplePressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  progressRow: {
    height: 6,
    flexDirection: "row",
    gap: 8,
  },
  progress: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  progressActive: {
    backgroundColor: "#FFFFFF",
  },
  visual: {
    flex: 1,
    minHeight: 250,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  visualCompact: {
    minHeight: 224,
    paddingTop: 16,
    paddingBottom: 14,
  },
  notificationVisual: {
    minHeight: 214,
    paddingTop: 22,
    paddingBottom: 18,
  },
  finalVisual: {
    minHeight: 320,
    marginHorizontal: -12,
    paddingTop: 18,
    paddingBottom: 8,
  },
  copyBlock: {
    width: "100%",
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter_800ExtraBold",
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.55,
  },
  titleCompact: {
    fontSize: 34,
    lineHeight: 38,
  },
  notificationTitle: {
    fontSize: 34,
    lineHeight: 38,
  },
  notificationTitleCompact: {
    fontSize: 32,
    lineHeight: 36,
  },
  copy: {
    maxWidth: 350,
    marginTop: 22,
    color: "rgba(255,255,255,0.92)",
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 23,
  },
  copyCompact: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 22,
  },
  notificationCopy: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
  },
  notificationCopyCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  actions: {
    marginTop: 24,
    gap: 15,
  },
  actionsCompact: {
    marginTop: 18,
    gap: 14,
  },
  actionButton: {
    height: 68,
    minHeight: 68,
    borderRadius: 26,
  },
  actionButtonCompact: {
    height: 64,
    minHeight: 64,
  },
  notificationActionButton: {
    height: 60,
    minHeight: 60,
  },
  orangeButton: {
    backgroundColor: "rgba(255,196,160,0.55)",
  },
  notificationButton: {
    backgroundColor: "rgba(232,204,255,0.52)",
  },
  purpleButton: {
    backgroundColor: "#B96BF2",
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    lineHeight: 24,
  },
  buttonLabelCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  loginButton: {
    minHeight: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  loginText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
});
