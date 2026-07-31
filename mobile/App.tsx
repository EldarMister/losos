import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_900Black } from "@expo-google-fonts/inter/900Black";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { catalogApi } from "./src/api";
import { CartSheet } from "./src/components/CartSheet";
import { DeliveryInfoSheet } from "./src/components/DeliveryInfoSheet";
import { LocationSheet } from "./src/components/LocationSheet";
import { MenuSheet } from "./src/components/MenuSheet";
import { NaktaCoinsSheet } from "./src/components/NaktaCoinsSheet";
import { NotificationPermissionPrompt } from "./src/components/NotificationPermissionPrompt";
import { ProductSheet } from "./src/components/ProductSheet";
import { PromotionViewer } from "./src/components/PromotionViewer";
import { SearchSheet } from "./src/components/SearchSheet";
import {
  registerOrderPush,
  syncChangedOrderPushToken,
  unregisterOrderPush,
} from "./src/pushNotifications";
import { notificationOrderId } from "./src/notificationRouting";
import { canStartCheckout } from "./src/navigationRules";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { OrderDetailsScreen } from "./src/screens/OrderDetailsScreen";
import { OrderSuccessScreen } from "./src/screens/OrderSuccessScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { StoreProvider, useStore } from "./src/store";
import { colors } from "./src/theme";
import type { AuthSession, CreatedOrder, Product, Promotion } from "./src/types";

type RootStackParamList = {
  Catalog: undefined;
  Auth: { next?: "checkout" | "profile" | "order"; orderId?: string } | undefined;
  Checkout: undefined;
  Success: { order: CreatedOrder };
  Profile: { section?: "orders" | "balance" | "settings" } | undefined;
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.orange,
    background: colors.white,
    card: colors.white,
    text: colors.ink,
    border: colors.border,
  },
  fonts: {
    regular: { fontFamily: "Inter_400Regular", fontWeight: "400" },
    medium: { fontFamily: "Inter_500Medium", fontWeight: "500" },
    bold: { fontFamily: "Inter_700Bold", fontWeight: "700" },
    heavy: { fontFamily: "Inter_900Black", fontWeight: "900" },
  },
};

type CatalogProps = NativeStackScreenProps<RootStackParamList, "Catalog">;

function CatalogRoute({ navigation }: CatalogProps) {
  const store = useStore();
  const [locationVisible, setLocationVisible] = useState(false);
  const [deliveryInfoVisible, setDeliveryInfoVisible] = useState(false);
  const [cashbackVisible, setCashbackVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promotionVisible, setPromotionVisible] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionIndex, setPromotionIndex] = useState(0);

  useEffect(() => {
    if (!store.location) setLocationVisible(true);
  }, [store.location]);

  const finishMenuAction = (action: () => void, delay = 120) => {
    setTimeout(() => {
      setPromotionVisible(false);
      action();
      setMenuVisible(false);
    }, delay);
  };

  const openProfile = () => {
    finishMenuAction(() => {
      if (store.session) navigation.navigate("Profile", { section: "settings" });
      else navigation.navigate("Auth", { next: "profile" });
    });
  };

  const openProfileSection = (section: "orders" | "balance") => {
    finishMenuAction(() => navigation.navigate("Profile", { section }));
  };

  const openSavedAddresses = () => {
    setTimeout(() => {
      setPromotionVisible(false);
      setMenuVisible(false);
    }, 120);
    setTimeout(() => setLocationVisible(true), 470);
  };

  return (
    <>
      <CatalogScreen
        onOpenCart={() => setCartVisible(true)}
        onOpenCashback={() => setCashbackVisible(true)}
        onOpenDeliveryInfo={() => setDeliveryInfoVisible(true)}
        onOpenLocation={() => setLocationVisible(true)}
        onOpenMenu={() => setMenuVisible(true)}
        onOpenProduct={setSelectedProduct}
        onOpenPromotion={(_, index, all) => {
          if (menuVisible) return;
          setPromotions(all);
          setPromotionIndex(index);
          setPromotionVisible(true);
        }}
        onOpenSearch={() => setSearchVisible(true)}
      />
      <MenuSheet
        onClose={() => setMenuVisible(false)}
        onOpenAddresses={openSavedAddresses}
        onOpenBalance={() => openProfileSection("balance")}
        onOpenOrders={() => openProfileSection("orders")}
        onOpenProfile={openProfile}
        onLogout={() => {
          const session = store.session;
          setMenuVisible(false);
          void (async () => {
            if (session) await unregisterOrderPush(session).catch(() => undefined);
            await store.signOut();
          })();
        }}
        visible={menuVisible}
      />
      <LocationSheet
        onClose={() => setLocationVisible(false)}
        required={!store.location}
        visible={locationVisible}
      />
      <DeliveryInfoSheet
        onClose={() => setDeliveryInfoVisible(false)}
        visible={deliveryInfoVisible}
      />
      <NaktaCoinsSheet
        onClose={() => setCashbackVisible(false)}
        visible={cashbackVisible}
      />
      <SearchSheet
        onClose={() => setSearchVisible(false)}
        onOpenCart={() => setCartVisible(true)}
        onOpenProduct={(product) => {
          setSearchVisible(false);
          setSelectedProduct(product);
        }}
        visible={searchVisible}
      />
      <ProductSheet
        onClose={() => setSelectedProduct(null)}
        onOpenProduct={setSelectedProduct}
        product={selectedProduct}
      />
      <CartSheet
        onCheckout={() => {
          setCartVisible(false);
          if (canStartCheckout(store.session, store.cartCount)) navigation.navigate("Checkout");
          else navigation.navigate("Auth", { next: "checkout" });
        }}
        onClose={() => setCartVisible(false)}
        visible={cartVisible}
      />
      <PromotionViewer
        initialIndex={promotionIndex}
        onClose={() => setPromotionVisible(false)}
        promotions={promotions}
        visible={promotionVisible}
      />
    </>
  );
}

