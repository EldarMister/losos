import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { catalogApi, resolveImageUrl } from "../api";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type {
  ModifierGroup,
  ModifierSelection,
  Product,
  SelectedModifier,
} from "../types";
import { QuantityControl } from "./QuantityControl";
import { NumberTicker } from "./NumberTicker";
import { Sheet } from "./Sheet";
import { SwipeDismissScrollView } from "./SwipeDismiss";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdded?: () => void;
  onOpenProduct?: (product: Product) => void;
};

export function initialModifierSelections(product: Product): ModifierSelection {
  const selected: ModifierSelection = {};
  for (const group of product.modifierGroups ?? []) {
    selected[group.id] = {};
  }
  return selected;
}

function selectionCount(group: ModifierGroup, selection: ModifierSelection) {
  return Object.values(selection[group.id] ?? {}).reduce((sum, value) => sum + value, 0);
}

export function isModifierSelectionValid(
  product: Product,
  selection: ModifierSelection,
) {
  return (product.modifierGroups ?? []).every((group) => {
    const count = selectionCount(group, selection);
    const minimum = group.required
      ? Math.max(1, group.minSelections ?? 1)
      : (group.minSelections ?? 0);
    const maximum = group.selectionType === "single"
      ? 1
      : (group.maxSelections ?? 99);
    return count >= minimum && count <= maximum;
  });
}

function RelatedProductCard({
  product,
  onAdd,
  onPress,
}: {
  product: Product;
  onAdd: () => void;
  onPress: () => void;
}) {
  return (
    <View style={styles.relatedCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть ${product.name}`}
        onPress={onPress}
      >
        <Image
          resizeMode="cover"
          resizeMethod="resize"
          source={{ uri: resolveImageUrl(product.image) }}
          style={styles.relatedImage}
        />
        <Text numberOfLines={2} style={styles.relatedName}>{product.name}</Text>
      </Pressable>
      <View style={styles.relatedBottom}>
        <Text style={styles.relatedPrice}>{money(product.price)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Добавить ${product.name}`}
          hitSlop={7}
          onPress={onAdd}
          style={styles.relatedAdd}
        >
          <MaterialCommunityIcons name="plus" size={21} color={colors.orange} />
        </Pressable>
      </View>
    </View>
  );
}

