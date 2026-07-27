import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { resolveImageUrl } from "../api";
import { useStore } from "../store";
import { colors, radii } from "../theme";
import type {
  ModifierGroup,
  ModifierSelection,
  Product,
  SelectedModifier,
} from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { QuantityControl } from "./QuantityControl";
import { Sheet } from "./Sheet";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  product: Product | null;
  onClose: () => void;
  onAdded?: () => void;
};

function initialSelections(product: Product): ModifierSelection {
  const selected: ModifierSelection = {};
  for (const group of product.modifierGroups ?? []) {
    selected[group.id] = {};
    const available = group.items.filter((item) => item.enabled !== false);
    const minimum = group.required ? Math.max(1, group.minSelections ?? 1) : 0;
    if (minimum && available[0]) {
      selected[group.id][available[0].id] = Math.min(
        minimum,
        available[0].maxQuantity ?? minimum,
      );
    }
  }
  return selected;
}

function selectionCount(group: ModifierGroup, selection: ModifierSelection) {
  return Object.values(selection[group.id] ?? {}).reduce((sum, value) => sum + value, 0);
}

export function ProductSheet({ product, onClose, onAdded }: Props) {
  const store = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<ModifierSelection>({});

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setSelection(initialSelections(product));
  }, [product]);

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
    return (product.modifierGroups ?? []).every((group) => {
      const count = selectionCount(group, selection);
      const minimum = group.required ? Math.max(1, group.minSelections ?? 1) : (group.minSelections ?? 0);
      const maximum = group.selectionType === "single" ? 1 : (group.maxSelections ?? 99);
      return count >= minimum && count <= maximum;
    });
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
    onClose();
    onAdded?.();
  };

  return (
    <Sheet
      fullScreen
      visible={Boolean(product)}
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <QuantityControl minimum={1} onChange={setQuantity} value={quantity} />
          <PrimaryButton
            disabled={!valid}
            label={`Добавить · ${money(total)}`}
            onPress={add}
            style={styles.addButton}
          />
        </View>
      )}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            resizeMode="cover"
            source={{ uri: resolveImageUrl(product.image) }}
            style={styles.heroImage}
          />
          <Pressable
            accessibilityLabel="Закрыть карточку"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={23} color={colors.ink} />
          </Pressable>
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
              <View style={styles.composition}>
                <Text style={styles.compositionTitle}>Состав</Text>
                <Text style={styles.compositionText}>{product.composition}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {(product.modifierGroups ?? []).map((group) => {
          const groupCount = selectionCount(group, selection);
          const minimum = group.required ? Math.max(1, group.minSelections ?? 1) : (group.minSelections ?? 0);
          return (
            <View key={group.id} style={styles.modifierSection}>
              <View style={styles.modifierHeader}>
                <Text style={styles.modifierTitle}>{group.title}</Text>
                <Text style={[
                  styles.modifierRule,
                  groupCount < minimum && styles.modifierRuleError,
                ]}>
                  {group.required ? `Обязательно · ${minimum}` : "По желанию"}
                </Text>
              </View>
              {group.presentation === "cards" ? (
                <ScrollView
                  contentContainerStyle={styles.modifierCards}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {group.items.filter((item) => item.enabled !== false).map((item) => {
                    const current = selection[group.id]?.[item.id] ?? 0;
                    const active = current > 0;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setModifier(group, item.id, active ? 0 : 1)}
                        style={[styles.modifierCard, active && styles.modifierCardActive]}
                      >
                        <Image
                          resizeMode="cover"
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
                        key={item.id}
                        onPress={() => setModifier(group, item.id, current ? 0 : 1)}
                        style={styles.modifierRow}
                      >
                        <Image
                          resizeMode="cover"
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
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    backgroundColor: colors.surface,
  },
  hero: {
    height: 330,
    marginTop: 8,
    marginHorizontal: 10,
    borderRadius: radii.large,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
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
    margin: 10,
    marginBottom: 0,
    padding: 18,
    borderRadius: radii.medium,
    backgroundColor: colors.white,
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.55,
  },
  description: {
    marginTop: 12,
    color: "#2A2A2A",
    fontSize: 15,
    lineHeight: 21,
  },
  nutritionCard: {
    margin: 10,
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
    fontSize: 15,
  },
  nutritionLabel: {
    marginTop: 3,
    color: "#A0A0A0",
    fontSize: 10,
  },
  composition: {
    width: "100%",
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  compositionTitle: {
    color: colors.ink,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  compositionText: {
    marginTop: 6,
    color: colors.muted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
  },
  modifierSection: {
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  modifierHeader: {
    paddingHorizontal: 18,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  modifierTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  modifierRule: {
    color: colors.muted,
    fontSize: 11,
  },
  modifierRuleError: {
    color: colors.orange,
  },
  modifierCards: {
    paddingHorizontal: 18,
    gap: 9,
  },
  modifierCard: {
    width: 126,
    minHeight: 176,
    padding: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
  },
  modifierCardActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  modifierImage: {
    width: "100%",
    height: 102,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  modifierCardName: {
    marginTop: 7,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
  },
  modifierPrice: {
    marginTop: "auto",
    color: colors.muted,
    fontSize: 11,
  },
  modifierPriceActive: {
    color: colors.orange,
  },
  modifierRows: {
    paddingHorizontal: 18,
  },
  modifierRow: {
    minHeight: 64,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modifierRowImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  modifierRowCopy: {
    flex: 1,
  },
  modifierRowName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
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
  addButton: {
    flex: 1,
  },
});
