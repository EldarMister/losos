import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WEB_URL } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenBalance: () => void;
};

const links = [
  {
    label: "Поддержка",
    icon: "message-reply-text-outline",
    path: "/support",
  },
  {
    label: "О нас",
    icon: "information-outline",
    path: "/about",
  },
  {
    label: "Хочу в команду",
    icon: "account-star-outline",
    path: "/jobs",
  },
] as const;

export function MenuSheet({
  visible,
  onClose,
  onOpenProfile,
  onOpenOrders,
  onOpenAddresses,
  onOpenBalance,
}: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const version = Constants.expoConfig?.version || "1.0.0";

  const openPage = async (path: string) => {
    onClose();
    await Linking.openURL(`${WEB_URL}${path}`);
  };

  const openProfile = () => {
    onOpenProfile();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      visible={visible}
    >
      <StatusBar backgroundColor="#A8A8AA" style="light" translucent />
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View pointerEvents="none" style={[styles.statusBarFill, { height: insets.top }]} />
        <Pressable
          accessibilityLabel="Назад"
          hitSlop={4}
          onPress={onClose}
          style={styles.back}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.ink} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <MaterialCommunityIcons name="fish" size={29} color={colors.white} />
            </View>
            <Text style={styles.brandText}>Накта{"\n"}суши</Text>
          </View>

          {store.session ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={openProfile}
                style={({ pressed }) => [
                  styles.accountCard,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.accountAvatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={38}
                    color={colors.orange}
                  />
                </View>
                <View style={styles.accountCopy}>
                  <Text style={styles.accountHello}>Привет!</Text>
                  <Text style={styles.accountPhone}>{store.session.phone}</Text>
                </View>
              </Pressable>
              <MenuRow
                icon="shopping-outline"
                label="Мои заказы"
                onPress={onOpenOrders}
              />
              <MenuRow
                icon="map-marker-outline"
                label="Мои адреса"
                onPress={onOpenAddresses}
              />
              <MenuRow
                icon="star-four-points-outline"
                label="NAKTA Coin"
                onPress={onOpenBalance}
              />
              <MenuRow
                icon="cog-outline"
                label="Настройки"
                onPress={openProfile}
              />
            </>
          ) : (
            <MenuRow
              icon="account-circle-outline"
              label="Вход в личный кабинет"
              onPress={openProfile}
            />
          )}

          {links.map((item) => (
            <Pressable
              accessibilityRole="link"
              key={item.path}
              onPress={() => void openPage(item.path)}
              style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={28}
                color={colors.orange}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          accessibilityRole="link"
          onPress={() => void openPage("/legal")}
          style={({ pressed }) => [
            styles.legalButton,
            pressed && styles.rowPressed,
          ]}
        >
          <Text style={styles.legalText}>Правовая информация</Text>
        </Pressable>
        <Text style={styles.version}>Версия {version}</Text>
      </View>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.rowPressed]}
    >
      <MaterialCommunityIcons name={icon} size={28} color={colors.orange} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  statusBarFill: {
    position: "absolute",
    zIndex: 0,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#A8A8AA",
  },
  back: {
    width: 48,
    height: 48,
    marginTop: 16,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
    marginTop: 6,
  },
  content: {
    paddingBottom: 16,
  },
  brandRow: {
    minHeight: 48,
    marginTop: 8,
    marginBottom: 30,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  brandText: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  accountCard: {
    minHeight: 80,
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F2",
  },
  accountAvatar: {
    width: 64,
    height: 64,
    margin: 8,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.orangeSoft,
  },
  accountCopy: {
    flex: 1,
    marginLeft: 16,
    marginRight: 24,
  },
  accountHello: {
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  accountPhone: {
    marginTop: 3,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  menuRow: {
    minHeight: 56,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  menuLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "400",
  },
  legalButton: {
    minHeight: 56,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  legalText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
  },
  version: {
    marginBottom: 16,
    color: "#A8A8A8",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
});
