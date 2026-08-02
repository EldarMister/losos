import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
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
import { colors } from "../theme";
import type { ProfileOrderDetail } from "../types";

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

  const load = useCallback(async () => {
    if (!store.session) return;
    setLoading(true);
    setError("");
    try {
      setOrder(await authApi.order(store.session, orderId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить заказ");
    } finally {
      setLoading(false);
    }
  }, [orderId, store.session]);

  useEffect(() => {
    void load();
  }, [load]);

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
          Заказ №{orderId.slice(0, 6).toUpperCase()}
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
              <Text style={styles.statusTitle}>{statusLabels[order.status]}</Text>
              <Text style={styles.statusDate}>{formatOrderDate(order.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Состав заказа</Text>
            {order.items.map((item, index) => (
              <View key={`${item.productName}-${index}`} style={styles.itemRow}>
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
