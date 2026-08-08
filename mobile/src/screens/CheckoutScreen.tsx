import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ordersApi } from "../api";
import { PrimaryButton } from "../components/PrimaryButton";
import { NumberTicker } from "../components/NumberTicker";
import { orderingAvailability } from "../delivery";
import { formatMoney } from "../money";
import { createOrderIdempotencyKey } from "../navigationRules";
import { useStore } from "../store";
import { colors, radii, shadow } from "../theme";
import type { CreatedOrder, OrderPayload } from "../types";

const money = formatMoney;

type Props = {
  onBack: () => void;
  onOpenLocation: () => void;
  onSuccess: (order: CreatedOrder) => void;
};

type AddressDetailProps = {
  icon: "office-building-outline" | "door-open" | "stairs";
  label: string;
  onChangeText: (value: string) => void;
  value: string;
};

function AddressDetail({ icon, label, onChangeText, value }: AddressDetailProps) {
  return (
    <View style={styles.addressDetail}>
      <MaterialCommunityIcons name={icon} size={22} color="#96989D" />
      <TextInput
        accessibilityLabel={label}
        allowFontScaling={false}
        keyboardType="number-pad"
        multiline={false}
        numberOfLines={1}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor="#93959A"
        style={styles.addressDetailInput}
        value={value}
      />
    </View>
  );
}

function formatPhoneForDisplay(phone: string) {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("996") && normalized.length === 12) {
    return `+996 ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8, 10)} ${normalized.slice(10, 12)}`;
  }
  if (normalized.startsWith("7") && normalized.length === 11) {
    return `+7 ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`;
  }
  return phone;
}

function formatKyrgyzPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");
  // Keep the country prefix intact even when Android sends a transient value
  // after Backspace. Only the nine local digits are editable on checkout.
  const local = (digits.startsWith("996") ? digits.slice(3) : digits).slice(0, 9);
  const groups = [
    local.slice(0, 3),
    local.slice(3, 5),
    local.slice(5, 7),
    local.slice(7, 9),
  ].filter(Boolean);
  return `+996${groups.length ? ` ${groups.join(" ")}` : " "}`;
}

