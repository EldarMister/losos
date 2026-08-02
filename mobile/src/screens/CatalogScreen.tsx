import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi, resolveImageUrl } from "../api";
import { CatalogCartDock } from "../components/CatalogCartDock";
import { ProductCard } from "../components/ProductCard";
import { deliveryEtaLabel } from "../delivery";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type { Category, Product, Promotion } from "../types";

type Props = {
  onOpenMenu: () => void;
  onOpenLocation: () => void;
  onOpenDeliveryInfo: () => void;
  onOpenCashback: () => void;
  onOpenSearch: () => void;
  onOpenProduct: (product: Product) => void;
  onOpenPromotion: (promotion: Promotion, index: number, all: Promotion[]) => void;
  onOpenCart: () => void;
};

export function CatalogScreen({
  onOpenMenu,
  onOpenLocation,
  onOpenDeliveryInfo,
  onOpenCashback,
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
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [catalogNavY, setCatalogNavY] = useState(260);
  const sectionOffsets = useRef<Record<string, number>>({});
  const sectionsOffset = useRef(0);
  const catalogNavOffset = useRef(260);
  const scrollY = useRef(new Animated.Value(0)).current;
  const etaLabel = deliveryEtaLabel(store.activeRegion);
  const productCardWidth = 172;

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

  const addProduct = useCallback((product: Product) => {
    if (product.modifierGroups?.some((group) => group.required)) {
      onOpenProduct(product);
      return;
    }
    store.addCartLine(product, 1, []);
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

  const header = (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 0) }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="Открыть меню"
            hitSlop={8}
            onPress={onOpenMenu}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={26} color={colors.ink} />
          </Pressable>
          <View style={styles.deliverySwitch}>
            <Pressable
              onPress={() => {
                store.setDeliveryType("delivery");
                onOpenLocation();
              }}
              style={[
                styles.deliverySwitchOption,
                store.deliveryType === "delivery" && styles.deliverySwitchActive,
              ]}
            >
              <Text style={store.deliveryType === "delivery"
                ? styles.deliverySwitchActiveText
                : styles.deliverySwitchText}
              >
                Доставка
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                store.setDeliveryType("pickup");
                onOpenLocation();
              }}
              style={[
                styles.deliverySwitchOption,
                store.deliveryType === "pickup" && styles.deliverySwitchActive,
              ]}
            >
              <Text style={store.deliveryType === "pickup"
                ? styles.deliverySwitchActiveText
                : styles.deliverySwitchText}
              >
                Самовывоз
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityLabel="Открыть баланс Накта-коинов"
            onPress={onOpenCashback}
            style={({ pressed }) => [styles.cashbackChip, pressed && styles.chipPressed]}
          >
            <Text style={styles.cashbackText}>Coin</Text>
            <MaterialCommunityIcons name="butterfly" size={17} color={colors.orange} />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <Pressable
            accessibilityLabel="Открыть информацию о доставке"
            onPress={onOpenDeliveryInfo}
            style={({ pressed }) => [styles.timeChip, pressed && styles.chipPressed]}
          >
            <Text style={styles.timeText}>
              {store.deliveryType === "pickup"
                ? "Самовывоз"
                : etaLabel}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Выбрать адрес"
            onPress={onOpenLocation}
            style={({ pressed }) => [styles.addressChip, pressed && styles.chipPressed]}
          >
            <MaterialCommunityIcons
              name={store.deliveryType === "delivery" ? "map-marker" : "storefront-outline"}
              size={18}
              color={colors.muted}
            />
            <Text numberOfLines={1} style={styles.addressText}>
              {store.location?.address || "Укажите адрес"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.muted} />
          </Pressable>
        </View>
    </View>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const nextSticky = y >= Math.max(0, catalogNavOffset.current - insets.top);
    setShowStickyNav((current) => current === nextSticky ? current : nextSticky);
    if (nextSticky) {
      const currentCategory = visibleCategories
        .filter((category) => (
          sectionsOffset.current
            + (sectionOffsets.current[category.slug] ?? Number.POSITIVE_INFINITY)
          <= y + 150
        ))
        .at(-1);
      if (currentCategory) {
        setActiveCategory((current) => (
          current === currentCategory.slug ? current : currentCategory.slug
        ));
      }
    }
  };

  const stickyStart = Math.max(0, catalogNavY - insets.top);
  const stickyOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, stickyStart - 8), stickyStart],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const stickyTranslateY = scrollY.interpolate({
    inputRange: [Math.max(0, stickyStart - 8), stickyStart],
    outputRange: [6, 0],
    extrapolate: "clamp",
  });

  const renderCategoryChips = () => (
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
            scrollRef.current?.scrollTo({
              y: Math.max(
                0,
                sectionsOffset.current
                  + (sectionOffsets.current[category.slug] ?? 0)
                  - 116,
              ),
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
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent />
      <View
        pointerEvents="none"
        style={[styles.statusBarBackdrop, { height: insets.top }]}
      />
      {loading ? (
        <>
          {header}
          <View style={styles.center}>
            <ActivityIndicator color={colors.orange} size="large" />
            <Text style={styles.centerText}>Загружаем вкусное…</Text>
          </View>
        </>
      ) : error ? (
        <>
          {header}
          <View style={styles.center}>
            <MaterialCommunityIcons name="wifi-alert" size={42} color={colors.muted} />
            <Text style={styles.errorTitle}>Каталог пока не загрузился</Text>
            <Text style={styles.centerText}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retry}>
              <Text style={styles.retryText}>Попробовать снова</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 12) + (store.cartCount ? 100 : 24) },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { listener: handleScroll, useNativeDriver: true },
          )}
          refreshControl={(
            <RefreshControl
              colors={[colors.orange]}
              onRefresh={() => void load(true)}
              refreshing={refreshing}
              tintColor={colors.orange}
            />
          )}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
        >
          {header}

          <View style={styles.promotionsBlock}>
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
                      resizeMethod="resize"
                      source={{ uri: resolveImageUrl(promotion.image) }}
                      style={styles.promoImage}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>

          <View
            onLayout={(event) => {
              const nextY = event.nativeEvent.layout.y;
              catalogNavOffset.current = nextY;
              setCatalogNavY((current) => current === nextY ? current : nextY);
            }}
            style={styles.catalogNav}
          >
            <Pressable onPress={onOpenSearch} style={styles.searchButton}>
              <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
              <Text style={styles.searchText}>Поиск</Text>
            </Pressable>
            {renderCategoryChips()}
          </View>

          <View
            onLayout={(event) => {
              sectionsOffset.current = event.nativeEvent.layout.y;
            }}
            style={styles.sections}
          >
            {visibleCategories.map((category) => {
              const products = category.products.filter((product) => product.available !== false);
              return (
                <View
                  key={category.slug}
                  onLayout={(event) => {
                    sectionOffsets.current[category.slug] = event.nativeEvent.layout.y;
                  }}
                  style={[
                    styles.section,
                    category.slug === visibleCategories[0]?.slug && styles.firstSection,
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{category.title}</Text>
                    {category.slug !== visibleCategories[0]?.slug ? (
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={27}
                        color="#B5B5B5"
                      />
                    ) : null}
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.productsRow}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                  >
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        onAdd={addProduct}
                        onIncrement={store.incrementCartProduct}
                        onRemove={store.decrementCartProduct}
                        onPress={onOpenProduct}
                        product={product}
                        quantity={quantityByProductId.get(product.id) ?? 0}
                        width={productCardWidth}
                        layout="rail"
                      />
                    ))}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        </Animated.ScrollView>
      )}

      <Animated.View
        pointerEvents={showStickyNav ? "auto" : "none"}
        style={[
          styles.catalogNavSticky,
          {
            opacity: stickyOpacity,
            top: insets.top,
            transform: [{ translateY: stickyTranslateY }],
          },
        ]}
      >
        <Pressable onPress={onOpenSearch} style={styles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={22} color={colors.muted} />
          <Text style={styles.searchText}>Поиск</Text>
        </Pressable>
        {renderCategoryChips()}
      </Animated.View>

      <CatalogCartDock
        onOpenCart={onOpenCart}
        onOpenDeliveryInfo={onOpenDeliveryInfo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  statusBarBackdrop: {
    position: "absolute",
    zIndex: 50,
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: "#9B9B9D",
  },
  header: {
    paddingBottom: 10,
    backgroundColor: colors.white,
  },
  topRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 48,
    height: 48,
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  deliverySwitch: {
    flex: 1,
    height: 44,
    marginLeft: 2,
    marginRight: 8,
    padding: 3,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  cashbackChip: {
    height: 44,
    marginRight: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFF0E8",
  },
  cashbackText: {
    color: colors.orange,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  chipPressed: {
    opacity: 0.72,
  },
  deliverySwitchActive: {
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  deliverySwitchActiveText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  deliverySwitchOption: {
    flex: 1,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  deliverySwitchText: {
    color: "#999999",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontSize: 14,
  },
  locationRow: {
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  timeChip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  timeText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  addressChip: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.surface,
  },
  addressText: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
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
    backgroundColor: colors.white,
  },
  promotionsBlock: {
    minHeight: 168,
    paddingTop: 16,
  },
  promoRow: {
    paddingHorizontal: 16,
    gap: 9,
  },
  promoCard: {
    width: 142,
    height: 152,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.orange,
  },
  promoImage: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.86,
  },
  searchButton: {
    height: 48,
    marginHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.surface,
  },
  searchText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  catalogNav: {
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  catalogNavSticky: {
    position: "absolute",
    zIndex: 40,
    right: 0,
    left: 0,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  categoryChips: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginTop: 20,
  },
  firstSection: {
    marginTop: 4,
  },
  sections: {
    backgroundColor: colors.white,
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
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.35,
  },
  productsRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
});
