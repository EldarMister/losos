import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi, resolveImageUrl } from "../api";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type { Category, Product } from "../types";
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
  const store = useStore();
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
    }
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

  return (
    <Sheet
      edgeToEdge
      fullScreen
      visible={visible}
      onClose={onClose}
      footer={store.cartCount ? (
        <View>
          <Text style={styles.deliveryHint}>
            Доставка 99 сом · До бесплатной 2 633 сом
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
            <Text style={styles.cartTime}>~70 мин</Text>
            <View style={styles.cartPreview}>
              <MaterialCommunityIcons name="shopping-outline" size={21} color={colors.orange} />
              <Text style={styles.cartCount}>{store.cartCount}</Text>
            </View>
          </Pressable>
        </View>
      ) : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityLabel="Назад" hitSlop={8} onPress={onClose}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.ink} />
        </Pressable>
        <View style={styles.searchInput}>
          <MaterialCommunityIcons name="magnify" size={21} color={colors.ink} />
          <TextInput
            autoFocus={visible}
            onChangeText={setQuery}
            placeholder="Поиск по блюдам"
            placeholderTextColor="#A0A0A0"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          {query ? (
            <Pressable accessibilityLabel="Очистить поиск" onPress={() => setQuery("")}>
              <MaterialCommunityIcons name="close" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!query.trim() ? (
          <>
            <Text style={styles.heading}>Что найдём?</Text>
            <View style={styles.suggestions}>
              {categories.map((category) => (
                <Pressable
                  key={category.slug}
                  onPress={() => setQuery(category.title)}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>{category.title}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.orange} />
            <Text style={styles.helper}>Ищем…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : results.length ? (
          <>
            <Text style={styles.heading}>Нашли {results.length}</Text>
            <View style={styles.results}>
              {results.map((product) => (
                <View key={product.id} style={styles.result}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Открыть ${product.name}`}
                    onPress={() => onOpenProduct(product)}
                    style={styles.resultMain}
                  >
                    <Image
                      resizeMode="cover"
                      source={{ uri: resolveImageUrl(product.image) }}
                      style={styles.resultImage}
                    />
                    <View style={styles.resultCopy}>
                      <Text numberOfLines={2} style={styles.resultName}>{product.name}</Text>
                      <Text style={styles.resultPrice}>{money(product.price)}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Добавить ${product.name}`}
                    hitSlop={7}
                    onPress={(event) => {
                      event.stopPropagation();
                      add(product);
                    }}
                    style={styles.add}
                  >
                    <MaterialCommunityIcons name="plus" size={22} color={colors.orange} />
                  </Pressable>
                </View>
              ))}
            </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 13,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
  },
  content: {
    padding: 18,
    paddingBottom: 50,
  },
  heading: {
    marginBottom: 14,
    color: colors.ink,
    fontSize: 21,
    fontWeight: "800",
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  suggestion: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  suggestionText: {
    color: colors.ink,
    fontSize: 15,
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
    gap: 8,
  },
  result: {
    minHeight: 90,
    padding: 8,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.surface,
  },
  resultMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  resultImage: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  resultCopy: {
    flex: 1,
    alignSelf: "stretch",
    paddingVertical: 5,
    justifyContent: "space-between",
  },
  resultName: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "600",
  },
  resultPrice: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  add: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
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