type AuthProps = NativeStackScreenProps<RootStackParamList, "Auth">;

function AuthRoute({ navigation, route }: AuthProps) {
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Catalog");
  };
  const onSuccess = (session: AuthSession) => {
    void registerOrderPush(session, true).catch(() => undefined);
    if (route.params?.next === "checkout") navigation.replace("Checkout");
    else if (route.params?.next === "order" && route.params.orderId) {
      navigation.replace("OrderDetails", { orderId: route.params.orderId });
    } else if (route.params?.next === "profile") navigation.replace("Profile");
    else navigation.replace("Catalog");
  };
  return <AuthScreen onBack={goBack} onSuccess={onSuccess} />;
}

type CheckoutProps = NativeStackScreenProps<RootStackParamList, "Checkout">;

function CheckoutRoute({ navigation }: CheckoutProps) {
  const store = useStore();
  useEffect(() => {
    if (!store.session) navigation.replace("Auth", { next: "checkout" });
  }, [navigation, store.session]);
  if (!store.session) return null;
  return (
    <CheckoutScreen
      onBack={() => navigation.goBack()}
      onSuccess={(order) => navigation.replace("Success", { order })}
    />
  );
}

type SuccessProps = NativeStackScreenProps<RootStackParamList, "Success">;

function SuccessRoute({ navigation, route }: SuccessProps) {
  return (
    <OrderSuccessScreen
      onDone={() => navigation.reset({ index: 0, routes: [{ name: "Catalog" }] })}
      order={route.params.order}
    />
  );
}

type ProfileProps = NativeStackScreenProps<RootStackParamList, "Profile">;

function ProfileRoute({ navigation, route }: ProfileProps) {
  const store = useStore();
  if (!store.session) {
    return (
      <AuthScreen
        onBack={() => navigation.goBack()}
        onSuccess={() => navigation.replace("Profile")}
      />
    );
  }
  return (
    <ProfileScreen
      onBack={() => navigation.goBack()}
      onLogout={() => {
        const session = store.session;
        void (async () => {
          if (session) await unregisterOrderPush(session).catch(() => undefined);
          await store.signOut();
          navigation.reset({ index: 0, routes: [{ name: "Catalog" }] });
        })();
      }}
      onOpenOrder={(orderId) => navigation.navigate("OrderDetails", { orderId })}
      section={route.params?.section ?? "settings"}
    />
  );
}

type OrderDetailsProps = NativeStackScreenProps<RootStackParamList, "OrderDetails">;

function OrderDetailsRoute({ navigation, route }: OrderDetailsProps) {
  const store = useStore();
  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("Catalog");
  };
  if (!store.session) {
    return (
      <AuthScreen
        onBack={goBack}
        onSuccess={() => navigation.replace("OrderDetails", { orderId: route.params.orderId })}
      />
    );
  }
  return <OrderDetailsScreen onBack={goBack} orderId={route.params.orderId} />;
}

