import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalogApi } from "../api";
import {
  isSpecificDeliveryAddress,
  suggestAddresses,
  type AddressSuggestion,
} from "../geocoding";
import { useStore } from "../store";
import { colors, radii, shadow } from "../theme";
import type { DeliveryType, PickupLocation, Region } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { YandexMap } from "./YandexMap";
import type { MapPoint } from "./yandexMapShared";

type Props = {
  visible: boolean;
  required?: boolean;
  onClose: () => void;
};

export function LocationSheet({ visible, required, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const store = useStore();
  const [type, setType] = useState<DeliveryType>(store.deliveryType);
  const [address, setAddress] = useState(store.location?.address ?? "");
  const [addressComplete, setAddressComplete] = useState(
    isSpecificDeliveryAddress(store.location?.address ?? ""),
  );
  const [latitude, setLatitude] = useState(store.location?.latitude);
  const [longitude, setLongitude] = useState(store.location?.longitude);
  const [mapInitialPoint, setMapInitialPoint] = useState({
    latitude: store.location?.latitude,
    longitude: store.location?.longitude,
  });
  const [regions, setRegions] = useState<Region[]>(store.regions);
  const [selectedRegion, setSelectedRegion] = useState(store.regionSlug);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(
    store.location?.pickupLocationId ?? null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setType(store.deliveryType);
    setAddress(store.location?.address ?? "");
    setAddressComplete(isSpecificDeliveryAddress(store.location?.address ?? ""));
    setLatitude(store.location?.latitude);
    setLongitude(store.location?.longitude);
    setMapInitialPoint({
      latitude: store.location?.latitude,
      longitude: store.location?.longitude,
    });
    setSelectedRegion(store.regionSlug);
    setSearchVisible(false);
    setSearchQuery("");
    setSuggestions([]);
    setSearchError("");
    catalogApi.regions().then((items) => {
      setRegions(items);
      store.setRegions(items);
    }).catch(() => undefined);
  }, [
    store.deliveryType,
    store.location?.address,
    store.location?.latitude,
    store.location?.longitude,
    store.location?.pickupLocationId,
    store.regionSlug,
    visible,
  ]);

  useEffect(() => {
    if (!searchVisible || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      setSearchError("");
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError("");
      suggestAddresses(searchQuery, selectedRegion, controller.signal)
        .then((items) => {
          setSuggestions(items);
          if (!items.length) setSearchError("Ничего не нашли. Уточните улицу и номер дома.");
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setSearchError(error instanceof Error ? error.message : "Не удалось найти адрес");
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, searchVisible, selectedRegion]);

  const region = useMemo(
    () => regions.find((item) => item.slug === selectedRegion) ?? regions[0],
    [regions, selectedRegion],
  );
  const pickupLocations = useMemo<PickupLocation[]>(() => {
    const available = (region?.pickupLocations || [])
      .filter((item) => item.enabled !== false)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    if (available.length || !region?.pickupAddress) return available;
    return [{
      id: -1,
      title: "Кухня",
      address: region.pickupAddress,
      workingHours: region.pickupWorkingHours || "Часы работы уточняются",
      yandexUrl: region.pickupYandexUrl,
      enabled: true,
      sortOrder: 0,
    }];
  }, [region]);
  const selectedPickup = pickupLocations.find((item) => item.id === selectedPickupId)
    || pickupLocations[0];
  const canSubmit = type === "pickup"
    ? Boolean(selectedPickup)
    : addressComplete
      && Number.isFinite(latitude)
      && Number.isFinite(longitude);

  const handleMapLocation = (point: MapPoint) => {
    setAddress(point.address);
    setAddressComplete(
      point.isComplete
      || isSpecificDeliveryAddress(point.address, point.kind, point.precision),
    );
    setLatitude(point.latitude);
    setLongitude(point.longitude);
    setLocationError("");
  };

  const openSearch = () => {
    setSearchQuery("");
    setSearchError("");
    setSuggestions([]);
    setSearchVisible(true);
  };

  const chooseSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    setAddressComplete(
      suggestion.isComplete
      || isSpecificDeliveryAddress(
        suggestion.label,
        suggestion.kind,
        suggestion.precision,
      ),
    );
    setSearchQuery(suggestion.label);
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setMapInitialPoint({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setLocationError("");
    setSearchVisible(false);
    Keyboard.dismiss();
  };

  const submitSearch = () => {
    if (suggestions[0]) {
      chooseSuggestion(suggestions[0]);
      return;
    }
    setSearchError("Выберите адрес из списка.");
  };

  const save = () => {
    store.setDeliveryType(type);
    store.setRegionSlug(selectedRegion);
    store.setLocation({
      address: type === "pickup" ? selectedPickup?.address || "" : address.trim(),
      latitude: type === "delivery" ? latitude : selectedPickup?.latitude ?? undefined,
      longitude: type === "delivery" ? longitude : selectedPickup?.longitude ?? undefined,
      pickupLocationId: type === "pickup" ? selectedPickup?.id : undefined,
      title: type === "pickup" ? selectedPickup?.title : undefined,
      workingHours: type === "pickup" ? selectedPickup?.workingHours : undefined,
      yandexUrl: type === "pickup" ? selectedPickup?.yandexUrl : undefined,
    });
    onClose();
  };

  const locateMe = async () => {
    if (locating) return;
    setLocating(true);
    setLocationError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError("Разрешите геопозицию в настройках телефона.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const [place] = await Location.reverseGeocodeAsync(point);
      const parts = [place?.street, place?.streetNumber, place?.city || place?.district]
        .filter(Boolean);
      setLatitude(point.latitude);
      setLongitude(point.longitude);
      setMapInitialPoint(point);
      setAddress(parts.join(", ") || "Текущее местоположение");
      setAddressComplete(Boolean(place?.street && place?.streetNumber));
      setSearchQuery(parts.join(", ") || "Текущее местоположение");
    } catch {
      setLocationError("Не удалось определить местоположение. Укажите адрес вручную.");
    } finally {
      setLocating(false);
    }
  };

  const close = () => {
    if (searchVisible) {
      setSearchVisible(false);
      Keyboard.dismiss();
      return;
    }
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
            initialLatitude={mapInitialPoint.latitude}
            initialLongitude={mapInitialPoint.longitude}
            onLocationChange={handleMapLocation}
            regionSlug={selectedRegion}
          />
        </View>

        <View style={[styles.topControls, { top: insets.top + 14 }]}>
          <Pressable
            accessibilityLabel="Назад"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.ink} />
          </Pressable>
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

        {type === "delivery" ? (
          <Pressable
            accessibilityLabel="Использовать текущее местоположение"
            disabled={locating}
            onPress={() => void locateMe()}
            style={[
              styles.mapLocateButton,
              { bottom: 238 + Math.max(insets.bottom, 10) },
              locating && styles.mapLocateButtonDisabled,
            ]}
          >
            {locating ? (
              <ActivityIndicator color={colors.orange} />
            ) : (
              <MaterialCommunityIcons name="navigation-variant" size={25} color={colors.orange} />
            )}
          </Pressable>
        ) : null}

        <View
          style={[
            styles.panel,
            {
              paddingBottom: Math.max(
                insets.bottom,
                Platform.OS === "android" ? 40 : 16,
              ),
            },
          ]}
        >
          <View style={styles.panelHandleSpace}>
            <View style={styles.panelHandle} />
          </View>
          <Text style={styles.title}>
            {type === "delivery" ? "Адрес доставки" : "Где забрать заказ"}
          </Text>

          {type === "pickup" ? (
            <View style={styles.regionRow}>
              {regions.map((item) => (
                <Pressable
                  key={item.slug}
                  onPress={() => {
                    setSelectedRegion(item.slug);
                    setSelectedPickupId(null);
                    setAddress("");
                    setAddressComplete(false);
                    setLatitude(undefined);
                    setLongitude(undefined);
                    setMapInitialPoint({
                      latitude: undefined,
                      longitude: undefined,
                    });
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
          ) : null}

          {type === "delivery" ? (
            <>
              <Pressable onPress={openSearch} style={[styles.addressField, styles.deliveryAddressField]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.addressInput,
                    styles.deliveryAddressInput,
                    !address && styles.addressPlaceholder,
                  ]}
                >
                  {address || "Введите адрес доставки"}
                </Text>
              </Pressable>
              {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
              <PrimaryButton
                disabled={false}
                label={canSubmit ? "Далее" : "Уточнить адрес"}
                labelStyle={styles.primaryLabel}
                onPress={canSubmit ? save : openSearch}
                tone="black"
                style={styles.primary}
              />
            </>
          ) : (
            <>
              <ScrollView style={styles.pickupList} showsVerticalScrollIndicator={false}>
                {pickupLocations.map((pickup) => {
                  const active = selectedPickup?.id === pickup.id;
                  return (
                    <Pressable
                      key={pickup.id}
                      onPress={() => {
                        setSelectedPickupId(pickup.id);
                        setLatitude(pickup.latitude ?? undefined);
                        setLongitude(pickup.longitude ?? undefined);
                      }}
                      style={[styles.pickupCard, active && styles.pickupCardActive]}
                    >
                      <View style={styles.pickupIcon}>
                        <MaterialCommunityIcons name="store-marker" size={25} color={colors.orange} />
                      </View>
                      <View style={styles.pickupCopy}>
                        <Text style={styles.pickupTitle}>{pickup.title}</Text>
                        <Text style={styles.pickupAddress}>{pickup.address}</Text>
                        <Text style={styles.pickupHours}>{pickup.workingHours || "Часы работы уточняются"}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={active ? "radiobox-marked" : "radiobox-blank"}
                        size={23}
                        color={active ? colors.orange : colors.muted}
                      />
                    </Pressable>
                  );
                })}
                {!pickupLocations.length ? (
                  <Text style={styles.pickupEmpty}>В этом городе пока нет доступных кухонь.</Text>
                ) : null}
              </ScrollView>
              <PrimaryButton
                disabled={!selectedPickup}
                label="Заберу здесь"
                labelStyle={styles.primaryLabel}
                onPress={save}
                tone="black"
                style={styles.primary}
              />
            </>
          )}
        </View>

        {searchVisible ? (
          <View style={styles.searchOverlay}>
            <View
              style={[
                styles.searchPanel,
                {
                  marginTop: Math.max(insets.top + 20, 68),
                  paddingBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              <View style={styles.searchField}>
              <TextInput
                autoCapitalize="sentences"
                autoCorrect={false}
                onChangeText={(value) => setSearchQuery(value.replace(/%20/gi, " "))}
                onSubmitEditing={submitSearch}
                placeholder="Введите адрес"
                placeholderTextColor="#9B9B9B"
                returnKeyType="search"
                selectionColor={colors.orange}
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery ? (
                <Pressable
                  accessibilityLabel="Очистить поиск"
                  hitSlop={10}
                  onPress={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setSearchError("");
                  }}
                >
                  <MaterialCommunityIcons name="close" size={25} color={colors.muted} />
                </Pressable>
              ) : null}
              </View>

              {searching ? (
                <View style={styles.searchState}>
                  <ActivityIndicator color={colors.orange} />
                  <Text style={styles.searchStateText}>Ищем адрес…</Text>
                </View>
              ) : null}

              {!searching ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={styles.suggestionList}
                >
                  {suggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion.id}
                      onPress={() => chooseSuggestion(suggestion)}
                      style={({ pressed }) => [
                        styles.suggestionRow,
                        pressed && styles.suggestionRowPressed,
                      ]}
                    >
                      <View style={styles.suggestionCopy}>
                        <Text style={styles.suggestionTitle}>{suggestion.label}</Text>
                        {suggestion.subtitle ? (
                          <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                  {searchError ? <Text style={styles.searchError}>{searchError}</Text> : null}
                </ScrollView>
              ) : null}
            </View>
          </View>
        ) : null}
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
    left: 20,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    ...shadow,
  },
  switcher: {
    flex: 1,
    height: 44,
    padding: 4,
    borderRadius: 16,
    flexDirection: "row",
    backgroundColor: "rgba(245,245,243,0.95)",
    ...shadow,
  },
  switchItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
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
    marginTop: -8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    ...shadow,
  },
  panelHandleSpace: {
    height: 20,
    alignItems: "center",
  },
  panelHandle: {
    width: 36,
    height: 4,
    marginTop: 9,
    borderRadius: 2,
    backgroundColor: "#D5D5D5",
  },
  title: {
    marginTop: 24,
    color: colors.ink,
    fontSize: 30,
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
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  addressInput: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
  },
  deliveryAddressInput: {
    paddingHorizontal: 0,
    textAlign: "center",
  },
  addressPlaceholder: {
    color: "#9B9B9B",
  },
  deliveryAddressField: {
    marginTop: 24,
  },
  mapLocateButton: {
    position: "absolute",
    zIndex: 5,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    ...shadow,
  },
  mapLocateButtonDisabled: {
    opacity: 0.65,
  },
  locationError: {
    marginTop: 7,
    color: colors.danger,
    fontSize: 12,
  },
  primary: {
    minHeight: 52,
    marginTop: 12,
    borderRadius: 16,
  },
  primaryLabel: {
    fontSize: 15,
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
  pickupList: {
    maxHeight: 258,
  },
  pickupCardActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeSoft,
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
  pickupTitle: {
    marginBottom: 2,
    color: colors.orangeDark,
    fontSize: 12,
    fontWeight: "800",
  },
  pickupHours: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
  },
  pickupEmpty: {
    paddingVertical: 26,
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "#A9ABAD",
  },
  searchPanel: {
    flex: 1,
    paddingTop: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  searchField: {
    height: 52,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
  },
  searchState: {
    paddingTop: 38,
    alignItems: "center",
    gap: 10,
  },
  searchStateText: {
    color: colors.muted,
    fontSize: 14,
  },
  suggestionList: {
    marginTop: 14,
  },
  suggestionRow: {
    minHeight: 60,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
  },
  suggestionRowPressed: {
    backgroundColor: colors.surface,
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
  suggestionSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  searchError: {
    paddingVertical: 28,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
