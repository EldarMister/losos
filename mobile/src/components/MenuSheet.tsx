import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi, WEB_URL } from "../api";
import { useStore } from "../store";
import { supportUrl } from "../support";
import { colors } from "../theme";
import { useDrawerDismiss } from "./DrawerGesture";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenBalance: () => void;
  onLogout: () => void;
};

const links = [
  { label: "Поддержка", icon: "message-reply-text-outline", path: "/support" },
  { label: "О нас", icon: "information-outline", path: "/about" },
] as const;

export function MenuSheet({
  visible,
  onClose,
  onOpenProfile,
  onOpenOrders,
  onOpenAddresses,
  onOpenBalance,
  onLogout,
}: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const version = Constants.expoConfig?.version || "1.0.0";
  const [naktaCoins, setNaktaCoins] = useState(0);
  const [mounted, setMounted] = useState(visible);
  const openOffset = useSharedValue(visible ? 0 : -360);
  const backdropProgress = useSharedValue(visible ? 1 : 0);
  const handleSwipeDismiss = useCallback(() => onClose(), [onClose]);
  const drawerGesture = useDrawerDismiss({ onDismiss: handleSwipeDismiss });

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    drawerGesture.reset();
    openOffset.value = -360;
    backdropProgress.value = 0;
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        openOffset.value = withTiming(0, {
          duration: 360,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
        backdropProgress.value = withTiming(1, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
    };
  }, [backdropProgress, drawerGesture.reset, openOffset, visible]);

  useEffect(() => {
    if (!mounted || visible) return;
    openOffset.value = withTiming(
      -Math.max(drawerGesture.drawerWidth.value, 360),
      { duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) runOnJS(setMounted)(false);
      },
    );
    backdropProgress.value = withTiming(0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [backdropProgress, drawerGesture.drawerWidth, mounted, openOffset, visible]);

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: openOffset.value + drawerGesture.translationX.value,
    }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const dragProgress = Math.min(
      1,
      Math.abs(drawerGesture.translationX.value)
        / Math.max(drawerGesture.drawerWidth.value, 1),
    );
    return { opacity: backdropProgress.value * (1 - dragProgress) };
  });

  useEffect(() => {
    if (!visible || !store.session) {
      if (!store.session) setNaktaCoins(0);
      return undefined;
    }
    let cancelled = false;
    authApi.profile(store.session)
      .then((profile) => {
        if (!cancelled) setNaktaCoins(profile.naktaCoins);
      })
      .catch(() => {
        if (!cancelled) setNaktaCoins(0);
      });
    return () => {
      cancelled = true;
    };
  }, [store.session, visible]);

  const openPage = async (path: string) => {
    onClose();
    await Linking.openURL(path === "/support" ? supportUrl(store.activeRegion) : `${WEB_URL}${path}`);
  };

  if (!mounted) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={mounted}
    >
      <StatusBar backgroundColor={colors.white} style="dark" translucent />
      <GestureHandlerRootView style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, backdropAnimatedStyle]}
        />
        <Pressable
          accessibilityLabel="Закрыть меню"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <GestureDetector gesture={drawerGesture.gesture}>
          <Animated.View
            collapsable={false}
            onLayout={(event) => drawerGesture.onLayout(event.nativeEvent.layout.width)}
            style={[
              styles.drawer,
              {
                paddingTop: insets.top,
                paddingBottom: Math.max(insets.bottom, 14),
              },
              drawerAnimatedStyle,
            ]}
          >
          <Pressable
            accessibilityLabel="Назад"
            hitSlop={4}
            onPress={onClose}
            style={styles.back}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {store.session ? (
              <>
                <View style={styles.accountCard}>
                  <View style={styles.accountCopy}>
                    <Text style={styles.accountHello}>Привет!</Text>
                    <Text style={styles.accountPhone}>{store.session.phone}</Text>
                  </View>
                  <Pressable
                    accessibilityLabel="Выйти из аккаунта"
                    onPress={onLogout}
                    style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.logoutText}>Выйти</Text>
                    <MaterialCommunityIcons name="logout" size={15} color={colors.orange} />
                  </Pressable>
                </View>
                <MenuRow icon="shopping-outline" label="Мои заказы" onPress={onOpenOrders} />
                <MenuRow icon="map-marker-outline" label="Мои адреса" onPress={onOpenAddresses} />
                <MenuRow
                  icon="star-four-points-outline"
                  label="NAKTA Coin"
                  onPress={onOpenBalance}
                  trailing={new Intl.NumberFormat("ru-RU").format(naktaCoins)}
                />
                <MenuRow icon="cog-outline" label="Настройки" onPress={onOpenProfile} />
              </>
            ) : (
              <MenuRow
                icon="account-circle-outline"
                label="Вход в личный кабинет"
                onPress={onOpenProfile}
              />
            )}

            {links.map((item) => (
              <MenuRow
                icon={item.icon}
                key={item.path}
                label={item.label}
                onPress={() => void openPage(item.path)}
              />
            ))}
          </ScrollView>

          <Image
            accessibilityLabel="Накта суши"
            resizeMode="contain"
            source={require("../../assets/logo.png")}
            style={styles.brandLogo}
          />
          <Pressable
            accessibilityRole="link"
            onPress={() => void openPage("/legal")}
            style={({ pressed }) => [styles.legalButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.legalText}>Правовая информация</Text>
          </Pressable>
          <Text style={styles.version}>Версия {version}</Text>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  trailing,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
  trailing?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
    >
      <MaterialCommunityIcons name={icon} size={21} color={colors.orange} />
      <Text style={styles.menuLabel}>{label}</Text>
      {trailing ? <Text style={styles.rowValue}>{trailing}</Text> : null}
      <MaterialCommunityIcons name="chevron-right" size={20} color="#A0A0A0" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 17, 17, 0.18)",
  },
  drawer: {
    width: "80%",
    maxWidth: 360,
    flex: 1,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: colors.white,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 12,
  },
  back: {
    width: 48,
    height: 44,
    marginTop: 4,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    marginTop: 2,
  },
  content: {
    paddingTop: 2,
    paddingBottom: 12,
  },
  brandLogo: {
    width: 106,
    height: 64,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 2,
  },
  accountCard: {
    minHeight: 66,
    marginHorizontal: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F2",
  },
  accountCopy: {
    flex: 1,
    marginRight: 8,
  },
  accountHello: {
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  accountPhone: {
    marginTop: 3,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    lineHeight: 18,
  },
  logoutButton: {
    minWidth: 74,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.white,
  },
  logoutText: {
    color: colors.orange,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  menuRow: {
    minHeight: 44,
    paddingVertical: 9,
    paddingLeft: 18,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  menuLabel: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  rowValue: {
    color: "#555555",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  legalButton: {
    minHeight: 42,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  legalText: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  version: {
    marginBottom: 3,
    color: "#A8A8A8",
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
  },
});