export function ProductSheet({
  product,
  onClose,
  onAdded,
  onOpenProduct,
}: Props) {
  const store = useStore();
  const { height, width } = useWindowDimensions();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<ModifierSelection>({});
  const [detailView, setDetailView] = useState<"composition" | "equipment" | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [sheetVisible, setSheetVisible] = useState(Boolean(product));
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!product) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSheetVisible(true);
    setQuantity(1);
    setSelection(initialModifierSelections(product));
    setDetailView(null);
  }, [product]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!product) {
      setRelatedProducts([]);
      return undefined;
    }
    setRelatedProducts([]);
    let ignore = false;
    const task = InteractionManager.runAfterInteractions(() => {
      catalogApi.categories(store.regionSlug)
        .then((categories) => {
          if (ignore) return;
          const accessoryCategories = categories.filter((category) => (
            /соус|добав|напит|десерт|закуск/i.test(category.title)
          ));
          const candidates = (
            accessoryCategories.length ? accessoryCategories : categories
          ).flatMap((category) => category.products);
          const unique = candidates.filter((candidate, index, items) => (
            candidate.id !== product.id
            && candidate.available !== false
            && items.findIndex((item) => item.id === candidate.id) === index
          ));
          setRelatedProducts(unique.slice(0, 8));
        })
        .catch(() => {
          if (!ignore) setRelatedProducts([]);
        });
    });
    return () => {
      ignore = true;
      task.cancel();
    };
  }, [product, store.regionSlug]);

  const modifiers = useMemo<SelectedModifier[]>(() => {
    if (!product) return [];
    return (product.modifierGroups ?? []).flatMap((group) => (
      group.items.flatMap((item) => {
        const itemQuantity = selection[group.id]?.[item.id] ?? 0;
        if (!itemQuantity) return [];
        return [{
          groupId: group.id,
          groupTitle: group.title,
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          quantity: itemQuantity,
          priceScope: group.priceScope ?? "per-product",
        }];
      })
    ));
  }, [product, selection]);

  const valid = useMemo(() => {
    if (!product) return false;
    return isModifierSelectionValid(product, selection);
  }, [product, selection]);

  const total = useMemo(() => {
    if (!product) return 0;
    const extras = modifiers.reduce((sum, modifier) => (
      sum + modifier.price
        * modifier.quantity
        * (modifier.priceScope === "per-product" ? quantity : 1)
    ), 0);
    return product.price * quantity + extras;
  }, [modifiers, product, quantity]);

  if (!product) return null;

  const setModifier = (
    group: ModifierGroup,
    itemId: string,
    nextQuantity: number,
  ) => {
    setSelection((current) => {
      const groupSelection = group.selectionType === "single"
        ? {}
        : { ...(current[group.id] ?? {}) };
      if (nextQuantity <= 0) delete groupSelection[itemId];
      else groupSelection[itemId] = nextQuantity;
      return { ...current, [group.id]: groupSelection };
    });
  };

  const add = () => {
    store.addCartLine(product, quantity, modifiers);
    close();
    onAdded?.();
  };
  const close = () => {
    if (!sheetVisible) return;
    setDetailView(null);
    setSheetVisible(false);
    closeTimer.current = setTimeout(onClose, 210);
  };
  const heroHeight = Math.min(width, height * 0.58);

  const hasEquipment = Boolean(product.composition)
    && !/соус|васаби|имбир|напит|кола|фанта|вода|морс|сок|чай/i.test(product.name);
  const detailTitle = detailView === "equipment" ? "Комплектация" : "Состав";
  const detailCopy = product.composition || product.description || "Состав уточняется.";
  const equipment = [
    {
      name: "Васаби",
      quantity: 1,
      product: relatedProducts.find((item) => /^васаби$/i.test(item.name)),
    },
    {
      name: "Соус соевый",
      quantity: 2,
      product: relatedProducts.find((item) => /^соус соевый$/i.test(item.name)),
    },
    {
      name: "Имбирь",
      quantity: 1,
      product: relatedProducts.find((item) => /имбир/i.test(item.name)),
    },
  ];

  return (
    <>
      <Sheet
        fullScreen
        height="83%"
        visible={sheetVisible}
        onClose={close}
        footer={(
          <View style={styles.footerRow}>
            <QuantityControl
              minimum={1}
              onChange={setQuantity}
              style={styles.productQuantity}
              value={quantity}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={valid ? `Добавить, ${money(total)}` : "Выберите модификации"}
              disabled={!valid}
              onPress={add}
              style={({ pressed }) => [
                styles.addButton,
                !valid && styles.addButtonDisabled,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Text style={styles.addButtonLabel}>
                {valid ? "Добавить" : "Выберите модификации"}
              </Text>
              {valid ? (
                <NumberTicker
                  accessibilityLabel={`Стоимость: ${money(total)}`}
                  format={money}
                  height={20}
                  style={styles.addButtonPrice}
                  value={total}
                />
              ) : null}
            </Pressable>
          </View>
        )}
      >
        <SwipeDismissScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, { height: heroHeight }]}>
            <Image
              resizeMode="cover"
              resizeMethod="resize"
              source={{ uri: resolveImageUrl(product.image) }}
              style={styles.heroImage}
            />
            {product.isNew ? (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>НОВИНКА</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.title}>{product.name}</Text>
            {product.description ? (
              <Text style={styles.description}>{product.description}</Text>
            ) : null}
          </View>

          {product.weight || product.calories || product.protein || product.fat || product.carbs ? (
            <View style={styles.nutritionCard}>
              {[
                [product.weight, "грамм"],
                [product.calories, "ккал"],
                [product.protein, "белки"],
                [product.fat, "жиры"],
                [product.carbs, "углеводы"],
              ].map(([value, label]) => (
                <View key={label} style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{value || "—"}</Text>
                  <Text style={styles.nutritionLabel}>{label}</Text>
                </View>
              ))}
              {product.composition ? (
                <View style={styles.compositionActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Открыть состав"
                    onPress={() => setDetailView("composition")}
                    style={styles.composition}
                  >
                    <Text style={styles.compositionTitle}>Состав</Text>
                  </Pressable>
                  {hasEquipment ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Открыть комплектацию"
                      onPress={() => setDetailView("equipment")}
                      style={styles.composition}
                    >
                      <Text style={styles.compositionTitle}>Комплектация</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}

          {relatedProducts.length ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Вместе вкуснее</Text>
              <ScrollView
                contentContainerStyle={styles.relatedRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {relatedProducts.map((relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct.id}
                    onAdd={() => {
                      if (relatedProduct.modifierGroups?.some((group) => group.required)) {
                        onOpenProduct?.(relatedProduct);
                      } else {
                        store.addCartLine(relatedProduct, 1, []);
                      }
                    }}
                    onPress={() => onOpenProduct?.(relatedProduct)}
                    product={relatedProduct}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {(product.modifierGroups ?? []).map((group) => {
          const groupCount = selectionCount(group, selection);
          return (
            <View key={group.id} style={styles.modifierSection}>
              <View style={styles.modifierHeader}>
                <Text style={styles.modifierTitle}>{group.title}</Text>
              </View>
              {group.presentation === "cards" || group.selectionType === "single" ? (
                <ScrollView
                  contentContainerStyle={styles.modifierCards}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {!group.required ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Не выбирать: ${group.title}`}
                      onPress={() => setSelection((current) => ({
                        ...current,
                        [group.id]: {},
                      }))}
                      style={[
                        styles.modifierCard,
                        groupCount === 0 && styles.modifierCardActive,
                      ]}
                    >
                      <View style={[styles.modifierImage, styles.emptyModifierImage]}>
                        <MaterialCommunityIcons
                          name="cancel"
                          size={55}
                          color="#D5D5D5"
                        />
                      </View>
                      <Text numberOfLines={2} style={styles.modifierCardName}>Не выбран</Text>
                      <Text
                        style={[
                          styles.modifierPrice,
                          groupCount === 0 && styles.modifierPriceActive,
                        ]}
                      >
                        0 сом
                      </Text>
                    </Pressable>
                  ) : null}
                  {group.items.filter((item) => item.enabled !== false).map((item) => {
                    const current = selection[group.id]?.[item.id] ?? 0;
                    const active = current > 0;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${active ? "Убрать" : "Выбрать"} ${item.name}`}
                        key={item.id}
                        onPress={() => setModifier(
                          group,
                          item.id,
                          active && !group.required ? 0 : 1,
                        )}
                        style={[styles.modifierCard, active && styles.modifierCardActive]}
                      >
                        <Image
                          resizeMode="cover"
                          resizeMethod="resize"
                          source={{ uri: resolveImageUrl(item.image) }}
                          style={styles.modifierImage}
                        />
                        <Text numberOfLines={2} style={styles.modifierCardName}>
                          {item.name}
                        </Text>
                        <Text style={[styles.modifierPrice, active && styles.modifierPriceActive]}>
                          {item.price ? `+${money(item.price)}` : "0 сом"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.modifierRows}>
                  {group.items.filter((item) => item.enabled !== false).map((item) => {
                    const current = selection[group.id]?.[item.id] ?? 0;
                    const maximum = Math.min(
                      item.maxQuantity ?? (group.selectionType === "single" ? 1 : 20),
                      group.maxSelections ?? 99,
                    );
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${current ? "Убрать" : "Выбрать"} ${item.name}`}
                        key={item.id}
                        onPress={() => setModifier(
                          group,
                          item.id,
                          current && !group.required ? 0 : 1,
                        )}
                        style={styles.modifierRow}
                      >
                        <Image
                          resizeMode="cover"
                          resizeMethod="resize"
                          source={{ uri: resolveImageUrl(item.image) }}
                          style={styles.modifierRowImage}
                        />
                        <View style={styles.modifierRowCopy}>
                          <Text style={styles.modifierRowName}>{item.name}</Text>
                          <Text style={styles.modifierRowPrice}>
                            {item.price ? `+${money(item.price)}` : "Без доплаты"}
                          </Text>
                        </View>
                        {group.selectionType === "single" ? (
                          <View style={[styles.radio, current > 0 && styles.radioActive]}>
                            {current > 0 ? <View style={styles.radioInner} /> : null}
                          </View>
                        ) : current > 0 ? (
                          <QuantityControl
                            compact
                            maximum={maximum}
                            onChange={(value) => setModifier(group, item.id, value)}
                            value={current}
                          />
                        ) : (
                          <View style={styles.plus}>
                            <MaterialCommunityIcons name="plus" size={21} color={colors.muted} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
          })}
        </SwipeDismissScrollView>
      </Sheet>
      <Sheet
        height={detailView === "equipment" ? "39%" : "60%"}
        onClose={() => setDetailView(null)}
        visible={detailView !== null}
        footer={detailView === "composition" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDetailView(null)}
            style={styles.detailButton}
          >
            <Text style={styles.detailButtonText}>Понятно</Text>
          </Pressable>
        ) : undefined}
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{detailTitle}</Text>
        </View>
        <SwipeDismissScrollView
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          {detailView === "equipment" ? (
            <View style={styles.equipmentList}>
              {equipment.map((item) => (
                <View key={item.name} style={styles.equipmentRow}>
                  {item.product ? (
                    <Image
                      resizeMode="cover"
                      resizeMethod="resize"
                      source={{ uri: resolveImageUrl(item.product.image) }}
                      style={styles.equipmentImage}
                    />
                  ) : (
                    <View style={[styles.equipmentImage, styles.equipmentFallback]}>
                      <MaterialCommunityIcons
                        name="food-variant"
                        size={25}
                        color={colors.orange}
                      />
                    </View>
                  )}
                  <View style={styles.equipmentCopy}>
                    <Text style={styles.equipmentName}>{item.name}</Text>
                    <Text style={styles.equipmentQuantity}>{item.quantity} шт</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.detailCopy}>{detailCopy}</Text>
          )}
        </SwipeDismissScrollView>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    backgroundColor: colors.surface,
  },
  hero: {
    marginTop: 0,
    borderRadius: radii.large,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  newBadge: {
    position: "absolute",
    left: 13,
    top: 13,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: colors.orange,
  },
  newText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900",
  },
  infoCard: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: radii.medium,
    backgroundColor: colors.white,
  },
  title: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.55,
  },
  description: {
    marginTop: 12,
    color: "#2A2A2A",
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
  },
  nutritionCard: {
    margin: 16,
    padding: 15,
    borderRadius: radii.medium,
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.white,
  },
  nutritionItem: {
    width: "20%",
    alignItems: "center",
  },
  nutritionValue: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  nutritionLabel: {
    marginTop: 3,
    color: "#A0A0A0",
    fontSize: 10,
  },
  compositionActions: {
    width: "100%",
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  composition: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  compositionTitle: {
    color: colors.ink,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  relatedSection: {
    paddingTop: 19,
    paddingBottom: 20,
    backgroundColor: colors.surface,
  },
  relatedTitle: {
    paddingHorizontal: 18,
    marginBottom: 12,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  relatedRow: {
    paddingHorizontal: 18,
    gap: 10,
  },
  relatedCard: {
    width: 164,
    minHeight: 238,
    padding: 9,
    borderRadius: radii.medium,
    backgroundColor: colors.white,
  },
  relatedImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  relatedName: {
    minHeight: 36,
    marginTop: 8,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  relatedBottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  relatedPrice: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  relatedAdd: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  detailHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  detailTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    lineHeight: 38,
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  detailCopy: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  equipmentList: {
    gap: 8,
  },
  equipmentRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  equipmentImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  equipmentFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  equipmentCopy: {
    flex: 1,
  },
  equipmentName: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  equipmentQuantity: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
  },
  detailButton: {
    height: 52,
    marginHorizontal: 4,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  detailButtonText: {
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  modifierSection: {
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  modifierHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
  },
  modifierTitle: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  modifierCards: {
    height: 156,
    paddingHorizontal: 16,
    gap: 8,
  },
  modifierCard: {
    width: 108,
    height: 156,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  modifierCardActive: {
    borderColor: colors.orange,
    backgroundColor: colors.white,
  },
  modifierImage: {
    width: "100%",
    height: 92,
    backgroundColor: colors.white,
  },
  emptyModifierImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  modifierCardName: {
    marginTop: 6,
    marginHorizontal: 6,
    color: colors.ink,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 15,
  },
  modifierPrice: {
    marginTop: "auto",
    marginHorizontal: 6,
    marginBottom: 12,
    color: colors.muted,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  modifierPriceActive: {
    color: colors.orange,
  },
  modifierRows: {
    paddingHorizontal: 0,
  },
  modifierRow: {
    minHeight: 80,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modifierRowImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  modifierRowCopy: {
    flex: 1,
  },
  modifierRowName: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  modifierRowPrice: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
  },
  radio: {
    width: 23,
    height: 23,
    borderWidth: 2,
    borderColor: "#D2D2D2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  plus: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  productQuantity: {
    width: 144,
    justifyContent: "space-between",
  },
  addButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.orange,
  },
  addButtonDisabled: {
    backgroundColor: "#FF8B5B",
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.988 }],
  },
  addButtonLabel: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  addButtonPrice: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
