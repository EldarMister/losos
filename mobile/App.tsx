import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartSheet } from "./src/components/CartSheet";
import { LocationSheet } from "./src/components/LocationSheet";
import { ProductSheet } from "./src/components/ProductSheet";
import { PromotionViewer } from "./src/components/PromotionViewer";
import { SearchSheet } from "./src/components/SearchSheet";
import { CatalogScreen } from "./src/screens/CatalogScreen";
import { CheckoutScreen } from "./src/screens/CheckoutScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { OrderSuccessScreen } from "./src/screens/OrderSuccessScreen";
import { StoreProvider, useStore } from "./src/store";
import { colors } from "./src/theme";
import type { CreatedOrder, Product, Promotion } from "./src/types";

type Screen = "catalog" | "checkout" | "success";

function MobileApp() {
  const store = useStore();
  const [screen, setScreen] = useState<Screen>("catalog");
  const [locationVisible, setLocationVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promotionVisible, setPromotionVisible] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionIndex, setPromotionIndex] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    if (store.hydrated && store.onboarded && !store.location) {
      setLocationVisible(true);
    }
  }, [store.hydrated, store.location, store.onboarded]);

  if (!store.hydrated) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashMark}>
          <MaterialCommunityIcons name="fish" size={54} color={colors.white} />
        </View>
        <Text style={styles.splashTitle}>Много лосося</Text>
        <ActivityIndicator color={colors.white} style={styles.splashLoader} />
      </View>
    );
  }

  if (!store.onboarded) {
    return <OnboardingScreen onComplete={() => setLocationVisible(true)} />;
  }

  if (screen === "checkout") {
    return (
      <CheckoutScreen
        onBack={() => {
          setScreen("catalog");
          setCartVisible(true);
        }}
        onSuccess={(order) => {
          setCreatedOrder(order);
          setScreen("success");
        }}
      />
    );
  }

  if (screen === "success" && createdOrder) {
    return (
      <OrderSuccessScreen
        onDone={() => {
          setCreatedOrder(null);
          setScreen("catalog");
        }}
        order={createdOrder}
      />
    );
  }

  return (
    <>
      <CatalogScreen
        onOpenCart={() => setCartVisible(true)}
        onOpenLocation={() => setLocationVisible(true)}
        onOpenProduct={setSelectedProduct}
        onOpenPromotion={(_, index, all) => {
          setPromotions(all);
          setPromotionIndex(index);
          setPromotionVisible(true);
        }}
        onOpenSearch={() => setSearchVisible(true)}
      />

      <LocationSheet
        onClose={() => setLocationVisible(false)}
        required={!store.location}
        visible={locationVisible}
      />
      <SearchSheet
        onClose={() => setSearchVisible(false)}
        onOpenProduct={(product) => {
          setSearchVisible(false);
          setSelectedProduct(product);
        }}
        visible={searchVisible}
      />
      <ProductSheet
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
      <CartSheet
        onCheckout={() => {
          setCartVisible(false);
          setScreen("checkout");
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

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <MobileApp />
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
    fontSize: 27,
    fontWeight: "900",
  },
  splashLoader: {
    marginTop: 22,
  },
});