export function CheckoutScreen({ onBack, onOpenLocation, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const scrollRef = useRef<ScrollView>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState(() => formatPhoneForDisplay(store.session?.phone ?? ""));
  const address = store.location?.address ?? "";
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(() => createOrderIdempotencyKey());
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());
  const availability = orderingAvailability(store.activeRegion, new Date(scheduleNow));
  const hasKyrgyzPhone = (store.session?.phone ?? "").replace(/\D/g, "").startsWith("996");

  useEffect(() => {
    const timer = setInterval(() => setScheduleNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const validPhone = /^\+(?:7\d{10}|996\d{9})$/.test(normalizedPhone);
  const canSubmit = (
    customerName.trim().length >= 2
    && validPhone
    && address.trim().length >= 5
    && store.cart.length > 0
    && Boolean(store.session)
    && availability.isOpen
  );

  const deliveryLabel = useMemo(
    () => store.deliveryType === "delivery" ? "Доставка" : "Самовывоз",
    [store.deliveryType],
  );
  const changePhone = (value: string) => {
    setPhone(hasKyrgyzPhone ? formatKyrgyzPhoneInput(value) : value);
  };
  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    const payload: OrderPayload = {
      idempotencyKey,
      verificationToken: store.session?.verificationToken || "",
      regionSlug: store.regionSlug,
      deliveryType: store.deliveryType,
      customerName: customerName.trim(),
      phone: normalizedPhone,
      address: address.trim(),
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      floor: floor.trim(),
      intercom: "",
      comment: comment.trim(),
      paymentMethod,
      utensilsCount: store.noUtensils ? 0 : store.utensilsCount,
      noUtensils: store.noUtensils,
      latitude: store.location?.latitude,
      longitude: store.location?.longitude,
      items: store.cart.map((line) => ({
        productId: line.product.id,
        quantity: line.quantity,
        modifiers: line.modifiers.map((modifier) => ({
          groupId: modifier.groupId,
          itemId: modifier.itemId,
          quantity: modifier.quantity,
        })),
      })),
    };
    try {
      const order = await ordersApi.create(payload);
      store.clearCart();
      onSuccess(order);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось оформить заказ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={colors.white} style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable
          accessibilityLabel="Назад в корзину"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="arrow-left" size={27} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{deliveryLabel}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 132 + Math.max(insets.bottom, 10) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.addressCard}>
            <Pressable
              accessibilityLabel="Выбрать адрес на карте"
              accessibilityRole="button"
              onPress={onOpenLocation}
              style={({ pressed }) => [styles.addressRow, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="map-marker" size={28} color={colors.orange} />
              <Text numberOfLines={1} style={[styles.addressText, !address && styles.placeholder]}>
                {address || (store.deliveryType === "delivery" ? "Улица и дом" : "Адрес кухни")}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={27} color={colors.ink} />
            </Pressable>

            {store.deliveryType === "delivery" ? (
              <View style={styles.addressDetails}>
                <AddressDetail
                  icon="office-building-outline"
                  label="Квартира"
                  onChangeText={setApartment}
                  value={apartment}
                />
                <AddressDetail
                  icon="door-open"
                  label="Подъезд"
                  onChangeText={setEntrance}
                  value={entrance}
                />
                <AddressDetail
                  icon="stairs"
                  label="Этаж"
                  onChangeText={setFloor}
                  value={floor}
                />
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>Получатель</Text>
          <View style={styles.recipientCard}>
            <View style={[styles.recipientPart, styles.recipientNamePart]}>
              <MaterialCommunityIcons name="account-outline" size={29} color={colors.ink} />
              <TextInput
                accessibilityLabel="Имя"
                allowFontScaling={false}
                multiline={false}
                numberOfLines={1}
                onChangeText={setCustomerName}
                placeholder="Имя"
                placeholderTextColor="#93959A"
                style={styles.recipientInput}
                value={customerName}
              />
            </View>
            <View style={styles.recipientDivider} />
            <View style={[styles.recipientPart, styles.recipientPhonePart]}>
              <MaterialCommunityIcons name="phone-outline" size={24} color={colors.orange} />
              <TextInput
                accessibilityLabel="Телефон"
                allowFontScaling={false}
                keyboardType="phone-pad"
                maxLength={18}
                multiline={false}
                numberOfLines={1}
                onChangeText={changePhone}
                placeholder="+996 000 00 00 00"
                placeholderTextColor="#93959A"
                style={styles.phoneInput}
                value={phone}
              />
            </View>
          </View>
          {phone.length > 4 && !validPhone ? (
            <Text style={styles.validation}>Введите номер Кыргызстана или России полностью.</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Оплата</Text>
          <View style={styles.paymentRow}>
            {([
              ["cash", "Наличными", "cash-multiple"],
              ["card", "Картой", "credit-card-outline"],
            ] as const).map(([value, label, icon]) => {
              const selected = paymentMethod === value;
              return (
                <Pressable
                  accessibilityLabel={label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={value}
                  onPress={() => setPaymentMethod(value)}
                  style={({ pressed }) => [
                    styles.paymentChoice,
                    selected && styles.paymentChoiceSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={27}
                    color={selected ? colors.orange : colors.ink}
                  />
                  <Text numberOfLines={1} style={styles.paymentLabel}>{label}</Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.commentField}>
            <MaterialCommunityIcons
              name="message-text-outline"
              size={23}
              color="#96989D"
              style={styles.commentIcon}
            />
            <TextInput
              accessibilityLabel="Комментарий"
              multiline
              onChangeText={setComment}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
              }}
              placeholder="Пожелания к заказу"
              placeholderTextColor="#93959A"
              style={styles.commentInput}
              value={comment}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={21} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {!availability.isOpen ? (
            <View style={styles.closedBox}>
              <MaterialCommunityIcons name="clock-alert-outline" size={21} color={colors.orange} />
              <Text style={styles.closedText}>
                Кухня сейчас закрыта. {availability.nextOpenLabel}.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[
          styles.footer,
          { bottom: Math.max(insets.bottom, 8) },
        ]}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>Итого</Text>
            <NumberTicker
              accessibilityLabel={`Итого: ${money(store.cartTotal)}`}
              format={money}
              height={29}
              style={styles.total}
              value={store.cartTotal}
            />
          </View>
          <PrimaryButton
            disabled={!canSubmit}
            label={availability.isOpen ? "Заказать" : "Кухня закрыта"}
            loading={submitting}
            onPress={() => void submit()}
            style={styles.submit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  backButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    paddingHorizontal: 16,
  },
  addressCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  addressRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addressText: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
  },
  placeholder: {
    color: "#93959A",
  },
  addressDetails: {
    marginTop: 12,
    flexDirection: "row",
    gap: 9,
  },
  addressDetail: {
    flex: 1,
    height: 58,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addressDetailInput: {
    flex: 1,
    minWidth: 0,
    height: 56,
    paddingHorizontal: 0,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 34,
    marginBottom: 14,
    marginLeft: 2,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    lineHeight: 27,
  },
  recipientCard: {
    minHeight: 88,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  recipientPart: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recipientNamePart: {
    flex: 0.72,
  },
  recipientPhonePart: {
    flex: 1.28,
  },
  recipientInput: {
    flex: 1,
    minWidth: 0,
    height: 70,
    paddingHorizontal: 0,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 21,
  },
  recipientDivider: {
    width: StyleSheet.hairlineWidth,
    height: 58,
    marginHorizontal: 9,
    backgroundColor: colors.border,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    height: 70,
    paddingHorizontal: 0,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 21,
  },
  validation: {
    marginTop: 8,
    marginHorizontal: 4,
    color: colors.danger,
    fontSize: 11,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 10,
  },
  paymentChoice: {
    flex: 1,
    height: 72,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.white,
  },
  paymentChoiceSelected: {
    borderColor: colors.orange,
    backgroundColor: "#FFF9F5",
  },
  paymentLabel: {
    flex: 1,
    color: colors.ink,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#D2D3D6",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  commentField: {
    minHeight: 76,
    marginTop: 26,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.white,
  },
  commentIcon: {
    marginTop: 24,
  },
  commentInput: {
    flex: 1,
    minHeight: 74,
    paddingTop: 25,
    paddingBottom: 18,
    paddingHorizontal: 0,
    color: colors.ink,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
  errorBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF0F0",
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  closedBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#FFF3EC",
  },
  closedText: {
    flex: 1,
    color: colors.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    position: "absolute",
    right: 16,
    left: 16,
    minHeight: 96,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    ...shadow,
  },
  totalBlock: {
    minWidth: 112,
  },
  totalLabel: {
    color: colors.muted,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  total: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    lineHeight: 29,
  },
  submit: {
    flex: 1,
    minHeight: 62,
    borderRadius: radii.medium,
    backgroundColor: colors.orange,
  },
  pressed: {
    opacity: 0.72,
  },
});
