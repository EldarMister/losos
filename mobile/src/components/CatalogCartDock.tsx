import { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveImageUrl } from "../api";
import {
  deliveryEtaLabel,
  deliveryFeeFor,
  freeDeliveryRemaining,
} from "../delivery";
import { formatMoney } from "../money";
import { useStore } from "../store";
import { colors, shadow } from "../theme";
import { NumberTicker } from "./NumberTicker";

const money = formatMoney;

type Props = {
  onOpenCart: () => void;
  onOpenDeliveryInfo: () => void;
};

export function CatalogCartDock({ onOpenCart, onOpenDeliveryInfo }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const region = store.activeRegion;
  const etaLabel = deliveryEtaLabel(region);
  const deliveryFee = deliveryFeeFor(region, store.cartTotal, store.deliveryType);
  const remainingForFreeDelivery = freeDeliveryRemaining(region, store.cartTotal);
  const cartPreviewProducts = useMemo(() => {
    const seen = new Set<number>();
    return store.cart.flatMap((line) => {
      if (seen.has(line.product.id)) return [];
      seen.add(line.product.id);
      return [line.product];
    });
  }, [store.cart]);
  const previewOverflow = cartPreviewProducts.length > 4
    ? cartPreviewProducts.length - 3
    : 0;
  const visibleCartPreviews = previewOverflow
    ? cartPreviewProducts.slice(0, 3)
    : cartPreviewProducts.slice(0, 4);

  if (!store.cartCount) return null;

  return (
    <View
      style={[
        styles.cartDock,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Подробные условия доставки"
        hitSlop={6}
        onPress={onOpenDeliveryInfo}
        style={styles.cartStatusButton}
      >
        <View style={styles.cartStatus}>
          {store.deliveryType === "pickup"
            ? <Text style={styles.cartStatusText}>Самовывоз • бесплатно ›</Text>
            : <>
                <Text style={styles.cartStatusText}>Доставка </Text>
                <NumberTicker format={money} height={16} style={styles.cartStatusText} value={deliveryFee} />
                <Text style={styles.cartStatusText}> • </Text>
                {remainingForFreeDelivery > 0 ? <>
                  <Text style={styles.cartStatusText}>До бесплатной </Text>
                  <NumberTicker format={money} height={16} style={styles.cartStatusText} value={remainingForFreeDelivery} />
                </> : <Text style={styles.cartStatusText}>Бесплатная доставка</Text>}
                <Text style={styles.cartStatusText}> ›</Text>
              </>}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть корзину, ${money(store.cartTotal)}`}
        onPress={onOpenCart}
        style={styles.cartBar}
      >
        <View style={styles.cartPriceWrap}>
          <NumberTicker
            accessibilityLabel={`Сумма корзины: ${money(store.cartTotal)}`}
            format={money}
            height={22}
            style={styles.cartPrice}
            value={store.cartTotal}
          />
        </View>
        <View style={styles.cartMiddle}>
          <Text numberOfLines={1} style={styles.cartTime}>
            {store.deliveryType === "pickup" ? "Самовывоз" : etaLabel}
          </Text>
        </View>
        <View style={styles.cartPreviews}>
          {visibleCartPreviews.map((product) => (
            <Image
              key={product.id}
              resizeMode="cover"
              source={{ uri: resolveImageUrl(product.image) }}
              style={styles.cartPreviewImage}
            />
          ))}
          {previewOverflow ? (
            <View style={styles.cartPreviewOverflow}>
              <NumberTicker
                format={(value) => `+${value}`}
                height={15}
                style={styles.cartPreviewOverflowText}
                value={previewOverflow}
              />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cartDock: {
    position: "absolute",
    zIndex: 20,
    right: 0,
    bottom: 0,
    left: 0,
    paddingTop: 9,
    paddingHorizontal: 16,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    ...shadow,
    elevation: 30,
  },
  cartStatus: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cartStatusText: {
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  cartStatusButton: {
    minHeight: 24,
    paddingBottom: 8,
    justifyContent: "center",
  },
  cartBar: {
    height: 60,
    paddingLeft: 16,
    paddingRight: 2,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
  },
  cartPriceWrap: {
    width: 108,
  },
  cartPrice: {
    color: colors.white,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    fontWeight: "800",
  },
  cartMiddle: {
    flex: 1,
    alignItems: "center",
  },
  cartTime: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    fontWeight: "700",
  },
  cartPreviews: {
    minWidth: 50,
    height: 44,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cartPreviewImage: {
    width: 38,
    height: 44,
    marginLeft: -19,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  cartPreviewOverflow: {
    width: 38,
    height: 44,
    marginLeft: -19,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  cartPreviewOverflowText: {
    color: colors.orange,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
});
