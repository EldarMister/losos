import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveImageUrl } from "../api";
import { colors, radii } from "../theme";
import type { Product } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
};

export function ProductCard({ product, onPress, onAdd }: Props) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть ${product.name}`}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={styles.imageWrap}>
          <Image
            resizeMode="cover"
            source={{ uri: resolveImageUrl(product.image) }}
            style={styles.image}
          />
          {product.isNew ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    minHeight: 278,
    padding: 11,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.86,
  },
  imageWrap: {
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 7,
    left: 7,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: colors.orange,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  name: {
    minHeight: 44,
    marginTop: 12,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "500",
  },
  bottom: {
    marginTop: "auto",
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
    fontSize: 16,
    fontWeight: "500",
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  addPressed: {
    backgroundColor: colors.orangeSoft,
    transform: [{ scale: 0.96 }],
  },
});
