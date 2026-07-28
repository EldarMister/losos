import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { catalogApi, resolveImageUrl } from "../api";
import { lineTotal, useStore } from "../store";
import { colors, radii } from "../theme";
import type { Category, Product } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { QuantityControl } from "./QuantityControl";
import { Sheet } from "./Sheet";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export function CartSheet({ visible, onClose, onCheckout }: Props) {
  const store = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [kitVisible, setKitVisible] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);

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

  const recommendations = useMemo(() => {
    const inCart = new Set(store.cart.map((line) => line.product.id));
    const eligible = (product: Product) => (
      product.available !== false
      && !inCart.has(product.id)
      && !product.modifierGroups?.some((group) => group.required)
    );
    const merch = categories
      .filter((category) => /мерч|добав/i.test(`${category.slug} ${category.title}`))
      .flatMap((category) => category.products)
      .filter(eligible);
    const others = categories
      .flatMap((category) => category.products)
      .filter(eligible)
      .filter((product) => !merch.some((item) => item.id === product.id));
    return [...merch, ...others].slice(0, 8);
  }, [categories, store.cart]);
  const extraProducts = useMemo(() => (
    categories
      .filter((category) => /топпинг/i.test(`${category.slug} ${category.title}`))
      .flatMap((category) => category.products)
      .filter((product) => product.available !== false)
  ), [categories]);

  const clear = () => {
    Alert.alert(
      "Очистить корзину?",
      "Все выбранные блюда и добавки будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Очистить", style: "destructive", onPress: store.clearCart },
      ],
    );
  };

  const kitSummary = store.noUtensils
    ? "без приборов"
    : `${store.utensilsCount} ${store.utensilsCount === 1 ? "комплект" : "комплекта"}`;

  return (
    <>
      <Sheet
        fullScreen
        visible={visible}
        onClose={onClose}
        footer={store.cart.length ? (
          <View style={styles.footer}>
            <Text style={styles.deliveryHint}>
              Доставка 99 сом · До бесплатной 2 633 сом
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`К оформлению, ${money(store.cartTotal)}`}
              onPress={onCheckout}
              style={({ pressed }) => [styles.checkoutBar, pressed && styles.pressed]}
            >
              <Text style={styles.checkoutSide}>{money(store.cartTotal)}</Text>
              <Text style={styles.checkoutLabel}>К оформлению</Text>
              <Text style={styles.checkoutSide}>
                {store.deliveryType === "delivery" ? "~70 мин" : "~25 мин"}
              </Text>
            </Pressable>
          </View>
        ) : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Корзина</Text>
          <Pressable
            accessibilityLabel="Очистить корзину"
            disabled={!store.cart.length}
            hitSlop={8}
            onPress={clear}
            style={({ pressed }) => [
              styles.trashButton,
              !store.cart.length && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={25} color="#969696" />
          </Pressable>
        </View>

        {!store.cart.length ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="shopping-outline" size={48} color={colors.orange} />
            </View>
            <Text style={styles.emptyTitle}>Пока пусто</Text>
            <Text style={styles.emptyText}>Добавьте блюда из каталога — всё появится здесь.</Text>
            <PrimaryButton
              label="Вернуться в каталог"
              onPress={onClose}
              style={styles.emptyButton}
              tone="black"
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.lines}>
              {store.cart.map((line) => {
                const detail = line.modifiers.length
                  ? line.modifiers.map((modifier) => (
                    `${modifier.itemName}${modifier.quantity > 1 ? ` × ${modifier.quantity}` : ""}`
                  )).join(", ")
                  : line.product.description || "Стандартная комплектация";
                return (
                  <View key={line.key} style={styles.line}>
                    <Image
                      resizeMode="cover"
                      source={{ uri: resolveImageUrl(line.product.image) }}
                      style={styles.image}
                    />
                    <View style={styles.lineCopy}>
                      <Text numberOfLines={2} style={styles.lineName}>{line.product.name}</Text>
                      <Text numberOfLines={2} style={styles.modifiers}>{detail}</Text>
                      <View style={styles.lineBottom}>
                        <Text style={styles.price}>{money(lineTotal(line))}</Text>
                        <QuantityControl
                          compact
                          onChange={(value) => store.setCartQuantity(line.key, value)}
                          value={line.quantity}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.options}>
              <View style={styles.optionRow}>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>Комплектация</Text>
                  <Text style={styles.optionSubtitle}>{kitSummary}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setKitVisible(true)}
                  style={({ pressed }) => [styles.optionAction, pressed && styles.pressed]}
                >
                  <Text style={styles.optionActionText}>Управлять</Text>
                </Pressable>
              </View>
              <View style={styles.optionDivider} />
              <View style={styles.optionRow}>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>Промокод</Text>
                  <Text style={styles.optionSubtitle}>или скидка</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.optionAction, pressed && styles.pressed]}
                >
                  <Text style={styles.optionActionText}>Ввести</Text>
                </Pressable>
              </View>
            </View>

            {recommendations.length ? (
              <View style={styles.recommendationSection}>
                <Text style={styles.recommendationTitle}>Добавить к заказу?</Text>
                <ScrollView
                  contentContainerStyle={styles.recommendationRow}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {recommendations.map((product) => (
                    <View key={product.id} style={styles.recommendationCard}>
                      <Image
                        resizeMode="cover"
                        source={{ uri: resolveImageUrl(product.image) }}
                        style={styles.recommendationImage}
                      />
                      <Text numberOfLines={2} style={styles.recommendationName}>
                        {product.name}
                      </Text>
                      <View style={styles.recommendationBottom}>
                        <Text style={styles.recommendationPrice}>{money(product.price)}</Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Добавить ${product.name}`}
                          onPress={() => store.addCartLine(product, 1, [])}
                          style={({ pressed }) => [
                            styles.recommendationAdd,
                            pressed && styles.pressed,
                          ]}
                        >
                          <MaterialCommunityIcons name="plus" size={23} color="#A6A6A6" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>
        )}
      </Sheet>

      <Sheet height="80%" visible={kitVisible} onClose={() => setKitVisible(false)}>
        <View style={styles.kitContent}>
          <Text style={styles.kitTitle}>Комплектация</Text>
          <View style={styles.kitSectionHeader}>
            <Text style={styles.kitSectionTitle}>Приборы</Text>
            <View style={styles.noUtensils}>
              <Text style={styles.noUtensilsText}>Без приборов</Text>
              <Switch
                onValueChange={store.setNoUtensils}
                thumbColor={colors.white}
                trackColor={{ false: "#E5E5E7", true: colors.orange }}
                value={store.noUtensils}
              />
            </View>
          </View>
          <View style={styles.kitRow}>
            <View style={styles.kitIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={25} color="#A2A2A2" />
            </View>
            <View style={styles.kitCopy}>
              <Text style={styles.kitItemTitle}>Палочки</Text>
              <Text style={styles.kitItemSubtitle}>и салфетки</Text>
            </View>
            <QuantityControl
              compact
              maximum={10}
              minimum={1}
              onChange={store.setUtensilsCount}
              value={store.utensilsCount}
            />
          </View>

          <Text style={[styles.kitSectionTitle, styles.extraTitle]}>Дополнительно</Text>
          <View style={styles.kitRow}>
            <View style={styles.kitIcon}>
              <MaterialCommunityIcons name="bowl-mix-outline" size={27} color={colors.ink} />
            </View>
            <View style={styles.kitCopy}>
              <Text style={styles.kitItemTitle}>Топпинги</Text>
              <Text style={styles.kitItemSubtitle}>и прочее</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Открыть дополнения"
              onPress={() => {
                setKitVisible(false);
                setExtrasVisible(true);
              }}
              style={({ pressed }) => [styles.kitPlus, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#A2A2A2" />
            </Pressable>
          </View>

          <View style={styles.kitActions}>
            <PrimaryButton
              label="Сохранить выбор"
              onPress={() => setKitVisible(false)}
              tone="black"
            />
            <PrimaryButton
              label="Отмена"
              onPress={() => setKitVisible(false)}
              tone="soft"
            />
          </View>
        </View>
      </Sheet>

      <Sheet height="70%" visible={extrasVisible} onClose={() => setExtrasVisible(false)}>
        <View style={styles.extrasContent}>
          <Text style={styles.extrasTitle}>Дополнительно</Text>
          <Text style={styles.extrasSubtitle}>Будет сразу добавлено в корзину</Text>
          <ScrollView
            contentContainerStyle={styles.extrasRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {extraProducts.map((product) => (
              <View key={product.id} style={styles.extraCard}>
                <Image
                  resizeMode="cover"
                  source={{ uri: resolveImageUrl(product.image) }}
                  style={styles.extraImage}
                />
                <Text numberOfLines={2} style={styles.extraName}>{product.name}</Text>
                <View style={styles.recommendationBottom}>
                  <Text style={styles.recommendationPrice}>{money(product.price)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Добавить ${product.name}`}
                    onPress={() => store.addCartLine(product, 1, [])}
                    style={({ pressed }) => [
                      styles.recommendationAdd,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="plus" size={23} color="#A6A6A6" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
          <PrimaryButton
            label="Назад"
            onPress={() => setExtrasVisible(false)}
            tone="soft"
          />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  trashButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.78,
  },
  content: {
    paddingBottom: 28,
    backgroundColor: "#F8F8F8",
  },
  lines: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
  },
  line: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    gap: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  lineCopy: {
    flex: 1,
    minHeight: 112,
  },
  lineName: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "500",
  },
  modifiers: {
    marginTop: 4,
    color: "#A2A2A2",
    fontSize: 12,
    lineHeight: 16,
  },
  lineBottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "500",
  },
  options: {
    backgroundColor: "#F7F7F7",
  },
  optionRow: {
    minHeight: 90,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: "#4C4C4C",
    fontSize: 15,
    fontWeight: "700",
  },
  optionSubtitle: {
    color: "#B6B6B6",
    fontSize: 12,
    fontWeight: "600",
  },
  optionAction: {
    minWidth: 118,
    height: 54,
    paddingHorizontal: 17,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  optionActionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  recommendationSection: {
    paddingTop: 22,
  },
  recommendationTitle: {
    paddingHorizontal: 20,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  recommendationRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  recommendationCard: {
    width: 156,
    minHeight: 278,
    padding: 10,
    borderRadius: radii.medium,
    backgroundColor: colors.white,
  },
  recommendationImage: {
    width: "100%",
    height: 156,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  recommendationName: {
    minHeight: 42,
    marginTop: 10,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
  },
  recommendationBottom: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recommendationPrice: {
    color: colors.ink,
    fontSize: 15,
  },
  recommendationAdd: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  footer: {
    paddingBottom: 2,
  },
  deliveryHint: {
    marginBottom: 10,
    color: "#777777",
    fontSize: 12,
  },
  checkoutBar: {
    minHeight: 66,
    paddingHorizontal: 18,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
  },
  checkoutSide: {
    width: "28%",
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  checkoutLabel: {
    flex: 1,
    color: colors.white,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
  },
  empty: {
    flex: 1,
    paddingHorizontal: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  emptyTitle: {
    marginTop: 18,
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 220,
    marginTop: 22,
  },
  kitContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 6,
  },
  kitTitle: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: "800",
  },
  kitSectionHeader: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kitSectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "800",
  },
  noUtensils: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noUtensilsText: {
    color: "#9C9C9C",
    fontSize: 14,
    fontWeight: "600",
  },
  kitRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kitIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  kitCopy: {
    flex: 1,
  },
  kitItemTitle: {
    color: colors.ink,
    fontSize: 15,
  },
  kitItemSubtitle: {
    color: "#A5A5A5",
    fontSize: 14,
  },
  extraTitle: {
    marginTop: 14,
  },
  kitPlus: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  kitActions: {
    marginTop: "auto",
    gap: 12,
  },
  extrasContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 6,
  },
  extrasTitle: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: "800",
  },
  extrasSubtitle: {
    marginTop: 10,
    color: colors.ink,
    fontSize: 15,
  },
  extrasRow: {
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  extraCard: {
    width: 172,
    minHeight: 268,
    padding: 10,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
  },
  extraImage: {
    width: "100%",
    height: 156,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  extraName: {
    minHeight: 42,
    marginTop: 10,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
  },
});