function MobileApp() {
  const store = useStore();
  const [openLoginAfterOnboarding, setOpenLoginAfterOnboarding] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [notificationPromptVisible, setNotificationPromptVisible] = useState(false);
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState(false);

  useEffect(() => {
    if (!store.hydrated) return;
    catalogApi.regions()
      .then(store.setRegions)
      .catch(() => undefined);
  }, [store.hydrated]);

  useEffect(() => {
    if (!store.session) return;
    void registerOrderPush(store.session, false).catch(() => undefined);
  }, [store.session]);

  useEffect(() => {
    if (!store.hydrated || !store.session || store.notificationsAsked) {
      setNotificationPromptVisible(false);
      return undefined;
    }
    let active = true;
    void Notifications.getPermissionsAsync()
      .then((permission) => {
        if (!active) return;
        if (permission.status === "granted") {
          store.setNotificationsAsked(true);
        } else {
          setNotificationPromptVisible(true);
        }
      })
      .catch(() => {
        if (active) setNotificationPromptVisible(true);
      });
    return () => {
      active = false;
    };
  }, [store.hydrated, store.notificationsAsked, store.session]);

  const denyNotifications = () => {
    if (requestingNotificationPermission) return;
    store.setNotificationsAsked(true);
    setNotificationPromptVisible(false);
  };

  const allowNotifications = async () => {
    if (!store.session || requestingNotificationPermission) return;
    setRequestingNotificationPermission(true);
    try {
      await registerOrderPush(store.session, true);
    } catch {
      // Registration is retried on the next session when permission was granted.
    } finally {
      store.setNotificationsAsked(true);
      setRequestingNotificationPermission(false);
      setNotificationPromptVisible(false);
    }
  };

  useEffect(() => {
    if (!store.session) return;
    const session = store.session;
    const subscription = Notifications.addPushTokenListener((devicePushToken) => {
      void syncChangedOrderPushToken(session, devicePushToken).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [store.session]);

  const openOrder = useCallback((orderId: string) => {
    if (!navigationRef.isReady()) {
      setPendingOrderId(orderId);
      return;
    }
    if (store.session) navigationRef.navigate("OrderDetails", { orderId });
    else navigationRef.navigate("Auth", { next: "order", orderId });
  }, [store.session]);

  useEffect(() => {
    if (!store.hydrated) return;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const orderId = notificationOrderId(response);
      if (orderId) {
        openOrder(orderId);
        void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const orderId = notificationOrderId(response);
      if (orderId) openOrder(orderId);
    });
    return () => subscription.remove();
  }, [openOrder, store.hydrated]);

  if (!store.hydrated) return <Splash />;

  if (!store.onboarded) {
    return (
      <OnboardingScreen
        onComplete={() => undefined}
        onLogin={() => setOpenLoginAfterOnboarding(true)}
      />
    );
  }

  return (
    <>
      <NavigationContainer
      linking={{
        prefixes: ["naktasushi://"],
        config: { screens: { OrderDetails: "orders/:orderId" } },
      }}
      onReady={() => {
        if (openLoginAfterOnboarding) {
          setOpenLoginAfterOnboarding(false);
          if (pendingOrderId) {
            const orderId = pendingOrderId;
            setPendingOrderId(null);
            navigationRef.navigate("Auth", { next: "order", orderId });
          } else {
            navigationRef.navigate("Auth");
          }
        } else if (pendingOrderId) {
          setPendingOrderId(null);
          openOrder(pendingOrderId);
        }
      }}
      ref={navigationRef}
      theme={navigationTheme}
    >
      <Stack.Navigator initialRouteName="Catalog" screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen component={CatalogRoute} name="Catalog" />
        <Stack.Screen component={AuthRoute} name="Auth" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen component={CheckoutRoute} name="Checkout" />
        <Stack.Screen component={SuccessRoute} name="Success" options={{ gestureEnabled: false }} />
        <Stack.Screen component={ProfileRoute} name="Profile" />
        <Stack.Screen component={OrderDetailsRoute} name="OrderDetails" />
      </Stack.Navigator>
      </NavigationContainer>
      <NotificationPermissionPrompt
        busy={requestingNotificationPermission}
        onAllow={() => void allowNotifications()}
        onDeny={denyNotifications}
        visible={notificationPromptVisible}
      />
    </>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashMark}>
        <MaterialCommunityIcons name="fish" size={54} color={colors.white} />
      </View>
      <Text style={styles.splashTitle}>Накта суши</Text>
      <ActivityIndicator color={colors.white} style={styles.splashLoader} />
    </View>
  );
}

function AppWithFonts() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });
  if (!fontsLoaded) return <Splash />;
  return <MobileApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <AppWithFonts />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  splashMark: {
    width: 116,
    height: 116,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  splashTitle: {
    marginTop: 20,
    color: colors.white,
    fontFamily: "Inter_900Black",
    fontSize: 27,
  },
  splashLoader: { marginTop: 22 },
});
