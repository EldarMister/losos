import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { catalogApi } from "../api";
import { kitchenSchedule, orderingAvailability } from "../delivery";
import {
  isSpecificDeliveryAddress,
  resolveAddressSuggestion,
  suggestAddresses,
  type AddressSuggestion,
} from "../geocoding";
import { useStore } from "../store";
import { colors, shadow } from "../theme";
import type { DeliveryType, PickupLocation, Region } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import {
  SwipeDismissScrollProvider,
  SwipeDismissScrollView,
  useSwipeToDismiss,
} from "./SwipeDismiss";
import { YandexMap } from "./YandexMap";
import {
  getDeliveryZone,
  isPointInDeliveryZone,
  type MapPoint,
} from "./yandexMapShared";

type Props = {
  visible: boolean;
  required?: boolean;
  onClose: () => void;
};

type PickupOption = {
  key: string;
  region: Region;
  pickup: PickupLocation;
};

export function regionPickupLocations(region: Region): PickupLocation[] {
  const available = [...(region.pickupLocations || [])]
    .filter((item) => item.enabled !== false)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  if (available.length || !region.pickupAddress) return available;
  return [{
    id: -region.id,
    title: "Кухня",
    address: region.pickupAddress,
    workingHours: region.pickupWorkingHours || "Часы работы уточняются",
    yandexUrl: region.pickupYandexUrl,
    enabled: true,
    sortOrder: 0,
  }];
}

