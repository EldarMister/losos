import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { catalogApi, resolveImageUrl } from "../api";
import {
  deliveryEtaLabel,
  deliveryFeeFor,
  freeDeliveryRemaining,
} from "../delivery";
import { lineTotal, useStore } from "../store";
import { colors } from "../theme";
import { formatMoney } from "../money";
import type { Category, Product } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { NumberTicker } from "./NumberTicker";
import { QuantityControl } from "./QuantityControl";
import { RipplePressable as Pressable } from "./RipplePressable";
import { Sheet } from "./Sheet";
import { SwipeDismissScrollView } from "./SwipeDismiss";

const money = formatMoney;

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
  const [draftNoUtensils, setDraftNoUtensils] = useState(store.noUtensils);
  const [draftUtensilsCount, setDraftUtensilsCount] = useState(store.utensilsCount);

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
    if (!kitVisible) return;
    setDraftNoUtensils(store.noUtensils);
    setDraftUtensilsCount(store.utensilsCount);
  }, [kitVisible, store.noUtensils, store.utensilsCount]);

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
    if (merch.length) return merch.slice(0, 8);
    return others
      .filter((product) => /соус|напит|десерт|закуск|васаби|имбир/i.test(product.name))
      .slice(0, 8);
  }, [categories, store.cart]);
  const extraProducts = useMemo(() => (
    categories
      .filter((category) => (
        /топпинг|соус|добав|васаби|имбир/i.test(`${category.slug} ${category.title}`)
      ))
      .flatMap((category) => category.products)
      .filter((product) => product.available !== false)
  ), [categories]);
  const freeEquipment = useMemo(() => {
    const products = categories.flatMap((category) => category.products);
    return [
      {
        name: "Васаби",
        quantity: 1,
        product: products.find((product) => /^васаби$/i.test(product.name)),
      },
      {
        name: "Соус соевый",
        quantity: 2,
        product: products.find((product) => /^соус соевый$/i.test(product.name)),
      },
      {
        name: "Имбирь",
        quantity: 1,
        product: products.find((product) => /имбир/i.test(product.name)),
      },
    ];
  }, [categories]);

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
  const region = store.activeRegion;
  const etaLabel = deliveryEtaLabel(region);
  const deliveryFee = deliveryFeeFor(region, store.cartTotal, store.deliveryType);
  const remainingForFreeDelivery = freeDeliveryRemaining(region, store.cartTotal);

  return (
    <>
      <Sheet
        fullScreen
        visible={visible}
        onClose={onClose}
        footer={store.cart.length ? (
          <View style={styles.footer}>
            <View style={styles.deliveryHint}>
              {store.deliveryType === "pickup"
                ? <Text style={styles.deliveryHintText}>Самовывоз из выбранной кухни</Text>
                : remainingForFreeDelivery > 0
                  ? <>
                      <Text style={styles.deliveryHintText}>Доставка </Text>
                      <NumberTicker format={money} height={15} style={styles.deliveryHintText} value={deliveryFee} />
                      <Text style={styles.deliveryHintText}> • До бесплатной </Text>
                      <NumberTicker format={money} height={15} style={styles.deliveryHintText} value={remainingForFreeDelivery} />
                    </>
                  : <Text style={styles.deliveryHintText}>Доставка • Бесплатно</Text>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`К оформлению, ${money(store.cartTotal)}`}
              onPress={onCheckout}
              style={({ pressed }) => [styles.checkoutBar, pressed && styles.pressed]}
            >
              <NumberTicker
                accessibilityLabel={`Сумма корзины: ${money(store.cartTotal)}`}
                format={money}
                height={21}
                style={styles.checkoutSide}
                value={store.cartTotal}
              />
              <Text style={styles.checkoutLabel}>К оформлению</Text>
              <Text style={styles.checkoutSide}>
                {store.deliveryType === "pickup" ? "Самовывоз" : etaLabel}
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
          <SwipeDismissScrollView
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
                      resizeMethod="resize"
                      source={{ uri: resolveImageUrl(line.product.image) }}
                      style={styles.image}
                    />
                    <View style={styles.lineCopy}>
                      <Text numberOfLines={2} style={styles.lineName}>{line.product.name}</Text>
                      <Text numberOfLines={2} style={styles.modifiers}>{detail}</Text>
                      <View style={styles.lineBottom}>
                        <NumberTicker
                          format={money}
                          height={21}
                          style={styles.price}
                          value={lineTotal(line)}
                        />
                        <QuantityControl
                          bare
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
                  accessibilityLabel="Промокоды пока недоступны"
                  onPress={() => Alert.alert(
                    "Промокоды скоро появятся",
                    "Сейчас промокод не применяется и не меняет стоимость заказа.",
                  )}
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
                        resizeMethod="resize"
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
          </SwipeDismissScrollView>
        )}
      </Sheet>

      <Sheet height="84%" visible={kitVisible} onClose={() => setKitVisible(false)}>
        <View style={styles.kitContent}>
          <Text style={styles.kitTitle}>Комплектация</Text>
          <Text style={styles.freeTitle}>Бесплатно</Text>
          <View style={styles.freeList}>
            {freeEquipment.map((item) => (
              <View key={item.name} style={styles.freeRow}>
                {item.product ? (
                  <Image
                    resizeMethod="resize"
                    resizeMode="cover"
                    source={{ uri: resolveImageUrl(item.product.image) }}
                    style={styles.kitIcon}
                  />
                ) : (
                  <View style={styles.kitIcon}>
                    <MaterialCommunityIcons name="bowl-mix-outline" size={25} color="#A2A2A2" />
                  </View>
                )}
                <View style={styles.kitCopy}>
                  <Text style={styles.kitItemTitle}>{item.name}</Text>
                  <Text style={styles.kitItemSubtitle}>{item.quantity} шт</Text>
                </View>
                <View style={styles.lockButton}>
                  <MaterialCommunityIcons name="lock" size={18} color="#9C9C9C" />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.kitSectionHeader}>
            <Text style={styles.kitSectionTitle}>Приборы</Text>
            <View style={styles.noUtensils}>
              <Text style={[
                styles.noUtensilsText,
                draftNoUtensils && styles.noUtensilsTextActive,
              ]}>Без приборов</Text>
              <Switch
                onValueChange={setDraftNoUtensils}
                thumbColor={colors.white}
                trackColor={{ false: "#E5E5E7", true: colors.orange }}
                value={draftNoUtensils}
              />
            </View>
          </View>
          <View style={styles.kitRow}>
            <View style={styles.kitIcon}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={25} color="#A2A2A2" />
            </View>
            <View style={styles.kitCopy}>
              <Text style={styles.kitItemTitle}>Палочки</Text>
              <Text style={styles.kitItemSubtitle}>
                {draftNoUtensils ? "0 шт" : "и салфетки"}
              </Text>
            </View>
            {draftNoUtensils ? (
              <Pressable
                accessibilityLabel="Добавить приборы"
                accessibilityRole="button"
                onPress={() => {
                  setDraftNoUtensils(false);
                  setDraftUtensilsCount(Math.max(1, draftUtensilsCount));
                }}
                style={styles.kitPlus}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#A2A2A2" />
              </Pressable>
            ) : (
              <QuantityControl
                bare
                compact
                maximum={10}
                minimum={1}
                onChange={setDraftUtensilsCount}
                value={draftUtensilsCount}
              />
            )}
          </View>

          <Text style={[styles.kitSectionTitle, styles.extraTitle]}>Дополнительно</Text>
          <View style={styles.kitRow}>
            <View style={styles.kitIcon}>
              {freeEquipment[1]?.product ? (
                <Image
                  resizeMethod="resize"
                  resizeMode="cover"
                  source={{ uri: resolveImageUrl(freeEquipment[1].product.image) }}
                  style={styles.kitIconImage}
                />
              ) : (
                <MaterialCommunityIcons name="bowl-mix-outline" size={27} color={colors.ink} />
              )}
            </View>
            <View style={styles.kitCopy}>
              <Text style={styles.kitItemTitle}>Топпинги</Text>
              <Text style={styles.kitItemSubtitle}>и прочее</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Открыть дополнения"
              onPress={() => {
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
              onPress={() => {
                store.setNoUtensils(draftNoUtensils);
                store.setUtensilsCount(draftUtensilsCount);
                setKitVisible(false);
              }}
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

      <Sheet height="57%" visible={extrasVisible} onClose={() => setExtrasVisible(false)}>
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
                  resizeMethod="resize"
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
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  trashButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
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
    backgroundColor: colors.white,
  },
  line: {
    minHeight: 132,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    gap: 16,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  lineCopy: {
    flex: 1,
    minHeight: 100,
  },
  lineName: {
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 19,
  },
  modifiers: {
    marginTop: 2,
    color: "#A2A2A2",
    fontSize: 12,
    lineHeight: 16,
  },
  lineBottom: {
    marginTop: 16,
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
    minHeight: 72,
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
    minWidth: 112,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    overflow: "hidden",
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
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  recommendationRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  recommendationCard: {
    width: 156,
    height: 266,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  recommendationImage: {
    width: "100%",
    height: 156,
    backgroundColor: colors.white,
  },
  recommendationName: {
    minHeight: 38,
    marginTop: 10,
    marginHorizontal: 16,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
  },
  recommendationBottom: {
    marginTop: "auto",
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recommendationPrice: {
    color: colors.ink,
    fontSize: 15,
  },
  recommendationAdd: {
    width: 40,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  footer: {
    paddingBottom: 2,
  },
  deliveryHint: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  deliveryHintText: {
    color: "#777777",
    fontSize: 12,
  },
  checkoutBar: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.orange,
    overflow: "hidden",
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
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 4,
  },
  kitTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    lineHeight: 36,
  },
  freeTitle: {
    marginTop: 22,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    lineHeight: 24,
  },
  freeList: {
    marginTop: 8,
  },
  freeRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  kitSectionHeader: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kitSectionTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 19,
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
  noUtensilsTextActive: {
    color: colors.ink,
  },
  kitRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kitIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  kitIconImage: {
    width: "100%",
    height: "100%",
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
    marginTop: 8,
  },
  kitPlus: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  lockButton: {
    width: 42,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  kitActions: {
    marginTop: "auto",
    gap: 10,
  },
  extrasContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 4,
  },
  extrasTitle: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 30,
  },
  extrasSubtitle: {
    marginTop: 10,
    color: colors.ink,
    fontSize: 15,
  },
  extrasRow: {
    paddingTop: 18,
    paddingBottom: 18,
    gap: 14,
  },
  extraCard: {
    width: 180,
    height: 306,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  extraImage: {
    width: "100%",
    height: 180,
    backgroundColor: colors.white,
  },
  extraName: {
    minHeight: 42,
    marginTop: 12,
    marginHorizontal: 16,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 18,
  },
});
