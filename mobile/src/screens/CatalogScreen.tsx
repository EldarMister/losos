import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi, resolveImageUrl } from "../api";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../store";
import { colors, radii, shadow } from "../theme";
import type { Category, Product, Promotion } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  onOpenProduct: (product: Product) => void;
  onOpenPromotion: (promotion: Promotion, index: number, all: Promotion[]) => void;
  onOpenCart: () => void;
};

export function CatalogScreen({
  onOpenLocation,
  onOpenSearch,
  onOpenProduct,
  onOpenPromotion,
  onOpenCart,
}: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const scrollRef = useRef<ScrollView>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [nextCategories, nextPromotions] = await Promise.all([
        catalogApi.categories(store.regionSlug),
        catalogApi.promotions(store.regionSlug),
      ]);
      setCategories(nextCategories);
      setPromotions(nextPromotions);
      setActiveCategory((current) => current || nextCategories[0]?.slug || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить каталог");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store.regionSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.products.some((product) => product.available !== false)),
    [categories],
  );

  const addProduct = (product: Product) => {
    if (product.modifierGroups?.some((group) => group.required)) {
      onOpenProduct(product);
      return;
    }
    store.addCartLine(product, 1, []);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="Открыть выбор адреса"
            hitSlop={8}
            onPress={onOpenLocation}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={26} color={colors.ink} />
          </Pressable>
          <Pressable onPress={onOpenLocation} style={styles.deliverySwitch}>
            <View style={styles.deliverySwitchActive}>
              <Text style={styles.deliverySwitchActiveText}>
                {store.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}
              </Text>
            </View>
            <Text style={styles.deliverySwitchText}>
              {store.deliveryType === "delivery" ? "Самовывоз" : "Доставка"}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={onOpenLocation} style={styles.locationRow}>
          <View style={styles.timeChip}>
            <Text style={styles.timeText}>
              {store.deliveryType === "delivery" ? "~70 мин" : "~25 мин"}
            </Text>
          </View>
          <View style={styles.addressChip}>
            <MaterialCommunityIcons
              name={store.deliveryType === "delivery" ? "map-marker" : "storefront-outline"}
              size={18}
              color={colors.muted}
            />
            <Text numberOfLines={1} style={styles.addressText}>
              {store.location?.address || "Укажите адрес"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.muted} />
          </View>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} size="large" />
          <Text style={styles.centerText}>Загружаем вкусное…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="wifi-alert" size={42} color={colors.muted} />
          <Text style={styles.errorTitle}>Каталог пока не загрузился</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Попробовать снова</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 12) + (store.cartCount ? 100 : 24) },
          ]}
          refreshControl={(
            <RefreshControl
              colors={[colors.orange]}
              onRefresh={() => void load(true)}
              refreshing={refreshing}
              tintColor={colors.orange}
            />
          )}
          showsVerticalScrollIndicator={false}
        >
          {promotions.length ? (
            <ScrollView
              contentContainerStyle={styles.promoRow}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {promotions.slice(0, 6).map((promotion, index) => (
                <Pressable
                  key={promotion.id}
                  onPress={() => onOpenPromotion(promotion, index, promotions)}
                  style={({ pressed }) => [styles.promoCard, pressed && styles.pressed]}
                >
                  <Image
                    resizeMode="cover"
                    source={{ uri: resolveImageUrl(promotion.image) }}
                    style={styles.promoImage}
                  />
                  <View style={styles.promoShade} />
                  <Text numberOfLines={3} style={styles.promoTitle}>
                    {promotion.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <Pressable onPress={onOpenSearch} style={styles.searchButton}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
            <Text style={styles.searchText}>Поиск по блюдам</Text>
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.categoryChips}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {visibleCategories.map((category) => (
              <Pressable
                key={category.slug}
                onPress={() => {
                  setActiveCategory(category.slug);
                  const index = visibleCategories.findIndex((item) => item.slug === category.slug);
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, 300 + index * 315),
                    animated: true,
                  });
                }}
                style={[
                  styles.categoryChip,
                  activeCategory === category.slug && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    activeCategory === category.slug && styles.categoryChipTextActive,
                  ]}
                >
                  {category.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {visibleCategories.map((category) => {
            const products = category.products.filter((product) => product.available !== false);
            return (
              <View key={category.slug} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{category.title}</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={24}
                    color="#B5B5B5"
                  />
                </View>
                <ScrollView
                  contentContainerStyle={styles.productsRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      onAdd={() => addProduct(product)}
                      onPress={() => onOpenProduct(product)}
                      product={product}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {store.cartCount ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Открыть корзину, ${money(store.cartTotal)}`}
          onPress={onOpenCart}
          style={[
            styles.cartBar,
            { bottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <View>
            <Text style={styles.cartPrice}>{money(store.cartTotal)}</Text>
            <Text style={styles.cartDelivery}>Доставка от 99 сом</Text>
          </View>
          <View style={styles.cartMiddle}>
            <Text style={styles.cartTime}>~70 мин</Text>
          </View>
          <View style={styles.cartCount}>
            <MaterialCommunityIcons name="shopping-outline" size={22} color={colors.orange} />
            <Text style={styles.cartCountText}>{store.cartCount}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    zIndex: 2,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  deliverySwitch: {
    flex: 1,
    height: 46,
    padding: 3,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  deliverySwitchActive: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  deliverySwitchActiveText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  deliverySwitchText: {
    flex: 1,
    color: "#999999",
    textAlign: "center",
    fontSize: 14,
  },
  locationRow: {
    marginTop: 9,
    flexDirection: "row",
    gap: 8,
  },
  timeChip: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  timeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  addressChip: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface,
  },
  addressText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  center: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    marginTop: 12,
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  errorTitle: {
    marginTop: 14,
    color: colors.ink,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "800",
  },
  retry: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingTop: 14,
  },
  promoRow: {
    paddingHorizontal: 16,
    gap: 9,
  },
  promoCard: {
    width: 138,
    height: 142,
    borderRadius: radii.medium,
    overflow: "hidden",
    backgroundColor: colors.orange,
  },
  promoImage: {
    width: "100%",
    height: "100%",
  },
  promoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  promoTitle: {
    position: "absolute",
    left: 13,
    right: 12,
    top: 13,
    color: colors.white,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.86,
  },
  searchButton: {
    height: 50,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.surface,
  },
  searchText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  categoryChips: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: "#E5E5E5",
  },
  categoryChipText: {
    color: colors.ink,
    fontSize: 14,
  },
  categoryChipTextActive: {
    fontWeight: "700",
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "800",
    letterSpacing: -0.35,
  },
  productsRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  cartBar: {
    position: "absolute",
    left: 16,
    right: 16,
    minHeight: 66,
    paddingHorizontal: 17,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
    ...shadow,
  },
  cartPrice: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  cartDelivery: {
    marginTop: 2,
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
  },
  cartMiddle: {
    flex: 1,
    alignItems: "center",
  },
  cartTime: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  cartCount: {
    minWidth: 46,
    height: 42,
    paddingHorizontal: 8,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: colors.white,
  },
  cartCountText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: "800",
  },
});
