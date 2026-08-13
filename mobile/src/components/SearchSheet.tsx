import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
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
import { groupSearchResults } from "../searchResults";
import { colors, radii } from "../theme";
import type { Category, Product } from "../types";
import { CatalogCartDock } from "./CatalogCartDock";
import { ProductCard } from "./ProductCard";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenCart: () => void;
  onOpenDeliveryInfo: () => void;
  onOpenProduct: (product: Product) => void;
};

export function SearchSheet({
  visible,
  onClose,
  onOpenCart,
  onOpenDeliveryInfo,
  onOpenProduct,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const store = useStore();
  const inputRef = useRef<TextInput>(null);
  const categoryRailRef = useRef<ScrollView>(null);
  const resultsScrollRef = useRef<ScrollView>(null);
  const categoryChipLayouts = useRef<Record<string, { width: number; x: number }>>({});
  const resultSectionLayouts = useRef<Record<string, { y: number }>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSelectedCategorySlug(null);
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
    const task = InteractionManager.runAfterInteractions(() => {
      catalogApi.categories(store.regionSlug)
        .then((nextCategories) => {
          if (!ignore) setCategories(nextCategories);
        })
        .catch(() => undefined);
    });
    return () => {
      ignore = true;
      task.cancel();
    };
  }, [store.regionSlug, visible]);

  useEffect(() => {
    const normalized = query.trim();
    if (selectedCategorySlug) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }
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
  }, [categories, query, selectedCategorySlug, store.regionSlug]);

  const add = useCallback((product: Product) => {
    if (product.modifierGroups?.some((group) => group.required)) {
      onOpenProduct(product);
    } else {
      store.addCartLine(product, 1, []);
    }
  }, [onOpenProduct, store.addCartLine]);

  const quantityByProductId = useMemo(() => {
    const quantities = new Map<number, number>();
    for (const line of store.cart) {
      quantities.set(
        line.product.id,
        (quantities.get(line.product.id) ?? 0) + line.quantity,
      );
    }
    return quantities;
  }, [store.cart]);
  const productCardWidth = Math.min(
    206,
    Math.max(148, (width - 46) / 2),
  );
  const visibleCategories = useMemo(() => (
    categories.flatMap((category) => {
      const products = category.products.filter((product) => product.available !== false);
      return products.length ? [{ ...category, products }] : [];
    })
  ), [categories]);
  const groupedResults = useMemo(
    () => groupSearchResults(results, selectedCategorySlug, visibleCategories),
    [results, selectedCategorySlug, visibleCategories],
  );
  const hasSearchQuery = query.trim().length >= 2;

  const hasCatalogResults = selectedCategorySlug !== null || query.trim().length >= 2;

  const revealSelectedCategory = useCallback(() => {
    if (!selectedCategorySlug) return;
    const chip = categoryChipLayouts.current[selectedCategorySlug];
    if (!chip) return;
    categoryRailRef.current?.scrollTo({
      animated: true,
      x: Math.max(0, chip.x - (width - chip.width) / 2),
    });
  }, [selectedCategorySlug, width]);

  const revealCategorySection = useCallback((categorySlug: string) => {
    const section = resultSectionLayouts.current[categorySlug];
    if (!section) return;
    resultsScrollRef.current?.scrollTo({
      animated: true,
      y: Math.max(0, section.y - 11),
    });
  }, []);

  const revealSelectedSection = useCallback(() => {
    if (!selectedCategorySlug) return;
    revealCategorySection(selectedCategorySlug);
  }, [revealCategorySection, selectedCategorySlug]);

  const chooseCategory = (category: Category) => {
    Keyboard.dismiss();

    // Opening the category catalog replaces the current search results, so its
    // section positions must be measured again. Once the full catalog is open,
    // keep those measurements: the sections stay mounted between chip presses.
    const openingCatalog = selectedCategorySlug === null;
    if (openingCatalog) resultSectionLayouts.current = {};

    setQuery("");
    setSelectedCategorySlug(category.slug);

    // React ignores a state update to the already selected slug. Scroll here as
    // well so tapping the active chip always returns to its section.
    if (!openingCatalog) {
      requestAnimationFrame(() => revealCategorySection(category.slug));
    }
  };

  useEffect(() => {
    if (!selectedCategorySlug) return undefined;
    const frame = requestAnimationFrame(() => {
      revealSelectedCategory();
      revealSelectedSection();
    });
    const layoutTimer = setTimeout(revealSelectedSection, 140);
    const keyboardTimer = setTimeout(revealSelectedSection, 420);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(layoutTimer);
      clearTimeout(keyboardTimer);
    };
  }, [revealSelectedCategory, revealSelectedSection, selectedCategorySlug]);

  return (
    <BottomSheet
      edgeToEdge
      fullScreen
      visible={visible}
      onClose={onClose}
    >
      <StatusBar style="light" translucent />
      <View
        pointerEvents="none"
        style={[styles.statusBarBackdrop, { height: insets.top }]}
      />
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
            onChangeText={(value) => {
              resultSectionLayouts.current = {};
              setSelectedCategorySlug(null);
              setQuery(value);
            }}
            onSubmitEditing={() => Keyboard.dismiss()}
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
              resultSectionLayouts.current = {};
              setQuery("");
              setSelectedCategorySlug(null);
              inputRef.current?.focus();
            }}
          >
            <MaterialCommunityIcons name="close" size={25} color="#A0A0A0" />
          </Pressable>
        </View>
      </View>

      <View style={styles.resultsBody}>
        {!hasSearchQuery && !loading && !error && groupedResults.length ? (
          <ScrollView
            ref={categoryRailRef}
            contentContainerStyle={styles.categoryRail}
            horizontal
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={revealSelectedCategory}
            showsHorizontalScrollIndicator={false}
          >
            {visibleCategories.map((category) => {
              const active = category.slug === selectedCategorySlug;
              return (
                <Pressable
                  key={category.slug}
                  onLayout={(event) => {
                    categoryChipLayouts.current[category.slug] = event.nativeEvent.layout;
                    if (active) revealSelectedCategory();
                  }}
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
        ) : null}
        <ScrollView
          ref={resultsScrollRef}
          contentContainerStyle={[
            styles.content,
            store.cartCount ? styles.contentWithCart : null,
          ]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={revealSelectedSection}
          showsVerticalScrollIndicator={false}
        >
        {!query.trim() && selectedCategorySlug === null ? (
          <View style={styles.suggestions}>
            {visibleCategories.map((category) => (
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
            {groupedResults.map((category) => (
              <View
                key={category.slug}
                onLayout={(event) => {
                  resultSectionLayouts.current[category.slug] = event.nativeEvent.layout;
                  if (category.slug === selectedCategorySlug) revealSelectedSection();
                }}
                style={styles.resultSection}
              >
                {category.title ? <Text style={styles.heading}>{category.title}</Text> : null}
                <View style={styles.results}>
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      onAdd={add}
                      onIncrement={store.incrementCartProduct}
                      onRemove={store.decrementCartProduct}
                      onPress={onOpenProduct}
                      product={product}
                      quantity={quantityByProductId.get(product.id) ?? 0}
                      width={productCardWidth}
                      layout="grid"
                    />
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : hasCatalogResults ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="food-off-outline" size={40} color={colors.muted} />
            <Text style={styles.emptyTitle}>Ничего не нашли</Text>
            <Text style={styles.helper}>Попробуйте другое название блюда.</Text>
          </View>
        ) : null}
        </ScrollView>
        <CatalogCartDock
          onOpenCart={() => {
            onClose();
            onOpenCart();
          }}
          onOpenDeliveryInfo={() => {
            onClose();
            onOpenDeliveryInfo();
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  statusBarBackdrop: {
    position: "absolute",
    zIndex: 50,
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: "#9B9B9D",
  },
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
  contentWithCart: {
    paddingBottom: 150,
  },
  resultsBody: {
    flex: 1,
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
    backgroundColor: "#E1E1E1",
  },
  suggestionText: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  suggestionTextActive: {
    color: colors.ink,
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
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    gap: 8,
  },
  resultSection: {
    marginBottom: 24,
  },
  pressed: {
    opacity: 0.82,
  },
});