function distanceBetween(
  fromLatitude: number | undefined,
  fromLongitude: number | undefined,
  toLatitude: number | null | undefined,
  toLongitude: number | null | undefined,
) {
  if (![fromLatitude, fromLongitude, toLatitude, toLongitude].every(Number.isFinite)) return "";
  const earthRadius = 6371;
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians((toLatitude as number) - (fromLatitude as number));
  const longitudeDelta = radians((toLongitude as number) - (fromLongitude as number));
  const startLatitude = radians(fromLatitude as number);
  const endLatitude = radians(toLatitude as number);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  const distance = earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`;
}

export function pickupIntroCopy(count: number) {
  if (!count) {
    return "Сейчас для самовывоза нет доступных кухонь. Загляните сюда немного позже.";
  }
  const kitchenWord = count % 10 === 1 && count % 100 !== 11
    ? "кухне"
    : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)
      ? "кухнях"
      : "кухнях";
  return `Сейчас самовывоз доступен в ${count} ${kitchenWord}. Вы можете выбрать кухню на карте или из списка.`;
}

export function LocationSheet({ visible, required, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const store = useStore();
  const [modalMounted, setModalMounted] = useState(visible);
  const [contentVisible, setContentVisible] = useState(visible);
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
  const [mapFocusRequest, setMapFocusRequest] = useState(0);
  const [regions, setRegions] = useState<Region[]>(store.regions);
  const [selectedRegion, setSelectedRegion] = useState(store.regionSlug);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(
    store.location?.pickupLocationId ?? null,
  );
  const [pickupListVisible, setPickupListVisible] = useState(false);
  const [locating, setLocating] = useState(
    visible
      && store.deliveryType === "delivery"
      && (!store.location?.address
        || !Number.isFinite(store.location?.latitude)
        || !Number.isFinite(store.location?.longitude)),
  );
  const automaticLocationAttempted = useRef(false);
  const [panelHeight, setPanelHeight] = useState(226);
  const [deviceLocation, setDeviceLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [scheduleNow, setScheduleNow] = useState(() => Date.now());
  const closeSearch = useCallback(() => {
    setSearchVisible(false);
    Keyboard.dismiss();
  }, []);
  const searchSwipe = useSwipeToDismiss({
    enabled: searchVisible,
    onDismiss: closeSearch,
  });

  useEffect(() => {
    if (searchVisible) searchSwipe.reset();
  }, [searchSwipe.reset, searchVisible]);

  useEffect(() => {
    let frame = 0;
    let secondFrame = 0;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    if (visible) {
      setModalMounted(true);
      if (!contentVisible) {
        frame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => setContentVisible(true));
        });
      }
    } else {
      setContentVisible(false);
      closeTimer = setTimeout(() => setModalMounted(false), 340);
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [visible]);
  const selectedRegionData = useMemo(
    () => regions.find((region) => region.slug === selectedRegion),
    [regions, selectedRegion],
  );
  const deliveryZone = useMemo(
    () => getDeliveryZone(selectedRegion, selectedRegionData?.deliveryZone),
    [selectedRegion, selectedRegionData?.deliveryZone],
  );

  const refreshDeviceLocation = useCallback(async (requestPermission: boolean) => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted" && requestPermission) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") return;

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 1_000,
      });
      if (lastKnown) {
        setDeviceLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setDeviceLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      // Never substitute the saved delivery address for the device position.
    }
  }, []);

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
    setSelectedPickupId(store.location?.pickupLocationId ?? null);
    setPickupListVisible(false);
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
    if (!visible) return undefined;
    setScheduleNow(Date.now());
    const timer = setInterval(() => setScheduleNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible || type !== "pickup") return;
    void refreshDeviceLocation(true);
  }, [refreshDeviceLocation, type, visible]);

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

  const pickupOptions = useMemo<PickupOption[]>(() => {
    return regions.flatMap((item) => (
      regionPickupLocations(item).map((pickup) => ({
        key: `${item.slug}:${pickup.id}`,
        region: item,
        pickup,
      }))
    ));
  }, [regions]);
  const pickupListHeight = Math.min(
    windowHeight * 0.78,
    276 + Math.min(pickupOptions.length, 5) * 74,
  );
  const selectedPickupOption = pickupOptions.find((item) => (
    item.region.slug === selectedRegion && item.pickup.id === selectedPickupId
  ));
  const selectedPickup = selectedPickupOption?.pickup;
  const pickupAvailability = orderingAvailability(
    selectedPickupOption?.region ?? selectedRegionData,
    new Date(scheduleNow),
  );
  const selectedPickupDistance = selectedPickup
    ? distanceBetween(
        deviceLocation?.latitude,
        deviceLocation?.longitude,
        selectedPickup.latitude,
        selectedPickup.longitude,
      )
    : "";
  const pickupMarkers = useMemo(() => pickupOptions.flatMap((item) => (
    Number.isFinite(item.pickup.latitude) && Number.isFinite(item.pickup.longitude)
      ? [{
          id: item.key,
          latitude: item.pickup.latitude as number,
          longitude: item.pickup.longitude as number,
        }]
      : []
  )), [pickupOptions]);
  const canSubmit = type === "pickup"
    ? Boolean(selectedPickup) && pickupAvailability.isOpen
    : addressComplete
      && Number.isFinite(latitude)
      && Number.isFinite(longitude);

  const handleMapLocation = useCallback((point: MapPoint) => {
    setAddress(point.address);
    setAddressComplete(
      point.isComplete
      || isSpecificDeliveryAddress(point.address, point.kind, point.precision),
    );
    setLatitude(point.latitude);
    setLongitude(point.longitude);
    setLocationError("");
  }, []);

  const choosePickup = (option: PickupOption) => {
    setSelectedRegion(option.region.slug);
    setSelectedPickupId(option.pickup.id);
    setMapInitialPoint({
      latitude: option.pickup.latitude ?? undefined,
      longitude: option.pickup.longitude ?? undefined,
    });
  };

  const openPickupRoute = () => {
    if (!selectedPickup) return;
    const fallbackUrl = Number.isFinite(selectedPickup.latitude) && Number.isFinite(selectedPickup.longitude)
      ? `https://yandex.ru/maps/?rtext=~${selectedPickup.latitude},${selectedPickup.longitude}&rtt=auto`
      : `https://yandex.ru/maps/?text=${encodeURIComponent(selectedPickup.address)}`;
    void Linking.openURL(selectedPickup.yandexUrl || fallbackUrl);
  };

  const openSearch = () => {
    setSearchQuery("");
    setSearchError("");
    setSuggestions([]);
    setSearchVisible(true);
  };

  const chooseSuggestion = async (suggestion: AddressSuggestion) => {
    setSearching(true);
    setSearchError("");
    try {
      const resolved = await resolveAddressSuggestion(suggestion, selectedRegion);
      if (!isPointInDeliveryZone(resolved.latitude, resolved.longitude, deliveryZone)) {
        throw new Error("Этот адрес находится вне зоны доставки");
      }
      setAddress(resolved.label);
      setAddressComplete(
        resolved.isComplete
        || isSpecificDeliveryAddress(
          resolved.label,
          resolved.kind,
          resolved.precision,
        ),
      );
      setSearchQuery(resolved.label);
      setLatitude(resolved.latitude);
      setLongitude(resolved.longitude);
      setMapInitialPoint({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      });
      setMapFocusRequest((value) => value + 1);
      setLocationError("");
      setSearchVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Не удалось выбрать адрес");
    } finally {
      setSearching(false);
    }
  };

  const submitSearch = () => {
    if (suggestions[0]) {
      void chooseSuggestion(suggestions[0]);
      return;
    }
    setSearchError("Выберите адрес из списка.");
  };

  const save = () => {
    if (type === "pickup" && !pickupAvailability.isOpen) return;
    store.setDeliveryType(type);
    store.setRegionSlug(selectedRegion);
    store.setLocation({
      address: type === "pickup" ? selectedPickup?.address || "" : address.trim(),
      latitude: type === "delivery" ? latitude : selectedPickup?.latitude ?? undefined,
      longitude: type === "delivery" ? longitude : selectedPickup?.longitude ?? undefined,
      pickupLocationId: type === "pickup" ? selectedPickup?.id : undefined,
      title: type === "pickup" ? selectedPickup?.title : undefined,
      workingHours: type === "pickup" ? kitchenSchedule(selectedPickupOption?.region) : undefined,
      yandexUrl: type === "pickup" ? selectedPickup?.yandexUrl : undefined,
    });
    onClose();
  };

  const locateMe = useCallback(async (force = false) => {
    if (locating && !force) return;
    setLocating(true);
    setLocationError("");
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        setLocationError("Разрешите геопозицию в настройках телефона.");
        return;
      }
      const focusPoint = (point: { latitude: number; longitude: number }) => {
        setDeviceLocation(point);
        setLatitude(point.latitude);
        setLongitude(point.longitude);
        setMapInitialPoint(point);
        setMapFocusRequest((value) => value + 1);
        setAddress("Определяем адрес…");
        setAddressComplete(false);
        setSearchQuery("");
      };
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 1_000,
      });
      if (lastKnown) {
        focusPoint({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      focusPoint({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError("Не удалось определить местоположение. Укажите адрес вручную.");
    } finally {
      setLocating(false);
    }
  }, [locating]);

  useEffect(() => {
    if (!visible) {
      automaticLocationAttempted.current = false;
      return;
    }
    const hasSelectedAddress = Boolean(store.location?.address)
      && Number.isFinite(store.location?.latitude)
      && Number.isFinite(store.location?.longitude);
    if (type !== "delivery" || hasSelectedAddress || automaticLocationAttempted.current) return;
    automaticLocationAttempted.current = true;
    // Open the map on the customer instead of reverse-geocoding a city-center fallback.
    setLocating(false);
    queueMicrotask(() => void locateMe(true));
  }, [locateMe, store.location?.address, store.location?.latitude, store.location?.longitude, type, visible]);

  const close = useCallback(() => {
    if (pickupListVisible) {
      setPickupListVisible(false);
      return;
    }
    if (searchVisible) {
      closeSearch();
      return;
    }
    if (!required) onClose();
  }, [closeSearch, onClose, pickupListVisible, required, searchVisible]);
  const mainSwipe = useSwipeToDismiss({
    enabled: contentVisible && !required && !pickupListVisible && !searchVisible,
    onDismiss: close,
  });
  const pickupListSwipe = useSwipeToDismiss({
    enabled: pickupListVisible,
    onDismiss: () => setPickupListVisible(false),
  });

  useEffect(() => {
    if (contentVisible) mainSwipe.reset();
  }, [contentVisible, mainSwipe.reset, selectedPickupId, type]);

  useEffect(() => {
    if (pickupListVisible) pickupListSwipe.reset();
  }, [pickupListSwipe.reset, pickupListVisible]);

  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={close}
      statusBarTranslucent
      visible={modalMounted}
    >
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" translucent />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.root}
        >
        <View style={styles.map}>
          <YandexMap
            deliveryZone={deliveryZone}
            focusRequest={mapFocusRequest}
            initialLatitude={mapInitialPoint.latitude}
            initialLongitude={mapInitialPoint.longitude}
            markers={type === "pickup" ? pickupMarkers : []}
            onMarkerPress={(key) => {
              const option = pickupOptions.find((item) => item.key === key);
              if (option) choosePickup(option);
            }}
            onLocationChange={handleMapLocation}
            regionSlug={selectedRegion}
            showCenterMarker={type === "delivery" && (
              !locating || Number.isFinite(mapInitialPoint.latitude)
            )}
          />
        </View>

        <View style={[styles.topControls, { top: insets.top + 14 }]}>
          {!required ? (
            <Pressable
              accessibilityLabel="Назад"
              hitSlop={8}
              onPress={close}
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
                  onPress={() => {
                    setType(item);
                    setPickupListVisible(false);
                    setSearchVisible(false);
                    if (item === "delivery") {
                      setMapInitialPoint({ latitude, longitude });
                      setMapFocusRequest((value) => value + 1);
                    }
                    Keyboard.dismiss();
                  }}
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
              { bottom: panelHeight + 12 },
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

        {contentVisible ? (
          <GestureDetector gesture={mainSwipe.gesture}>
            <Animated.View
              entering={SlideInDown.duration(420)}
              exiting={SlideOutDown.duration(320)}
              layout={LinearTransition.duration(300)}
              testID="location-main-panel"
              onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                setPanelHeight(height);
                mainSwipe.onLayout(height);
              }}
              style={[
                styles.panel,
                type === "delivery"
                  ? styles.deliveryPanel
                  : selectedPickup
                    ? styles.pickupDetailPanel
                    : styles.pickupIntroPanel,
                {
                  paddingBottom: Math.max(
                    insets.bottom,
                    16,
                  ),
                },
                mainSwipe.animatedStyle,
              ]}
            >
          {type === "delivery" ? (
            <>
              <Text style={styles.title}>Адрес доставки</Text>
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
            selectedPickup ? (
              <>
                <Text numberOfLines={2} style={[styles.title, styles.pickupDetailTitle]}>
                  {selectedPickup.address}
                </Text>
                {!pickupAvailability.isOpen ? (
                  <Text style={styles.pickupClosed}>Закрыто · {pickupAvailability.nextOpenLabel}</Text>
                ) : null}
                {selectedPickupDistance ? (
                  <View style={styles.pickupDistanceRow}>
                    <MaterialCommunityIcons
                      name="navigation-variant"
                      size={16}
                      color={colors.orange}
                    />
                    <Text style={styles.pickupDistance}>{selectedPickupDistance} от вас</Text>
                  </View>
                ) : null}
                <Text style={styles.pickupDetailHours}>
                  {kitchenSchedule(selectedPickupOption?.region)}
                </Text>
                {selectedPickup.title && selectedPickup.title !== "Кухня" ? (
                  <Text style={styles.pickupDetailDescription}>{selectedPickup.title}</Text>
                ) : null}
                <View style={styles.pickupActionRow}>
                  <PrimaryButton
                    disabled={!pickupAvailability.isOpen}
                    label="Заберу здесь"
                    labelStyle={styles.primaryLabel}
                    onPress={save}
                    tone="black"
                    style={[styles.primary, styles.pickupChooseButton]}
                  />
                  <Pressable
                    accessibilityLabel="Маршрут"
                    accessibilityRole="button"
                    onPress={openPickupRoute}
                    style={({ pressed }) => [
                      styles.pickupRouteButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="map-marker" size={21} color={colors.ink} />
                    <Text style={styles.routeLabel}>Маршрут</Text>
                  </Pressable>
                </View>
                <PrimaryButton
                  label="Отменить"
                  labelStyle={styles.primaryLabel}
                  onPress={() => setSelectedPickupId(null)}
                  tone="soft"
                  style={[styles.primary, styles.pickupCancelButton]}
                />
              </>
            ) : (
              <>
                <View style={styles.pickupTitleRow}>
                  <Text style={styles.title}>Самовывоз</Text>
                  <Image
                    accessibilityLabel="Корзина самовывоза"
                    resizeMode="contain"
                    source={require("../../assets/корзина.png")}
                    style={styles.pickupBasketImage}
                  />
                </View>
                <Text style={styles.pickupDescription}>
                  {pickupIntroCopy(pickupOptions.length)}
                </Text>
                <PrimaryButton
                  disabled={!pickupOptions.length}
                  label="Список"
                  labelStyle={styles.primaryLabel}
                  onPress={() => setPickupListVisible(true)}
                  tone="black"
                  style={[styles.primary, styles.pickupListButton]}
                />
              </>
            )
          )}
            </Animated.View>
          </GestureDetector>
        ) : null}

        {pickupListVisible ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(220)}
            style={styles.pickupOverlay}
          >
            <Pressable
              accessibilityLabel="Закрыть список кухонь"
              onPress={() => setPickupListVisible(false)}
              style={styles.pickupBackdrop}
            />
            <GestureDetector gesture={pickupListSwipe.gesture}>
              <Animated.View
                entering={SlideInDown.duration(380)}
                exiting={SlideOutDown.duration(300)}
                testID="pickup-list-panel"
                onLayout={(event) => pickupListSwipe.onLayout(event.nativeEvent.layout.height)}
                style={[
                  styles.pickupSheet,
                  { height: pickupListHeight },
                  { paddingBottom: Math.max(insets.bottom, 12) },
                  pickupListSwipe.animatedStyle,
                ]}
              >
              <Text style={styles.pickupSheetTitle}>Выберите кухню для самовывоза</Text>
              <SwipeDismissScrollProvider scrollOffsetY={pickupListSwipe.scrollOffsetY}>
                <SwipeDismissScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.pickupSheetList}
                >
                {pickupOptions.map((option) => {
                  const active = option.region.slug === selectedRegion
                    && option.pickup.id === selectedPickupId;
                  const optionDistance = distanceBetween(
                    deviceLocation?.latitude,
                    deviceLocation?.longitude,
                    option.pickup.latitude,
                    option.pickup.longitude,
                  );
                  const optionAvailability = orderingAvailability(option.region, new Date(scheduleNow));
                  return (
                    <Pressable
                      accessibilityLabel={option.pickup.address}
                      key={option.key}
                      onPress={() => choosePickup(option)}
                      style={({ pressed }) => [styles.pickupRow, pressed && styles.pickupRowPressed]}
                    >
                      <MaterialCommunityIcons
                        name={active ? "circle-slice-8" : "circle"}
                        size={23}
                        color={active ? colors.orange : "#F1F1F1"}
                      />
                      <View style={styles.pickupRowCopy}>
                        <Text numberOfLines={1} style={styles.pickupRowAddress}>
                          {option.pickup.address}
                        </Text>
                        <Text style={styles.pickupRowHours}>
                          {optionAvailability.isOpen
                            ? kitchenSchedule(option.region)
                            : `Закрыто · ${optionAvailability.nextOpenLabel}`}
                        </Text>
                      </View>
                      {optionDistance ? (
                        <View style={styles.pickupRowDistance}>
                          <MaterialCommunityIcons name="navigation-variant" size={15} color={colors.orange} />
                          <Text style={styles.pickupRowDistanceText}>{optionDistance}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
                </SwipeDismissScrollView>
              </SwipeDismissScrollProvider>
              <PrimaryButton
                disabled={!selectedPickup}
                label="Выбрать"
                labelStyle={styles.primaryLabel}
                onPress={() => setPickupListVisible(false)}
                tone="black"
                style={[styles.primary, styles.pickupSheetButton]}
              />
              <PrimaryButton
                label="Назад"
                labelStyle={styles.primaryLabel}
                onPress={() => setPickupListVisible(false)}
                tone="soft"
                style={[styles.primary, styles.pickupBackButton]}
              />
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        ) : null}

        {searchVisible ? (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(220)}
            style={styles.searchOverlay}
          >
            <Pressable
              accessibilityLabel="Закрыть ввод адреса"
              onPress={closeSearch}
              style={styles.searchBackdrop}
            />
            <GestureDetector gesture={searchSwipe.gesture}>
              <Animated.View
                entering={SlideInDown.duration(360)}
                exiting={SlideOutDown.duration(280)}
                onLayout={(event) => searchSwipe.onLayout(event.nativeEvent.layout.height)}
                style={[
                  styles.searchPanel,
                  {
                    marginTop: Math.max(insets.top + 20, 68),
                    paddingBottom: Math.max(insets.bottom, 12),
                  },
                  searchSwipe.animatedStyle,
                ]}
              >
                <View style={styles.searchHandle} />
                <View style={styles.searchField}>
                  <TextInput
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    autoFocus
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
                  <SwipeDismissScrollProvider scrollOffsetY={searchSwipe.scrollOffsetY}>
                    <SwipeDismissScrollView
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                      style={styles.suggestionList}
                    >
                      {suggestions.map((suggestion) => (
                        <Pressable
                          key={suggestion.id}
                          onPress={() => void chooseSuggestion(suggestion)}
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
                    </SwipeDismissScrollView>
                  </SwipeDismissScrollProvider>
                ) : null}
              </Animated.View>
            </GestureDetector>
          </Animated.View>
        ) : null}
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
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
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    ...shadow,
  },
  switcher: {
    flex: 1,
    height: 48,
    padding: 3,
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
    marginTop: -2,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.white,
    ...shadow,
  },
  deliveryPanel: {
    minHeight: 226,
  },
  pickupIntroPanel: {
    minHeight: 226,
  },
  pickupDetailPanel: {
    minHeight: 432,
  },
  title: {
    marginTop: 27,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.55,
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
    fontSize: 16,
    lineHeight: 21,
  },
  deliveryAddressInput: {
    paddingHorizontal: 0,
    textAlign: "center",
  },
  addressPlaceholder: {
    color: "#9B9B9B",
  },
  deliveryAddressField: {
    marginTop: 26,
  },
  mapLocateButton: {
    position: "absolute",
    zIndex: 5,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 17,
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
    marginTop: 14,
    borderRadius: 16,
  },
  primaryLabel: {
    fontSize: 16,
  },
  pickupDescription: {
    marginTop: 16,
    color: "#4E4E4E",
    fontSize: 16,
    lineHeight: 21,
  },
  pickupTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickupBasketImage: {
    width: 44,
    height: 44,
    marginTop: 25,
  },
  pickupListButton: {
    marginTop: 26,
  },
  pickupDetailTitle: {
    maxWidth: "96%",
    fontSize: 31,
    lineHeight: 37,
  },
  pickupDistanceRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pickupClosed: {
    marginTop: 10,
    color: colors.orange,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  pickupDistance: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: "700",
  },
  pickupDetailHours: {
    marginTop: 24,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 21,
  },
  pickupDetailDescription: {
    marginTop: 18,
    color: "#3D3D3D",
    fontSize: 15,
    lineHeight: 20,
  },
  pickupActionRow: {
    marginTop: "auto",
    flexDirection: "row",
    gap: 14,
  },
  pickupChooseButton: {
    flex: 1.8,
    marginTop: 20,
  },
  pickupRouteButton: {
    flex: 1,
    minHeight: 52,
    marginTop: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
  },
  routeLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  pickupCancelButton: {
    marginTop: 14,
  },
  pickupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
    justifyContent: "flex-end",
  },
  pickupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,24,24,0.23)",
  },
  pickupSheet: {
    paddingTop: 32,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.white,
    ...shadow,
  },
  pickupSheetTitle: {
    paddingHorizontal: 4,
    color: colors.ink,
    fontFamily: "Inter_600SemiBold",
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.45,
  },
  pickupSheetList: {
    flex: 1,
    marginTop: 16,
  },
  pickupRow: {
    minHeight: 74,
    paddingHorizontal: 4,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickupRowPressed: {
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  pickupRowCopy: {
    flex: 1,
    minWidth: 0,
  },
  pickupRowAddress: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "500",
  },
  pickupRowHours: {
    marginTop: 3,
    color: "#A0A0A0",
    fontSize: 14,
    lineHeight: 18,
  },
  pickupRowDistance: {
    minWidth: 74,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 3,
  },
  pickupRowDistanceText: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: "700",
  },
  pickupSheetButton: {
    marginTop: 12,
  },
  pickupBackButton: {
    marginTop: 14,
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "flex-end",
  },
  searchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28,28,28,0.38)",
  },
  searchPanel: {
    flex: 1,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  searchHandle: {
    width: 42,
    height: 5,
    marginBottom: 10,
    alignSelf: "center",
    borderRadius: 3,
    backgroundColor: "#D7D7D7",
  },
  searchField: {
    height: 54,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 18,
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
    marginTop: 13,
  },
  suggestionRow: {
    minHeight: 70,
    marginHorizontal: 40,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 0,
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "500",
  },
  suggestionSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 18,
  },
  searchError: {
    paddingVertical: 28,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
