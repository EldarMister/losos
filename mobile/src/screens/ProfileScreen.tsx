import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../api";
import { useStore } from "../store";
import { colors } from "../theme";
import type { ProfileData, ProfileOrder } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

const statuses: Record<ProfileOrder["status"], string> = {
  new: "Принят",
  confirmed: "Подтверждён",
  preparing: "Готовим",
  ready: "Готов",
  delivering: "В пути",
  completed: "Выполнен",
  cancelled: "Отменён",
};

type Section = "orders" | "balance" | "settings";

type Props = {
  section: Section;
  onBack: () => void;
  onOpenOrder: (orderId: string) => void;
  onLogout: () => void;
};

function OrderCard({
  order,
  onPress,
}: {
  order: ProfileOrder;
  onPress: () => void;
}) {
  const completed = order.status === "completed";
  const cancelled = order.status === "cancelled";
  const previewIcons = ["fish", "rice", "food-fork-drink"] as const;

  return (
    <View style={styles.orderWrap}>
      <Pressable
        accessibilityLabel={`Заказ №${order.id.slice(0, 6).toUpperCase()}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.orderCard,
          pressed && styles.orderPressed,
        ]}
      >
        <Text style={styles.orderTitle}>
          Заказ №{order.id.slice(0, 6).toUpperCase()}
        </Text>
        <Text numberOfLines={1} style={styles.orderSubtitle}>
          {new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(order.createdAt))}
          {" · "}
          {order.deliveryType === "pickup" ? "самовывоз" : "доставка"}
        </Text>
        <View style={styles.orderPreview}>
          {previewIcons.map((icon) => (
            <View key={icon} style={styles.previewIcon}>
              <MaterialCommunityIcons
                name={icon}
                size={22}
                color={colors.orange}
              />
            </View>
          ))}
          <Text style={styles.orderTotal}>{money(order.total)}</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#999999"
          />
        </View>
      </Pressable>
      <View
        style={[
          styles.statusPill,
          completed && styles.statusCompleted,
          cancelled && styles.statusCancelled,
        ]}
      >
        <Text style={styles.statusText}>{statuses[order.status]}</Text>
      </View>
    </View>
  );
}

function BackHeader({
  onBack,
  top,
  backgroundColor,
}: {
  onBack: () => void;
  top: number;
  backgroundColor: string;
}) {
  return (
    <View style={{ paddingTop: top, backgroundColor }}>
      <Pressable
        accessibilityLabel="Назад"
        hitSlop={4}
        onPress={onBack}
        style={styles.back}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={20}
          color={colors.ink}
        />
      </Pressable>
    </View>
  );
}

export function ProfileScreen({
  section,
  onBack,
  onOpenOrder,
  onLogout,
}: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (!store.session) return;
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setProfile(await authApi.profile(store.session));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Не удалось загрузить профиль",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store.session]);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(
    () => [
      ...(profile?.currentOrders ?? []),
      ...(profile?.orderHistory ?? []),
    ],
    [profile],
  );
  const backgroundColor = section === "balance" ? "#F8F8F8" : colors.white;

  const refreshControl = (
    <RefreshControl
      colors={[colors.orange]}
      onRefresh={() => void load(true)}
      refreshing={refreshing}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <StatusBar backgroundColor={backgroundColor} style="dark" />
      <BackHeader
        backgroundColor={backgroundColor}
        onBack={onBack}
        top={insets.top}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.muted}>Загружаем данные…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="account-alert-outline"
            size={44}
            color="#999999"
          />
          <Text style={styles.errorTitle}>Не удалось загрузить данные</Text>
          <Text style={styles.muted}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : section === "orders" ? (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 20,
          }}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Мои заказы</Text>
          {orders.length ? (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                onPress={() => onOpenOrder(order.id)}
                order={order}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptySeparator} />
              <View style={styles.emptyIllustration}>
                <MaterialCommunityIcons
                  name="food-takeout-box-outline"
                  size={78}
                  color={colors.orange}
                />
                <MaterialCommunityIcons
                  name="fish"
                  size={39}
                  color={colors.white}
                  style={styles.emptyFish}
                />
              </View>
              <Text style={styles.emptyText}>
                Пока здесь пусто,{"\n"}пора сделать первый заказ!
              </Text>
              <Pressable onPress={onBack} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>Меню</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      ) : section === "balance" ? (
        <ScrollView
          contentContainerStyle={[
            styles.balanceContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.screenTitle, styles.balanceTitle]}>NAKTA Coin</Text>
          <View style={styles.balanceCard}>
            <View>
              <Text style={styles.balanceLabel}>Ваш баланс</Text>
              <Text style={styles.balanceValue}>
                {profile?.naktaCoins ?? 0}
              </Text>
            </View>
            <View style={styles.coinIcon}>
              <MaterialCommunityIcons
                name="star-four-points"
                size={34}
                color="#F8A100"
              />
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Как работают NAKTA Coin</Text>
            <Text style={styles.infoText}>
              Баланс и начисления приходят с сервера Накта суши. Используйте
              доступные монеты в заказе, когда эта возможность появится в
              оформлении.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>История начислений</Text>
            <Text style={styles.infoText}>
              История операций пока пуста.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.settingsContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.screenTitle, styles.settingsTitle]}>Настройки</Text>
          <View style={styles.settingsField}>
            <Text style={styles.fieldLabel}>Телефон аккаунта</Text>
            <Text style={styles.fieldValue}>{store.session?.phone}</Text>
          </View>
          <View style={styles.settingsField}>
            <Text style={styles.fieldLabel}>Баланс NAKTA Coin</Text>
            <Text style={styles.fieldValue}>{profile?.naktaCoins ?? 0}</Text>
          </View>
          <Pressable onPress={onLogout} style={styles.logout}>
            <Text style={styles.logoutText}>Выйти из профиля</Text>
            <View style={styles.logoutIcon}>
              <MaterialCommunityIcons
                name="logout"
                size={21}
                color={colors.white}
              />
            </View>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  back: {
    width: 48,
    height: 48,
    marginTop: 16,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  muted: {
    color: "#999999",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  retry: {
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  retryText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  screenTitle: {
    marginTop: 6,
    marginLeft: 16,
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
  },
  orderWrap: {
    marginTop: 28,
    marginHorizontal: 16,
  },
  orderCard: {
    minHeight: 148,
    paddingTop: 28,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "#F8F8F8",
  },
  orderPressed: {
    opacity: 0.82,
  },
  orderTitle: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  orderSubtitle: {
    marginTop: 8,
    color: "#999999",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
  },
  orderPreview: {
    height: 44,
    marginTop: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  orderTotal: {
    marginLeft: "auto",
    color: "#000000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  statusPill: {
    position: "absolute",
    zIndex: 2,
    top: -12,
    left: 24,
    minHeight: 28,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  statusCompleted: {
    backgroundColor: "#45A160",
  },
  statusCancelled: {
    backgroundColor: colors.danger,
  },
  statusText: {
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
  },
  emptySeparator: {
    width: 276,
    height: 1,
    marginTop: 8,
    backgroundColor: "#E1E1E1",
  },
  emptyIllustration: {
    width: 147,
    height: 203,
    marginTop: 16,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  emptyFish: {
    position: "absolute",
    bottom: 41,
    padding: 10,
    borderRadius: 22,
    backgroundColor: colors.orange,
  },
  emptyText: {
    marginTop: 48,
    marginHorizontal: 28,
    color: "#000000",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  menuButton: {
    width: 264,
    height: 52,
    marginTop: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  menuButtonText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  balanceContent: {
    paddingBottom: 20,
  },
  balanceTitle: {
    marginBottom: 16,
  },
  balanceCard: {
    minHeight: 160,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.76)",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  balanceValue: {
    marginTop: 8,
    color: colors.white,
    fontFamily: "Inter_900Black",
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "900",
  },
  coinIcon: {
    width: 64,
    height: 64,
    marginLeft: "auto",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0C6",
  },
  infoCard: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  infoTitle: {
    color: "#000000",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  infoText: {
    marginTop: 10,
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  settingsContent: {
    paddingHorizontal: 16,
  },
  settingsTitle: {
    marginLeft: 0,
  },
  settingsField: {
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F2",
  },
  fieldLabel: {
    color: "#666666",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  fieldValue: {
    color: "#000000",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
  },
  logout: {
    height: 52,
    marginTop: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: colors.ink,
  },
  logoutText: {
    flex: 1,
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  logoutIcon: {
    width: 68,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
});
