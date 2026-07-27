import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ordersApi } from "../api";
import { PrimaryButton } from "../components/PrimaryButton";
import { QuantityControl } from "../components/QuantityControl";
import { useStore } from "../store";
import { colors, radii, shadow } from "../theme";
import type { CreatedOrder, OrderPayload } from "../types";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} сом`;

type Props = {
  onBack: () => void;
  onSuccess: (order: CreatedOrder) => void;
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  multiline?: boolean;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
      />
    </View>
  );
}

export function CheckoutScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("+996");
  const [address, setAddress] = useState(store.location?.address ?? "");
  const [apartment, setApartment] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [intercom, setIntercom] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [utensilsCount, setUtensilsCount] = useState(1);
  const [noUtensils, setNoUtensils] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const normalizedPhone = phone.replace(/[\s()-]/g, "");
  const validPhone = /^\+(?:7\d{10}|996\d{9})$/.test(normalizedPhone);
  const canSubmit = (
    customerName.trim().length >= 2 &&
    validPhone &&
    address.trim().length >= 5 &&
    store.cart.length > 0
  );

  const deliveryLabel = useMemo(
    () => store.deliveryType === "delivery" ? "Доставка" : "Самовывоз",
    [store.deliveryType],
  );

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    const payload: OrderPayload = {
      idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      regionSlug: store.regionSlug,
      deliveryType: store.deliveryType,
      customerName: customerName.trim(),
      phone: normalizedPhone,
      address: address.trim(),
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      floor: floor.trim(),
      intercom: intercom.trim(),
      comment: comment.trim(),
      paymentMethod,
      utensilsCount: noUtensils ? 0 : utensilsCount,
      noUtensils,
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
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityLabel="Назад в корзину" hitSlop={9} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={27} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Оформление</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 118 + Math.max(insets.bottom, 10) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="map-marker-outline" size={21} color={colors.orange} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{deliveryLabel}</Text>
                <Text style={styles.sectionSubtitle}>
                  {store.regionSlug === "osh" ? "Ош" : "Бишкек"}
                </Text>
              </View>
            </View>
            <FormField
              label={store.deliveryType === "delivery" ? "Адрес" : "Кухня"}
              onChangeText={setAddress}
              placeholder="Улица и дом"
              value={address}
            />
            {store.deliveryType === "delivery" ? (
              <View style={styles.inlineFields}>
                <View style={styles.inlineField}>
                  <FormField label="Квартира" onChangeText={setApartment} placeholder="—" value={apartment} />
                </View>
                <View style={styles.inlineField}>
                  <FormField label="Подъезд" onChangeText={setEntrance} placeholder="—" value={entrance} />
                </View>
                <View style={styles.inlineField}>
                  <FormField label="Этаж" onChangeText={setFloor} placeholder="—" value={floor} />
                </View>
              </View>
            ) : null}
            {store.deliveryType === "delivery" ? (
              <FormField label="Домофон" onChangeText={setIntercom} placeholder="Код или номер" value={intercom} />
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Получатель</Text>
            <FormField
              label="Имя"
              onChangeText={setCustomerName}
              placeholder="Как к вам обращаться"
              value={customerName}
            />
            <FormField
              keyboardType="phone-pad"
              label="Телефон"
              onChangeText={setPhone}
              placeholder="+996 555 123 456"
              value={phone}
            />
            {phone.length > 4 && !validPhone ? (
              <Text style={styles.validation}>Введите номер Кыргызстана или России полностью.</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Оплата</Text>
            {([
              ["cash", "Наличными", "cash-multiple"],
              ["card", "Картой при получении", "credit-card-outline"],
            ] as const).map(([value, label, icon]) => {
              const selected = paymentMethod === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setPaymentMethod(value)}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={23}
                    color={selected ? colors.orange : colors.muted}
                  />
                  <Text style={styles.choiceLabel}>{label}</Text>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Комплектация</Text>
            <View style={styles.utensilsRow}>
              <View style={styles.utensilsCopy}>
                <Text style={styles.choiceLabel}>Палочки и салфетки</Text>
                <Text style={styles.sectionSubtitle}>
                  {noUtensils ? "Без приборов" : `${utensilsCount} комплект`}
                </Text>
              </View>
              {!noUtensils ? (
                <QuantityControl
                  compact
                  maximum={10}
                  minimum={1}
                  onChange={setUtensilsCount}
                  value={utensilsCount}
                />
              ) : null}
            </View>
            <View style={styles.utensilsRow}>
              <Text style={styles.choiceLabel}>Не класть приборы</Text>
              <Switch
                onValueChange={setNoUtensils}
                thumbColor={colors.white}
                trackColor={{ false: "#DADADA", true: colors.orange }}
                value={noUtensils}
              />
            </View>
          </View>

          <View style={styles.section}>
            <FormField
              label="Комментарий"
              multiline
              onChangeText={setComment}
              placeholder="Пожелания к заказу"
              value={comment}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={21} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View>
            <Text style={styles.totalLabel}>Итого</Text>
            <Text style={styles.total}>{money(store.cartTotal)}</Text>
          </View>
          <PrimaryButton
            disabled={!canSubmit}
            label="Заказать"
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
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 27,
  },
  content: {
    padding: 12,
    gap: 10,
  },
  section: {
    padding: 16,
    borderRadius: radii.medium,
    backgroundColor: colors.white,
  },
  sectionTitleRow: {
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeSoft,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 11,
  },
  field: {
    marginTop: 13,
  },
  fieldLabel: {
    marginBottom: 6,
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    color: colors.ink,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  inputMultiline: {
    minHeight: 86,
    paddingTop: 13,
    textAlignVertical: "top",
  },
  inlineFields: {
    flexDirection: "row",
    gap: 8,
  },
  inlineField: {
    flex: 1,
  },
  validation: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 11,
  },
  choice: {
    minHeight: 56,
    marginTop: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  choiceSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  choiceLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  radio: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.orange,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  utensilsRow: {
    minHeight: 56,
    marginTop: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  utensilsCopy: {
    flex: 1,
  },
  errorBox: {
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 92,
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopLeftRadius: radii.large,
    borderTopRightRadius: radii.large,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    ...shadow,
  },
  totalLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  total: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  submit: {
    flex: 1,
  },
});
