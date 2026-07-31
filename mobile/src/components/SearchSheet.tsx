import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi } from "../api";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type { Category, Product } from "../types";
import { ProductCard } from "./ProductCard";
import { Sheet } from "./Sheet";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
  onOpenProduct: (product: Product) => void;
};

export function SearchSheet({
  visible,
  onClose,
  onOpenCart,
  onOpenProduct,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const inputRef = useRef<TextInput>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
      setError("");
      return undefined;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let ignore = false;
    catalogApi.categories(store.regionSlug)
      .then((nextCategories) => {
        if (!ignore) setCategories(nextCategories);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [store.regionSlug, visible]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const matchedCategory = categories.find((category) => category.title === normalized);
    if (matchedCategory) {
      setResults(matchedCategory.products.filter((product) => product.available !== false));
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      catalogApi.products(store.regionSlug, normalized)
        .then(setResults)
        .catch((reason) => {
          setError(reason instanceof Error ? reason.message : "Поиск не сработал");
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 320);
    return () => clearTimeout(timer);
  }, [categories, query, store.regionSlug]);

  const add = (product: Product) => {
    if (product.modifierGroups?.some((group) => group.required)) {
      onOpenProduct(product);
    } else {
      store.addCartLine(product, 1, []);
    }
  };
  const region = store.activeRegion;
  const serviceHours = region?.deliveryIs24Hours
    ? "24 часа"
    : region?.deliveryOpenTime && region?.deliveryCloseTime
      ? `${region.deliveryOpenTime}–${region.deliveryCloseTime}`
      : "часы уточняются";
  const freeDeliveryRemaining = Math.max(
    0,
    (region?.freeDeliveryThreshold ?? 0) - store.cartTotal,
  );
  const productCardWidth = Math.min(
    206,
    Math.max(148, (width - 46) / 2),
  );
  const groupedResults = useMemo(() => {
    const resultIds = new Set(results.map((product) => product.id));
    const groups = categories.flatMap((category) => {
      const products = category.products.filter((product) => (
        product.available !== false && resultIds.has(product.id)
      ));
      return products.length ? [{ ...category, products }] : [];
    });
    const groupedIds = new Set(
      groups.flatMap((category) => category.products.map((product) => product.id)),
    );
    const uncategorized = results.filter((product) => (
      product.available !== false && !groupedIds.has(product.id)
    ));
    return uncategorized.length
      ? [...groups, {
          id: -1,
          slug: "search-results",
          title: "Результаты",
          products: uncategorized,
        }]
      : groups;
  }, [categories, results]);

  const chooseCategory = (category: Category) => {
    Keyboard.dismiss();
    setQuery(category.title);
  };

  return (
    <Sheet
      edgeToEdge
      fullScreen
      visible={visible}
      onClose={onClose}
      footer={store.cartCount ? (
        <View>
          <Text style={styles.deliveryHint}>
            {store.deliveryType === "pickup"
              ? "Самовывоз из выбранной кухни"
              : freeDeliveryRemaining > 0
                ? `До бесплатной доставки ${money(freeDeliveryRemaining)}`
                : "Бесплатная доставка"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Открыть корзину, ${money(store.cartTotal)}`}
            onPress={() => {
              onClose();
              onOpenCart();
            }}
            style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}
          >
            <Text style={styles.cartPrice}>{money(store.cartTotal)}</Text>
            <Text style={styles.cartTime}>{serviceHours}</Text>
            <View style={styles.cartPreview}>
              <MaterialCommunityIcons name="shopping-outline" size={21} color={colors.orange} />
              <Text style={styles.cartCount}>{store.cartCount}</Text>
            </View>
          </Pressable>
        </View>
      ) : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 14 }]}>
        <Pressable
          accessibilityLabel="Назад"
          hitSlop={8}
          onPress={onClose}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.searchInput}>
          <MaterialCommunityIcons name="magnify" size={21} color={colors.ink} />
          <TextInput
            ref={inputRef}
            onChangeText={setQuery}
            placeholder="Поиск по блюдам"
            placeholderTextColor="#A0A0A0"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          <Pressable
            accessibilityLabel="Очистить поиск"
            hitSlop={8}
            onPress={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <MaterialCommunityIcons name="close" size={25} color="#A0A0A0" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!query.trim() ? (
          <View style={styles.suggestions}>
            {categories.map((category) => (
              <Pressable
                key={category.slug}
                onPress={() => chooseCategory(category)}
                style={styles.suggestion}
              >
                <Text style={styles.suggestionText}>{category.title}</Text>
              </Pressable>
            ))}
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.orange} />
            <Text style={styles.helper}>Ищем…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : groupedResults.length ? (
          <>
            <ScrollView
              contentContainerStyle={styles.categoryRail}
              horizontal
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
            >
              {categories.map((category) => {
                const active = category.title === query.trim();
                return (
                  <Pressable
                    key={category.slug}
                    onPress={() => chooseCategory(category)}
                    style={[styles.suggestion, active && styles.suggestionActive]}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        active && styles.suggestionTextActive,
                      ]}
                    >
                      {category.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {groupedResults.map((category) => (
              <View key={category.slug} style={styles.resultSection}>
                <Text style={styles.heading}>{category.title}</Text>
                <View style={styles.results}>
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      onAdd={() => add(product)}
                      onPress={() => onOpenProduct(product)}
                      product={product}
                      width={productCardWidth}
                      layout="grid"
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : query.trim().length >= 2 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyTitle}>Ничего не нашли</Text>
            <Text style={styles.helper}>Попробуйте другое название блюда.</Text>
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingLeft: 2,
    paddingRight: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    height: 52,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 50,
  },
  heading: {
    marginBottom: 12,
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 16,
  },
  suggestion: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  suggestionActive: {
    backgroundColor: colors.ink,
  },
  suggestionText: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  suggestionTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  center: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    marginTop: 9,
    color: colors.muted,
    textAlign: "center",
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    fontSize: 14,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  results: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  categoryRail: {
    paddingTop: 2,
    paddingBottom: 20,
    gap: 8,
  },
  resultSection: {
    marginBottom: 24,
  },
  deliveryHint: {
    marginBottom: 9,
    color: "#777777",
    fontSize: 12,
  },
  cartBar: {
    minHeight: 64,
    paddingHorizontal: 18,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
  },
  cartPrice: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  cartTime: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  cartPreview: {
    minWidth: 48,
    height: 42,
    marginLeft: 18,
    paddingHorizontal: 8,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: colors.white,
  },
  cartCount: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
  },
});
