import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DEFAULT_DELIVERY_FEE,
  deliveryEtaLabel,
  deliveryFeeFor,
  freeDeliveryRemaining,
  freeDeliveryThreshold,
  kitchenSchedule,
  maximumOrderAmount,
  minimumOrderAmount,
} from "../delivery";
import { useStore } from "../store";
import { colors } from "../theme";
import { formatMoney } from "../money";
import { NumberTicker } from "./NumberTicker";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const money = formatMoney;

export function DeliveryInfoSheet({ visible, onClose }: Props) {
  const store = useStore();
  const region = store.activeRegion;
  const pickup = store.deliveryType === "pickup";
  const address = store.location?.address || "Адрес пока не выбран";
  const fee = deliveryFeeFor(region, store.cartTotal, store.deliveryType);
  const remaining = freeDeliveryRemaining(region, store.cartTotal);
  const threshold = freeDeliveryThreshold(region);

  return (
    <Sheet height={pickup ? "43%" : "61%"} onClose={onClose} visible={visible}>
      <View style={styles.content}>
        <View style={styles.deliveryHeader}>
          <View style={styles.deliveryIcon}>
            <MaterialCommunityIcons
              name={pickup ? "shopping-outline" : "truck-delivery-outline"}
              size={21}
              color={colors.orange}
            />
          </View>
          <View style={styles.deliveryHeaderCopy}>
            {pickup ? (
              <Text style={styles.deliveryHeaderTitle}>Самовывоз бесплатно</Text>
            ) : fee > 0 ? (
              <View style={styles.deliveryHeaderTitleRow}>
                <Text style={styles.deliveryHeaderTitle}>Доставка </Text>
                <NumberTicker format={money} height={22} style={styles.deliveryHeaderTitle} value={fee} />
              </View>
            ) : (
              <Text style={styles.deliveryHeaderTitle}>Доставка бесплатно</Text>
            )}
            {!pickup && remaining > 0 ? (
              <View style={styles.deliveryHeaderSubtitleRow}>
                <Text style={styles.deliveryHeaderSubtitle}>До бесплатной ещё </Text>
                <NumberTicker format={money} height={17} style={styles.deliveryHeaderSubtitle} value={remaining} />
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.address}>
          {[region?.name, address].filter(Boolean).join(", ")}
        </Text>
        <Text style={styles.schedule}>{kitchenSchedule(region)}</Text>

        {!pickup ? (
          <View style={styles.facts}>
            <Fact label="Время доставки" value={deliveryEtaLabel(region)} />
            <Fact label="Минимальный заказ" value={money(minimumOrderAmount(region))} />
            <Fact label="Максимальный заказ" value={money(maximumOrderAmount(region))} />
          </View>
        ) : null}

        {!pickup ? (
          <View style={styles.priceSection}>
            <Text style={styles.priceTitle}>Стоимость доставки</Text>
            <Fact label={`При заказе до ${money(threshold)}`} value={money(region?.deliveryFee ?? DEFAULT_DELIVERY_FEE)} />
            <Fact label={`При заказе от ${money(threshold)}`} value={money(0)} />
          </View>
        ) : null}

        <Pressable
          accessibilityLabel="Закрыть информацию о доставке"
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Text style={styles.closeText}>Понятно</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  deliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  deliveryIcon: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: "#FFD8C8",
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8F4",
  },
  deliveryHeaderCopy: { flex: 1 },
  deliveryHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  deliveryHeaderTitle: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 22,
  },
  deliveryHeaderSubtitle: {
    marginTop: 1,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 17,
  },
  deliveryHeaderSubtitleRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  address: {
    marginTop: 26,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.55,
    lineHeight: 30,
  },
  schedule: {
    marginTop: 14,
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 19,
  },
  facts: { marginTop: 22, gap: 15 },
  factRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
  },
  factLabel: {
    flex: 1,
    color: "#4C4C4C",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
  },
  factValue: {
    color: "#4C4C4C",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "right",
  },
  priceSection: {
    marginTop: 19,
    paddingTop: 19,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 13,
  },
  priceTitle: {
    marginBottom: 2,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    lineHeight: 21,
  },
  closeButton: {
    height: 60,
    marginTop: "auto",
    marginBottom: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  closeButtonPressed: { opacity: 0.74 },
  closeText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
