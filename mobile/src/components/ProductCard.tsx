import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, startTransition, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveImageUrl } from "../api";
import { colors } from "../theme";
import { formatMoney, formatNumber } from "../money";
import type { Product } from "../types";
import { useOptimisticNumber } from "../useOptimisticNumber";
import { NumberTicker } from "./NumberTicker";
import { ImmediatePressable } from "./ImmediatePressable";
import { NaktaCoinBadge } from "./NaktaCoinBadge";
import { RipplePressable as Pressable } from "./RipplePressable";
import { RemoteImage } from "./RemoteImage";

const money = formatMoney;

type Props = {
  product: Product;
  onPress: (product: Product) => void;
  onAdd: (product: Product) => void;
  onIncrement?: (productId: number) => void;
  onRemove?: (productId: number) => void;
  quantity?: number;
  width?: number;
  layout?: "rail" | "grid";
};

export const ProductCard = memo(function ProductCard({
  product,
  onPress,
  onAdd,
  onIncrement,
  onRemove,
  quantity = 0,
  width = 164,
  layout = "rail",
}: Props) {
  const cardHeight = layout === "rail" ? 266 : Math.max(246, width + 78);
  const imageHeight = layout === "rail" ? 156 : Math.max(124, width - 24);
  const [displayQuantity, setDisplayQuantity] = useOptimisticNumber(quantity);
  const imageUrl = resolveImageUrl(product.image);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  const add = () => {
    if (product.modifierGroups?.some((group) => group.required)) {
      onAdd(product);
      return;
    }
    setDisplayQuantity(1);
    startTransition(() => onAdd(product));
  };

  const increment = () => {
    if (displayQuantity >= 20) return;
    setDisplayQuantity((current) => Math.min(20, current + 1));
    startTransition(() => onIncrement?.(product.id));
  };

  const decrement = () => {
    if (displayQuantity <= 0) return;
    setDisplayQuantity((current) => Math.max(0, current - 1));
    startTransition(() => onRemove?.(product.id));
  };

  return (
    <View style={[styles.card, { width, height: cardHeight }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть ${product.name}`}
        onPress={() => onPress(product)}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          {!imageLoaded ? (
            <View pointerEvents="none" style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-outline" size={32} color="#D7D7D7" />
            </View>
          ) : null}
          <RemoteImage
            accessibilityLabel={`Фото ${product.name}`}
            onFinalError={() => setImageLoaded(false)}
            onLoaded={() => setImageLoaded(true)}
            resizeMode="cover"
            source={imageUrl}
            style={styles.image}
            testID={`product-image-${product.id}`}
          />
          {product.naktaCoins ? (
            <NaktaCoinBadge
              amount={product.naktaCoins}
              compact
              style={styles.naktaCoinBadge}
            />
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      </Pressable>
      {displayQuantity > 0 ? (
        <View style={styles.stepper}>
          <ImmediatePressable
            accessibilityLabel={`Уменьшить количество ${product.name}`}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation();
              decrement();
            }}
            style={({ pressed }) => [styles.stepperButton, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="minus" size={22} color="#B6B6B6" />
          </ImmediatePressable>
          <NumberTicker
            accessibilityLabel={`Количество: ${displayQuantity}`}
            format={formatNumber}
            height={20}
            style={styles.quantity}
            value={displayQuantity}
          />
          <ImmediatePressable
            accessibilityLabel={`Увеличить количество ${product.name}`}
            disabled={displayQuantity >= 20}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation();
              increment();
            }}
            style={({ pressed }) => [styles.stepperButton, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#B6B6B6" />
          </ImmediatePressable>
        </View>
      ) : (
        <View style={styles.bottom}>
          <View>
            {product.oldPrice ? (
              <Text style={styles.oldPrice}>{money(product.oldPrice)}</Text>
            ) : null}
            <Text style={styles.price}>{money(product.price)}</Text>
          </View>
          <ImmediatePressable
            accessibilityRole="button"
            accessibilityLabel={`Добавить ${product.name}`}
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              add();
            }}
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="plus" size={23} color={colors.orange} />
          </ImmediatePressable>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.86,
  },
  imageWrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F2",
  },
  name: {
    minHeight: 38,
    marginTop: 10,
    marginHorizontal: 16,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 19,
  },
  naktaCoinBadge: {
    position: "absolute",
    left: 8,
    bottom: 9,
  },
  bottom: {
    marginTop: "auto",
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  oldPrice: {
    color: "#B2B2B2",
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  price: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  add: {
    width: 40,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  addPressed: {
    backgroundColor: colors.orangeSoft,
    transform: [{ scale: 0.96 }],
  },
  stepper: {
    height: 38,
    marginTop: "auto",
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperButton: {
    width: 40,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  quantity: {
    minWidth: 28,
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    textAlign: "center",
  },
});
