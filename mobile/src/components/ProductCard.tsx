import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveImageUrl } from "../api";
import { colors } from "../theme";
import type { Product } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
  onRemove?: () => void;
  quantity?: number;
  width?: number;
  layout?: "rail" | "grid";
};

export function ProductCard({
  product,
  onPress,
  onAdd,
  onRemove,
  quantity = 0,
  width = 164,
  layout = "rail",
}: Props) {
  const cardHeight = layout === "rail" ? 266 : Math.max(246, width + 78);
  const imageHeight = layout === "rail" ? 156 : width;

  return (
    <View style={[styles.card, { width, height: cardHeight }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть ${product.name}`}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          <Image
            resizeMode="cover"
            resizeMethod="resize"
            source={{ uri: resolveImageUrl(product.image) }}
            style={styles.image}
          />
        </View>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      </Pressable>
      {quantity > 0 ? (
        <View style={styles.stepper}>
          <Pressable
            accessibilityLabel={`Уменьшить количество ${product.name}`}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation();
              onRemove?.();
            }}
            style={({ pressed }) => [styles.stepperButton, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="minus" size={22} color="#B6B6B6" />
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable
            accessibilityLabel={`Увеличить количество ${product.name}`}
            hitSlop={6}
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={({ pressed }) => [styles.stepperButton, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#B6B6B6" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.bottom}>
          <View>
            {product.oldPrice ? (
              <Text style={styles.oldPrice}>{money(product.oldPrice)}</Text>
            ) : null}
            <Text style={styles.price}>{money(product.price)}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Добавить ${product.name}`}
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
          >
            <MaterialCommunityIcons name="plus" size={23} color={colors.orange} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

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
  name: {
    minHeight: 38,
    marginTop: 10,
    marginHorizontal: 16,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 19,
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
  },
  quantity: {
    minWidth: 28,
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    textAlign: "center",
  },
});
