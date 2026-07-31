import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi, WEB_URL } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";

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
    await Linking.openURL(`${WEB_URL}${path}`);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <StatusBar backgroundColor={colors.white} style="dark" translucent />
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Закрыть меню"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 14),
            },
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
                  <View style={styles.accountAvatar}>
                    <MaterialCommunityIcons name="account" size={27} color={colors.orange} />
                  </View>
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
            source={require("../../assets/логотип.png")}
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
        </View>
      </View>
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
    paddingRight: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F2",
  },
  accountAvatar: {
    width: 48,
    height: 48,
    margin: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  accountCopy: {
    flex: 1,
    marginLeft: 3,
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
