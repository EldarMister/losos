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
  CartLine,
  DeliveryLocation,
  DeliveryType,
  Product,
  SelectedModifier,
} from "./types";

const STORAGE_KEY = "losos.mobile.v1";

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
  cartCount: number;
  cartTotal: number;
  setOnboarded: (value: boolean) => void;
  setNotificationsAsked: (value: boolean) => void;
  setRegionSlug: (value: string) => void;
  setDeliveryType: (value: DeliveryType) => void;
  setLocation: (value: DeliveryLocation | null) => void;
  setUtensilsCount: (value: number) => void;
  setNoUtensils: (value: boolean) => void;
  addCartLine: (
    product: Product,
    quantity: number,
    modifiers: SelectedModifier[],
  ) => void;
  setCartQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
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

export function StoreProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isPersistedState(parsed)) {
          setState({ ...initialState, ...parsed });
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
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

  const value = useMemo<StoreValue>(() => {
    const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = state.cart.reduce((sum, line) => sum + lineTotal(line), 0);
    return {
      ...state,
      hydrated,
      cartCount,
      cartTotal,
      setOnboarded: (onboarded) => patch({ onboarded }),
      setNotificationsAsked: (notificationsAsked) => patch({ notificationsAsked }),
      setRegionSlug: (regionSlug) => patch({ regionSlug }),
      setDeliveryType: (deliveryType) => patch({ deliveryType }),
      setLocation: (location) => patch({ location }),
      setUtensilsCount: (utensilsCount) => patch({
        utensilsCount: Math.min(10, Math.max(1, utensilsCount)),
      }),
      setNoUtensils: (noUtensils) => patch({ noUtensils }),
      addCartLine,
      setCartQuantity,
      clearCart: () => patch({ cart: [] }),
    };
  }, [addCartLine, hydrated, patch, setCartQuantity, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
