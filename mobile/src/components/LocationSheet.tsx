import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi } from "../api";
import { useStore } from "../store";
import { colors, radii, shadow } from "../theme";
import type { DeliveryType, Region } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { YandexMap } from "./YandexMap";
import type { MapPoint } from "./yandexMapShared";

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
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [type, setType] = useState<DeliveryType>(store.deliveryType);
  const [address, setAddress] = useState(store.location?.address ?? "");
  const [latitude, setLatitude] = useState(store.location?.latitude);
  const [longitude, setLongitude] = useState(store.location?.longitude);
  const [regions, setRegions] = useState<Region[]>(fallbackRegions);
  const [selectedRegion, setSelectedRegion] = useState(store.regionSlug);

  useEffect(() => {
    if (!visible) return;
    setType(store.deliveryType);
    setAddress(store.location?.address ?? "");
    setLatitude(store.location?.latitude);
    setLongitude(store.location?.longitude);
    setSelectedRegion(store.regionSlug);
    catalogApi.regions().then(setRegions).catch(() => undefined);
  }, [
    store.deliveryType,
    store.location?.address,
    store.location?.latitude,
    store.location?.longitude,
    store.regionSlug,
    visible,
  ]);

  const region = useMemo(
    () => regions.find((item) => item.slug === selectedRegion) ?? regions[0],
    [regions, selectedRegion],
  );
  const pickupAddress = region?.pickupAddress ||
    `г. ${region?.name ?? "Бишкек"}, центральная кухня`;
  const canSubmit = type === "pickup" || address.trim().length >= 5;

  const handleMapLocation = (point: MapPoint) => {
    setAddress(point.address);
    setLatitude(point.latitude);
    setLongitude(point.longitude);
  };

  const save = () => {
    store.setDeliveryType(type);
    store.setRegionSlug(selectedRegion);
    store.setLocation({
      address: type === "pickup" ? pickupAddress : address.trim(),
      latitude: type === "delivery" ? latitude : undefined,
      longitude: type === "delivery" ? longitude : undefined,
    });
    onClose();
  };

  const close = () => {
    if (!required) onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
      visible={visible}
    >
      <StatusBar style="dark" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <View style={styles.map}>
          <YandexMap
            initialLatitude={latitude}
            initialLongitude={longitude}
            onLocationChange={handleMapLocation}
            regionSlug={selectedRegion}
          />
        </View>

        <View style={[styles.topControls, { top: Math.max(insets.top, 12) }]}>
          {!required ? (
            <Pressable
              accessibilityLabel="Закрыть"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={colors.ink} />
            </Pressable>
          ) : null}
          <View style={styles.switcher}>
            {(["delivery", "pickup"] as DeliveryType[]).map((item) => {
              const active = type === item;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
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
        </View>

        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {type === "delivery" ? "Адрес доставки" : "Где забрать заказ"}
          </Text>

          <View style={styles.regionRow}>
            {regions.map((item) => (
              <Pressable
                key={item.slug}
                onPress={() => {
                  setSelectedRegion(item.slug);
                  setAddress("");
                  setLatitude(undefined);
                  setLongitude(undefined);
                }}
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
              <View style={styles.addressField}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={22}
                  color={colors.orange}
                />
                <TextInput
                  autoCapitalize="sentences"
                  onChangeText={setAddress}
                  placeholder="Передвиньте карту или введите адрес"
                  placeholderTextColor="#9B9B9B"
                  returnKeyType="done"
                  style={styles.addressInput}
                  value={address}
                />
                {address ? (
                  <Pressable
                    accessibilityLabel="Очистить адрес"
                    onPress={() => setAddress("")}
                  >
                    <MaterialCommunityIcons name="close" size={21} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={styles.hint}>
                Двигайте карту и при необходимости уточните адрес вручную.
                Подъезд и квартиру укажете при оформлении.
              </Text>
              <PrimaryButton
                disabled={!canSubmit}
                label={address ? "Далее" : "Уточнить адрес"}
                onPress={save}
                tone="black"
                style={styles.primary}
              />
            </>
          ) : (
            <>
              <View style={styles.pickupCard}>
                <View style={styles.pickupIcon}>
                  <MaterialCommunityIcons name="store-marker" size={25} color={colors.orange} />
                </View>
                <View style={styles.pickupCopy}>
                  <Text style={styles.pickupAddress}>{pickupAddress}</Text>
                  <Text style={styles.pickupHours}>
                    {region?.pickupWorkingHours || "Ежедневно, без выходных"}
                  </Text>
                </View>
              </View>
              <PrimaryButton
                label="Заберу здесь"
                onPress={save}
                tone="black"
                style={styles.primary}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ECEBE7",
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  topControls: {
    position: "absolute",
    zIndex: 4,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    ...shadow,
  },
  switcher: {
    flex: 1,
    minHeight: 50,
    padding: 4,
    borderRadius: radii.medium,
    flexDirection: "row",
    backgroundColor: "rgba(245,245,243,0.95)",
    ...shadow,
  },
  switchItem: {
    flex: 1,
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
    fontWeight: "500",
  },
  switchTextActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  panel: {
    marginTop: -28,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.white,
    ...shadow,
  },
  handle: {
    width: 38,
    height: 4,
    marginBottom: 14,
    borderRadius: 99,
    alignSelf: "center",
    backgroundColor: "#D7D7D7",
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.55,
  },
  regionRow: {
    marginTop: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 8,
  },
  regionChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
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
  addressField: {
    minHeight: 58,
    paddingHorizontal: 15,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.surface,
  },
  addressInput: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
  },
  hint: {
    marginTop: 9,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  primary: {
    minHeight: 58,
    marginTop: 14,
    borderRadius: 18,
  },
  pickupCard: {
    minHeight: 78,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
  },
  pickupIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
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
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
  },
});
