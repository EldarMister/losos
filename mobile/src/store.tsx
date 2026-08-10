import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthSession,
  CartLine,
  DeliveryLocation,
  DeliveryType,
  Product,
  Region,
  SelectedModifier,
} from "./types";
import { clearSession, readSession, writeSession } from "./session";

const STORAGE_KEY = "nakta.mobile.v2";
const LEGACY_STORAGE_KEY = "losos.mobile.v1";

type PersistedState = {
  onboarded: boolean;
  cart: CartLine[];
  regionSlug: string;
  deliveryType: DeliveryType;
  location: DeliveryLocation | null;
  notificationsAsked: boolean;
  utensilsCount: number;
  noUtensils: boolean;
};

type StoreValue = PersistedState & {
  hydrated: boolean;
  session: AuthSession | null;
  regions: Region[];
  activeRegion: Region | null;
  cartCount: number;
  cartTotal: number;
  setOnboarded: (value: boolean) => void;
  setNotificationsAsked: (value: boolean) => void;
  setRegionSlug: (value: string) => void;
  setDeliveryType: (value: DeliveryType) => void;
  setLocation: (value: DeliveryLocation | null) => void;
  setRegions: (value: Region[]) => void;
  signIn: (value: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
  setUtensilsCount: (value: number) => void;
  setNoUtensils: (value: boolean) => void;
  addCartLine: (
    product: Product,
    quantity: number,
    modifiers: SelectedModifier[],
  ) => void;
  incrementCartProduct: (productId: number) => void;
  decrementCartProduct: (productId: number) => void;
  setCartQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  syncCartProducts: (products: Product[]) => void;
};

const initialState: PersistedState = {
  onboarded: false,
  cart: [],
  regionSlug: "bishkek",
  deliveryType: "delivery",
  location: null,
  notificationsAsked: false,
  utensilsCount: 1,
  noUtensils: false,
};

const StoreContext = createContext<StoreValue | null>(null);

export function lineTotal(line: CartLine) {
  const extras = line.modifiers.reduce((sum, modifier) => (
    sum + modifier.price
      * modifier.quantity
      * (modifier.priceScope === "per-product" ? line.quantity : 1)
  ), 0);
  return line.product.price * line.quantity + extras;
}

function lineKey(product: Product, modifiers: SelectedModifier[]) {
  const signature = modifiers
    .map((item) => `${item.groupId}:${item.itemId}:${item.quantity}`)
    .sort()
    .join("|");
  return `${product.id}:${signature}`;
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedState>;
  return (
    typeof candidate.onboarded === "boolean" &&
    Array.isArray(candidate.cart) &&
    typeof candidate.regionSlug === "string" &&
    (candidate.deliveryType === "delivery" || candidate.deliveryType === "pickup")
  );
}

export function restorePersistedState(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPersistedState(parsed) ? { ...initialState, ...parsed } : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_STORAGE_KEY),
      readSession(),
    ])
      .then(([raw, legacyRaw, storedSession]) => {
        const persistedRaw = raw || legacyRaw;
        const restored = restorePersistedState(persistedRaw);
        if (restored) setState(restored);
        if (storedSession) setSession(storedSession);
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
    }, 280);
    return () => clearTimeout(timer);
  }, [hydrated, state]);

  const patch = useCallback((value: Partial<PersistedState>) => {
    setState((current) => ({ ...current, ...value }));
  }, []);

  const addCartLine = useCallback((
    product: Product,
    quantity: number,
    modifiers: SelectedModifier[],
  ) => {
    const key = lineKey(product, modifiers);
    setState((current) => {
      const existing = current.cart.find((line) => line.key === key);
      const cart = existing
        ? current.cart.map((line) => (
          line.key === key
            ? { ...line, quantity: Math.min(20, line.quantity + quantity) }
            : line
        ))
        : [...current.cart, { key, product, quantity, modifiers }];
      return { ...current, cart };
    });
  }, []);

  const setCartQuantity = useCallback((key: string, quantity: number) => {
    setState((current) => ({
      ...current,
      cart: quantity <= 0
        ? current.cart.filter((line) => line.key !== key)
        : current.cart.map((line) => (
          line.key === key ? { ...line, quantity: Math.min(20, quantity) } : line
        )),
    }));
  }, []);

  const incrementCartProduct = useCallback((productId: number) => {
    setState((current) => {
      const lineIndex = current.cart.findLastIndex((line) => line.product.id === productId);
      if (lineIndex < 0) return current;
      const cart = current.cart.map((line, index) => (
        index === lineIndex
          ? { ...line, quantity: Math.min(20, line.quantity + 1) }
          : line
      ));
      return { ...current, cart };
    });
  }, []);

  const decrementCartProduct = useCallback((productId: number) => {
    setState((current) => {
      const lineIndex = current.cart.findLastIndex((line) => line.product.id === productId);
      if (lineIndex < 0) return current;
      const currentLine = current.cart[lineIndex];
      const cart = currentLine.quantity <= 1
        ? current.cart.filter((_, index) => index !== lineIndex)
        : current.cart.map((line, index) => (
          index === lineIndex ? { ...line, quantity: line.quantity - 1 } : line
        ));
      return { ...current, cart };
    });
  }, []);

  const syncCartProducts = useCallback((products: Product[]) => {
    const byId = new Map(products.map((product) => [product.id, product]));
    setState((current) => ({
      ...current,
      cart: current.cart.flatMap((line) => {
        const product = byId.get(line.product.id);
        if (!product || product.available === false) return [];
        return [{ ...line, product }];
      }),
    }));
  }, []);

  const value = useMemo<StoreValue>(() => {
    const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = state.cart.reduce((sum, line) => sum + lineTotal(line), 0);
    const activeRegion = regions.find((region) => region.slug === state.regionSlug) ?? null;
    return {
      ...state,
      hydrated,
      session,
      regions,
      activeRegion,
      cartCount,
      cartTotal,
      setOnboarded: (onboarded) => patch({ onboarded }),
      setNotificationsAsked: (notificationsAsked) => patch({ notificationsAsked }),
      setRegionSlug: (regionSlug) => patch({ regionSlug }),
      setDeliveryType: (deliveryType) => patch({ deliveryType }),
      setLocation: (location) => patch({ location }),
      setRegions,
      signIn: async (nextSession) => {
        await writeSession(nextSession);
        setSession(nextSession);
      },
      signOut: async () => {
        await clearSession();
        setSession(null);
      },
      setUtensilsCount: (utensilsCount) => patch({
        utensilsCount: Math.min(10, Math.max(1, utensilsCount)),
      }),
      setNoUtensils: (noUtensils) => patch({ noUtensils }),
      addCartLine,
      incrementCartProduct,
      decrementCartProduct,
      setCartQuantity,
      clearCart: () => patch({ cart: [] }),
      syncCartProducts,
    };
  }, [
    addCartLine,
    decrementCartProduct,
    hydrated,
    incrementCartProduct,
    patch,
    regions,
    session,
    setCartQuantity,
    syncCartProducts,
    state,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
