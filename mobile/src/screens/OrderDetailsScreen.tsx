import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../api";
import { formatMoney } from "../money";
import { useStore } from "../store";
import { supportUrl } from "../support";
import { presentPolledOrderStatus } from "../pushNotifications";
import { colors } from "../theme";
import type { ProfileOrderDetail } from "../types";
import { type OrderRefreshSource, useOrderLiveRefresh } from "../useOrderLiveRefresh";

const money = formatMoney;
const statusLabels: Record<ProfileOrderDetail["status"], string> = {
  new: "Заказ принят",
  confirmed: "Заказ подтверждён",
  preparing: "Готовим ваш заказ",
  ready: "Заказ готов",
  delivering: "Курьер уже в пути",
  completed: "Заказ выполнен",
  cancelled: "Заказ отменён",
};
const posStatusLabels: Record<string, string> = {
  sent_to_kitchen: "Заказ передан на кухню",
  accepted_by_kitchen: "Кухня приняла заказ",
  cooking: "Заказ готовится",
  partially_rejected: "Некоторые блюда недоступны",
  ready: "Заказ готов",
  rejected: "Кухня отклонила заказ",
  cancelled: "Заказ отменён",
};

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OrderDetailsScreen({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [order, setOrder] = useState<ProfileOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const lastStatus = useRef<ProfileOrderDetail["status"] | null>(null);

  const load = useCallback(async (
    silent = false,
    source: OrderRefreshSource | "initial" = "initial",
  ) => {
    if (!store.session) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const nextOrder = await authApi.order(store.session, orderId);
      const statusChanged = lastStatus.current !== null
        && lastStatus.current !== nextOrder.status;
      lastStatus.current = nextOrder.status;
      setOrder(nextOrder);
      if (statusChanged && source === "poll") {
        void presentPolledOrderStatus(orderId, nextOrder.status).catch(() => undefined);
      }
    } catch (reason) {
      if (!silent) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить заказ");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId, store.session]);

  useEffect(() => {
    void load();
  }, [load]);

  useOrderLiveRefresh(
    useCallback((source) => load(true, source), [load]),
    Boolean(store.session),
  );

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={styles.root.backgroundColor} style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable
          accessibilityLabel="Назад"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="arrow-left" size={23} color={colors.ink} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Заказ №{order?.orderNumber || orderId.slice(0, 6).toUpperCase()}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Повторить</Text>
          </Pressable>
        </View>
      ) : order ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 14) + 18 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.statusCard, order.status === "cancelled" && styles.statusCancelled]}>
            <MaterialCommunityIcons
              name={order.status === "cancelled" ? "close-circle" : "check-circle"}
              size={25}
              color={order.status === "cancelled" ? colors.danger : colors.orange}
            />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>
                {order.posStatus ? posStatusLabels[order.posStatus] || statusLabels[order.status] : statusLabels[order.status]}
              </Text>
              <Text style={styles.statusDate}>{formatOrderDate(order.createdAt)}</Text>
            </View>
          </View>

          {order.posProgress?.itemsTotal ? (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>
                  Готово {order.posProgress.itemsReady} из {order.posProgress.itemsTotal} блюд
                </Text>
                {order.posProgress.itemsRejected > 0 ? (
                  <Text style={styles.progressRejected}>Отклонено: {order.posProgress.itemsRejected}</Text>
                ) : null}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressValue,
                    { width: `${Math.min(100, (order.posProgress.itemsReady / order.posProgress.itemsTotal) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Состав заказа</Text>
            {order.items.map((item, index) => (
              <View key={`${item.productName}-${index}`} style={[styles.itemRow, item.posStatus === "rejected" && styles.itemRejected]}>
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {item.modifierSnapshots.length ? (
                    <Text numberOfLines={2} style={styles.modifiers}>
                      {item.modifierSnapshots
                        .map((modifier) => `${modifier.itemName} ×${modifier.quantity}`)
                        .join(", ")}
                    </Text>
                  ) : null}
                  {item.posStatus ? (
                    <Text style={[
                      styles.itemKitchenStatus,
                      item.posStatus === "ready" && styles.itemKitchenReady,
                      item.posStatus === "rejected" && styles.itemKitchenRejected,
                    ]}>
                      {item.posStatus === "ready"
                        ? "Готово"
                        : item.posStatus === "cooking"
                          ? `Готовится${item.posReadyQuantity ? ` · готово ${item.posReadyQuantity}` : ""}`
                          : item.posStatus === "rejected"
                            ? `Отклонено${item.posRejectReason ? `: ${item.posRejectReason}` : ""}`
                            : item.posStatus === "accepted"
                              ? "Принято кухней"
                              : "Ожидает кухню"}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>{money(item.lineTotal)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Итого</Text>
              <Text style={styles.totalValue}>{money(order.total)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {order.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}
            </Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#77797E" />
              <View style={styles.infoCopy}>
                <Text style={styles.infoText}>{order.address || "Адрес не указан"}</Text>
                {order.apartment || order.entrance || order.floor ? (
                  <Text style={styles.infoSecondary}>
                    {[order.apartment && `кв. ${order.apartment}`, order.entrance && `подъезд ${order.entrance}`, order.floor && `этаж ${order.floor}`]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                ) : null}
              </View>
            </View>
            {order.comment ? <Text style={styles.comment}>Комментарий: {order.comment}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Оплата и комплектация</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color="#77797E" />
              <View style={styles.infoCopy}>
                <Text style={styles.infoText}>
                  {order.paymentMethod === "card" ? "Картой" : "Наличными"}
                </Text>
                <Text style={styles.infoSecondary}>
                  {order.noUtensils ? "Без приборов" : `Приборы: ${order.utensilsCount}`}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Связаться с поддержкой"
            onPress={() => void Linking.openURL(supportUrl(store.activeRegion))}
            style={({ pressed }) => [styles.supportButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.ink} />
            <Text style={styles.supportText}>Связаться с поддержкой</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 10,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    lineHeight: 23,
    textAlign: "center",
  },
  headerSpacer: {
    width: 46,
  },
  center: {
    flex: 1,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },
  error: {
    color: colors.danger,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retry: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: colors.ink,
  },
  retryText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statusCard: {
    minHeight: 82,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFF2EC",
  },
  statusCancelled: {
    backgroundColor: "#FFF0F0",
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 21,
  },
  statusDate: {
    marginTop: 3,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  progressCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFF5EA",
    gap: 10,
  },
  progressHeader: {
    gap: 3,
  },
  progressTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 19,
  },
  progressRejected: {
    color: colors.danger,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    lineHeight: 15,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F0D6BF",
    overflow: "hidden",
  },
  progressValue: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  card: {
    padding: 17,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  cardTitle: {
    marginBottom: 10,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  itemRow: {
    minHeight: 58,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemRejected: {
    marginHorizontal: -7,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: "#FFF1EE",
  },
  quantityBadge: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
  },
  quantityText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  modifiers: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
  },
  itemKitchenStatus: {
    marginTop: 3,
    color: "#A05A00",
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
  },
  itemKitchenReady: {
    color: "#27804F",
  },
  itemKitchenRejected: {
    color: colors.danger,
  },
  itemPrice: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  totalRow: {
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  totalValue: {
    color: colors.orange,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },
  infoCopy: {
    flex: 1,
  },
  infoText: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  infoSecondary: {
    marginTop: 5,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
  },
  comment: {
    marginTop: 11,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  supportButton: {
    minHeight: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F3F3F3",
  },
  supportText: {
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});
