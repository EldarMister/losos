import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../api";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type { ProfileOrderDetail } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;
const statusLabels: Record<string, string> = {
  new: "Заказ принят",
  confirmed: "Заказ подтверждён",
  preparing: "Готовим ваш заказ",
  ready: "Заказ готов",
  delivering: "Курьер уже в пути",
  completed: "Заказ выполнен",
  cancelled: "Заказ отменён",
};

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

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityLabel="Назад" hitSlop={10} onPress={onBack}><MaterialCommunityIcons name="arrow-left" size={28} color={colors.ink} /></Pressable>
        <Text style={styles.headerTitle}>Заказ №{orderId.slice(0, 6).toUpperCase()}</Text>
        <View style={styles.spacer} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={colors.orange} size="large" /></View> : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Повторить</Text></Pressable>
        </View>
      ) : order ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 18 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.status, order.status === "cancelled" && styles.statusCancelled]}>
            <MaterialCommunityIcons name={order.status === "cancelled" ? "close-circle-outline" : "chef-hat"} size={31} color={order.status === "cancelled" ? colors.danger : colors.orange} />
            <View><Text style={styles.statusTitle}>{statusLabels[order.status]}</Text><Text style={styles.statusDate}>{new Date(order.createdAt).toLocaleString("ru-RU")}</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Состав заказа</Text>
            {order.items.map((item, index) => (
              <View key={`${item.productName}-${index}`} style={styles.item}>
                <View style={styles.quantity}><Text style={styles.quantityText}>{item.quantity}</Text></View>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {item.modifierSnapshots.length ? <Text style={styles.modifiers}>{item.modifierSnapshots.map((modifier) => `${modifier.itemName} × ${modifier.quantity}`).join(", ")}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>{money(item.lineTotal)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Итого</Text><Text style={styles.total}>{money(order.total)}</Text></View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{order.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</Text>
            <Text style={styles.address}>{order.address}</Text>
            {order.apartment || order.entrance || order.floor ? <Text style={styles.secondary}>Кв. {order.apartment || "—"}, подъезд {order.entrance || "—"}, этаж {order.floor || "—"}</Text> : null}
            {order.comment ? <Text style={styles.secondary}>Комментарий: {order.comment}</Text> : null}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Оплата и комплектация</Text>
            <Text style={styles.address}>{order.paymentMethod === "card" ? "Картой при получении" : "Наличными"}</Text>
            <Text style={styles.secondary}>{order.noUtensils ? "Без приборов" : `Приборы: ${order.utensilsCount}`}</Text>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: 64, paddingHorizontal: 18, paddingBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  spacer: { width: 28 },
  center: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center", gap: 13 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20, textAlign: "center" },
  retry: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 99, backgroundColor: colors.ink },
  retryText: { color: colors.white, fontWeight: "700" },
  content: { padding: 12, gap: 10 },
  status: { minHeight: 92, padding: 18, borderRadius: radii.large, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: colors.orangeSoft },
  statusCancelled: { backgroundColor: "#FFF0F0" },
  statusTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  statusDate: { marginTop: 4, color: colors.muted, fontSize: 12 },
  card: { padding: 17, borderRadius: radii.large, backgroundColor: colors.white },
  cardTitle: { marginBottom: 12, color: colors.ink, fontSize: 18, fontWeight: "900" },
  item: { minHeight: 58, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: 10 },
  quantity: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  quantityText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  itemCopy: { flex: 1 },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  modifiers: { marginTop: 3, color: colors.muted, fontSize: 10, lineHeight: 14 },
  itemPrice: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  totalRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  totalLabel: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  total: { color: colors.orange, fontSize: 20, fontWeight: "900" },
  address: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  secondary: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 },
});
