import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveImageUrl } from "../api";
import { lineTotal, useStore } from "../store";
import { colors, radii } from "../theme";
import { PrimaryButton } from "./PrimaryButton";
import { QuantityControl } from "./QuantityControl";
import { Sheet } from "./Sheet";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export function CartSheet({ visible, onClose, onCheckout }: Props) {
  const store = useStore();

  const clear = () => {
    Alert.alert(
      "Очистить корзину?",
      "Все выбранные блюда и добавки будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Очистить", style: "destructive", onPress: store.clearCart },
      ],
    );
  };

  return (
    <Sheet
      fullScreen
      visible={visible}
      onClose={onClose}
      footer={store.cart.length ? (
        <View>
          <Text style={styles.deliveryHint}>
            Доставка от 99 сом · итог пересчитает сервер
          </Text>
          <PrimaryButton
            label={`К оформлению · ${money(store.cartTotal)}`}
            onPress={onCheckout}
          />
        </View>
      ) : undefined}
    >
      <View style={styles.header}>
        <Pressable accessibilityLabel="Закрыть корзину" hitSlop={9} onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Корзина</Text>
        <Pressable
          accessibilityLabel="Очистить корзину"
          disabled={!store.cart.length}
          hitSlop={9}
          onPress={clear}
          style={!store.cart.length && styles.disabled}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {!store.cart.length ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="shopping-outline" size={48} color={colors.orange} />
          </View>
          <Text style={styles.emptyTitle}>Пока пусто</Text>
          <Text style={styles.emptyText}>Добавьте блюда из каталога — всё появится здесь.</Text>
          <PrimaryButton
            label="Вернуться в каталог"
            onPress={onClose}
            style={styles.emptyButton}
            tone="black"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {store.cart.map((line) => (
            <View key={line.key} style={styles.line}>
              <Image
                resizeMode="cover"
                source={{ uri: resolveImageUrl(line.product.image) }}
                style={styles.image}
              />
              <View style={styles.lineCopy}>
                <Text numberOfLines={2} style={styles.lineName}>{line.product.name}</Text>
                {line.modifiers.length ? (
                  <Text numberOfLines={2} style={styles.modifiers}>
                    {line.modifiers.map((modifier) => (
                      `${modifier.itemName}${modifier.quantity > 1 ? ` × ${modifier.quantity}` : ""}`
                    )).join(", ")}
                  </Text>
                ) : (
                  <Text style={styles.modifiers}>Стандартная комплектация</Text>
                )}
                <View style={styles.lineBottom}>
                  <Text style={styles.price}>{money(lineTotal(line))}</Text>
                  <QuantityControl
                    compact
                    onChange={(value) => store.setCartQuantity(line.key, value)}
                    value={line.quantity}
                  />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.optionCard}>
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={21} color={colors.ink} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Комплектация</Text>
              <Text style={styles.optionSubtitle}>Приборы укажете при оформлении</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={21} color={colors.ink} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>Промокод</Text>
              <Text style={styles.optionSubtitle}>Появится после подключения на сервере</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Блюда</Text>
              <Text style={styles.summaryValue}>{money(store.cartTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Доставка</Text>
              <Text style={styles.summaryMuted}>уточнится</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalText}>Итого</Text>
              <Text style={styles.summaryTotalText}>{money(store.cartTotal)}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.35,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  line: {
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    gap: 11,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  lineCopy: {
    flex: 1,
    minHeight: 92,
  },
  lineName: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  modifiers: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  lineBottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  optionCard: {
    minHeight: 72,
    marginTop: 10,
    padding: 12,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  optionSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 11,
  },
  summary: {
    marginTop: 18,
    padding: 15,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  summaryMuted: {
    color: colors.muted,
    fontSize: 14,
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D8D8D8",
  },
  summaryTotalText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  deliveryHint: {
    marginBottom: 8,
    color: colors.muted,
    fontSize: 11,
  },
  empty: {
    flex: 1,
    paddingHorizontal: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  emptyTitle: {
    marginTop: 18,
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 220,
    marginTop: 22,
  },
});
