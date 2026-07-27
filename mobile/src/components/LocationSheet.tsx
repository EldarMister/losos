import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { catalogApi } from "../api";
import { colors, radii } from "../theme";
import type { DeliveryType, Region } from "../types";
import { useStore } from "../store";
import { PrimaryButton } from "./PrimaryButton";
import { Sheet } from "./Sheet";

type Props = {
  visible: boolean;
  required?: boolean;
  onClose: () => void;
};

const fallbackRegions: Region[] = [
  {
    id: 1,
    slug: "bishkek",
    name: "Бишкек",
    pickupAddress: "г. Бишкек, проспект Чуй, 155",
    pickupWorkingHours: "Ежедневно, 11:00–23:00",
  },
  {
    id: 2,
    slug: "osh",
    name: "Ош",
    pickupAddress: "г. Ош, ул. Курманжан Датка, 211",
    pickupWorkingHours: "Ежедневно, 11:00–23:00",
  },
];

export function LocationSheet({ visible, required, onClose }: Props) {
  const store = useStore();
  const [type, setType] = useState<DeliveryType>(store.deliveryType);
  const [address, setAddress] = useState(store.location?.address ?? "");
  const [regions, setRegions] = useState<Region[]>(fallbackRegions);
  const [selectedRegion, setSelectedRegion] = useState(store.regionSlug);

  useEffect(() => {
    if (!visible) return;
    setType(store.deliveryType);
    setAddress(store.location?.address ?? "");
    setSelectedRegion(store.regionSlug);
    catalogApi.regions().then(setRegions).catch(() => undefined);
  }, [store.deliveryType, store.location?.address, store.regionSlug, visible]);

  const region = useMemo(
    () => regions.find((item) => item.slug === selectedRegion) ?? regions[0],
    [regions, selectedRegion],
  );
  const pickupAddress = region?.pickupAddress ||
    `г. ${region?.name ?? "Бишкек"}, центральная кухня`;
  const canSubmit = type === "pickup" || address.trim().length >= 5;

  const save = () => {
    store.setDeliveryType(type);
    store.setRegionSlug(selectedRegion);
    store.setLocation({
      address: type === "pickup" ? pickupAddress : address.trim(),
    });
    onClose();
  };

  return (
    <Sheet
      fullScreen
      visible={visible}
      onClose={() => {
        if (!required) onClose();
      }}
      footer={(
        <PrimaryButton
          disabled={!canSubmit}
          label="Перейти к каталогу"
          onPress={save}
          tone="black"
        />
      )}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Куда привезти?</Text>
        {!required ? (
          <Pressable accessibilityLabel="Закрыть" hitSlop={10} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={26} color={colors.ink} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.switcher}>
        {(["delivery", "pickup"] as DeliveryType[]).map((item) => {
          const active = type === item;
          return (
            <Pressable
              key={item}
              onPress={() => setType(item)}
              style={[styles.switchItem, active && styles.switchItemActive]}
            >
              <Text style={[styles.switchText, active && styles.switchTextActive]}>
                {item === "delivery" ? "Доставка" : "Самовывоз"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Город</Text>
        <View style={styles.regionRow}>
          {regions.map((item) => (
            <Pressable
              key={item.slug}
              onPress={() => setSelectedRegion(item.slug)}
              style={[
                styles.regionChip,
                selectedRegion === item.slug && styles.regionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.regionText,
                  selectedRegion === item.slug && styles.regionTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>

        {type === "delivery" ? (
          <>
            <View style={styles.mapPreview}>
              <View style={styles.gridHorizontal} />
              <View style={styles.gridVertical} />
              <View style={styles.mapPin}>
                <MaterialCommunityIcons
                  name="shopping-outline"
                  size={27}
                  color={colors.orange}
                />
              </View>
              <Text style={styles.mapCaption}>Зона доставки</Text>
            </View>
            <Text style={styles.label}>Адрес доставки</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={22}
                color={colors.muted}
              />
              <TextInput
                autoCapitalize="sentences"
                onChangeText={setAddress}
                placeholder="Улица, дом"
                placeholderTextColor="#A0A0A0"
                returnKeyType="done"
                style={styles.input}
                value={address}
              />
              {address ? (
                <Pressable accessibilityLabel="Очистить адрес" onPress={() => setAddress("")}>
                  <MaterialCommunityIcons name="close" size={21} color={colors.muted} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.hint}>
              Точный подъезд и квартиру можно указать при оформлении.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.mapPreview, styles.pickupPreview]}>
              <MaterialCommunityIcons
                name="store-marker-outline"
                size={48}
                color={colors.orange}
              />
              <Text style={styles.mapCaption}>Кухня для самовывоза</Text>
            </View>
            <Text style={styles.label}>Заберу здесь</Text>
            <View style={styles.pickupCard}>
              <View style={styles.radio}>
                <View style={styles.radioInner} />
              </View>
              <View style={styles.pickupCopy}>
                <Text style={styles.pickupAddress}>{pickupAddress}</Text>
                <Text style={styles.pickupHours}>
                  {region?.pickupWorkingHours || "Ежедневно, без выходных"}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.45,
  },
  switcher: {
    marginHorizontal: 18,
    padding: 4,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    flexDirection: "row",
  },
  switchItem: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  switchItemActive: {
    backgroundColor: colors.white,
  },
  switchText: {
    color: "#999999",
    fontSize: 15,
    fontWeight: "600",
  },
  switchTextActive: {
    color: colors.ink,
  },
  body: {
    padding: 18,
    paddingBottom: 30,
  },
  label: {
    marginBottom: 9,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  regionRow: {
    marginBottom: 18,
    flexDirection: "row",
    gap: 8,
  },
  regionChip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
  },
  regionChipActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
  },
  regionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
  },
  regionTextActive: {
    color: colors.orangeDark,
  },
  mapPreview: {
    height: 190,
    marginBottom: 20,
    borderRadius: radii.large,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E4D6",
  },
  gridHorizontal: {
    position: "absolute",
    left: -20,
    right: -20,
    top: "52%",
    height: 18,
    backgroundColor: "rgba(255,255,255,0.72)",
    transform: [{ rotate: "-8deg" }],
  },
  gridVertical: {
    position: "absolute",
    top: -20,
    bottom: -20,
    left: "30%",
    width: 15,
    backgroundColor: "rgba(255,255,255,0.7)",
    transform: [{ rotate: "8deg" }],
  },
  mapPin: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  mapCaption: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  pickupPreview: {
    backgroundColor: "#EFF4E9",
  },
  inputWrap: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  pickupCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radii.medium,
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.orangeSoft,
  },
  radio: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  pickupCopy: {
    flex: 1,
  },
  pickupAddress: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  pickupHours: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
  },
});
