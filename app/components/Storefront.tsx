"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { categories, promoCards, type Category, type Product } from "../data/catalog";
import { YandexDeliveryMap, type DeliveryLocation } from "./YandexDeliveryMap";

type SelectedModifier = {
  groupId: string;
  groupTitle: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  priceScope: "per-product" | "per-line";
};
type ModifierSelections = Record<string, Record<string, number>>;
type CartLine = {
  key: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  modifiers: SelectedModifier[];
};
type PendingCartLine = {
  product: Product;
  quantity: number;
  modifiers: SelectedModifier[];
};
type DeliveryType = "delivery" | "pickup";
type RegionOption = { slug: "bishkek" | "osh"; name: string };
type Promotion = { id: number; title: string; image: string; cta?: string; ctaUrl?: string };
type CheckoutForm = {
  customerName: string;
  phone: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  paymentMethod: "cash" | "card_on_delivery";
};
type PlacedOrder = { id: string; orderNumber?: number; total: number; status: string };
type PersistedStorefrontState = {
  cart: CartLine[];
  deliveryType: DeliveryType;
  address: string;
  pickupLocationSelected: boolean;
  utensilsCount: number;
  noUtensils: boolean;
  deliveryLocation: DeliveryLocation | null;
};

const defaultRegions: RegionOption[] = [
  { slug: "bishkek", name: "Бишкек" },
  { slug: "osh", name: "Ош" },
];

const STOREFRONT_STORAGE_KEY = "losos.storefront.v1";
const STOREFRONT_STORAGE_VERSION = 1;
const MAX_MODIFIER_ITEM_QUANTITY = 99;
const MAX_MODIFIER_UNITS = 500;
const STOREFRONT_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");
const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " сом";
const cartKitItems = [
  {
    name: "Соевый соус",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/8a6ed9632df66e2010fc4a1eccef758c_thumb_75_1152_1152.JPEG",
  },
  {
    name: "Васаби",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/aa8eef7dfdda0436a337ddb4c0970125_thumb_75_1152_1152.JPEG",
  },
  {
    name: "Имбирь маринованный",
    image: "https://thapl-public.storage.yandexcloud.net/thapl-project172/img/CatalogItem/a71852e053134d8a7863bc1ce6a13ece_thumb_75_1152_1152.JPEG",
  },
] as const;
const cartLineKey = (productId: number, modifiers: SelectedModifier[]) => {
  const signature = modifiers
    .map((modifier) => `${modifier.groupId}:${modifier.itemId}:${modifier.quantity}:${modifier.priceScope}`)
    .sort()
    .join("|");
  return `${productId}:${signature}`;
};
const modifierCharge = (modifier: SelectedModifier, productQuantity: number) => (
  modifier.price
  * modifier.quantity
  * (modifier.priceScope === "per-product" ? productQuantity : 1)
);
const configuredProductTotal = (
  product: Product,
  quantity: number,
  modifiers: SelectedModifier[],
) => (
  product.price * quantity
  + modifiers.reduce((sum, modifier) => sum + modifierCharge(modifier, quantity), 0)
);
const cartLineTotal = (line: CartLine) => (
  configuredProductTotal(line.product, line.quantity, line.modifiers)
);
const modifierItemMaximum = (
  group: NonNullable<Product["modifierGroups"]>[number],
  item: NonNullable<Product["modifierGroups"]>[number]["items"][number],
) => Math.min(
  MAX_MODIFIER_ITEM_QUANTITY,
  Math.max(1, item.maxQuantity ?? (group.selectionType === "single" ? 1 : 20)),
);
const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);
const boundedString = (value: unknown, maximum: number) => (
  typeof value === "string" ? value.trim().slice(0, maximum) : ""
);
const isValidDeliveryCoordinates = (value: unknown): value is [number, number] => (
  Array.isArray(value) &&
  value.length === 2 &&
  Number.isFinite(value[0]) &&
  Number.isFinite(value[1]) &&
  value[0] >= -90 &&
  value[0] <= 90 &&
  value[1] >= -180 &&
  value[1] <= 180
);
const restoreStoredDeliveryLocation = (value: unknown): DeliveryLocation | null => {
  if (!isRecord(value) || !isValidDeliveryCoordinates(value.coordinates)) return null;
  const address = boundedString(value.address, 300);
  if (!address) return null;
  return { address, coordinates: value.coordinates };
};
const restoreStoredProduct = (value: unknown): Product | null => {
  if (!isRecord(value)) return null;
  const id = value.id;
  const price = value.price;
  const slug = boundedString(value.slug, 200);
  const category = boundedString(value.category, 200);
  const name = boundedString(value.name, 200);
  const image = boundedString(value.image, 2_048);
  if (
    !Number.isInteger(id) ||
    (id as number) <= 0 ||
    !Number.isInteger(price) ||
    (price as number) < 0 ||
    (price as number) > 10_000_000 ||
    !slug ||
    !category ||
    !name ||
    !/^(?:https?:\/\/|\/)/i.test(image) ||
    value.available === false
  ) return null;

  const product: Product = {
    id: id as number,
    slug,
    category,
    name,
    price: price as number,
    image,
    available: true,
  };
  const description = boundedString(value.description, 2_000);
  if (description) product.description = description;
  if (value.isNew === true) product.isNew = true;
  if (["wasabi", "popcorn", "batat", "cheese-sticks", "crab-salmon"].includes(String(value.referenceCard))) {
    product.referenceCard = value.referenceCard as NonNullable<Product["referenceCard"]>;
  }
  if (["popcorn", "wasabi"].includes(String(value.referenceDetail))) {
    product.referenceDetail = value.referenceDetail as NonNullable<Product["referenceDetail"]>;
  }
  return product;
};
const restoreStoredModifiers = (value: unknown): SelectedModifier[] | null => {
  if (!Array.isArray(value) || value.length > 24) return null;
  const restored: SelectedModifier[] = [];
  const uniqueIds = new Set<string>();
  let totalQuantity = 0;
  for (const candidate of value) {
    if (!isRecord(candidate)) return null;
    const groupId = boundedString(candidate.groupId, 120);
    const groupTitle = boundedString(candidate.groupTitle, 200);
    const itemId = boundedString(candidate.itemId, 120);
    const itemName = boundedString(candidate.itemName, 200);
    const price = candidate.price;
    const quantity = candidate.quantity === undefined ? 1 : candidate.quantity;
    const priceScope = candidate.priceScope === "per-line" ? "per-line" : "per-product";
    const identity = `${groupId}:${itemId}`;
    if (
      !groupId ||
      !groupTitle ||
      !itemId ||
      !itemName ||
      !Number.isInteger(price) ||
      (price as number) < 0 ||
      (price as number) > 1_000_000 ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_MODIFIER_ITEM_QUANTITY ||
      uniqueIds.has(identity)
    ) return null;
    totalQuantity += quantity as number;
    if (totalQuantity > MAX_MODIFIER_UNITS) return null;
    uniqueIds.add(identity);
    restored.push({
      groupId,
      groupTitle,
      itemId,
      itemName,
      price: price as number,
      quantity: quantity as number,
      priceScope,
    });
  }
  return restored;
};
const parseStoredStorefrontState = (
  rawValue: string | null,
  regionSlug: "bishkek" | "osh",
): PersistedStorefrontState | null => {
  if (!rawValue || rawValue.length > 250_000) return null;
  try {
    const value: unknown = JSON.parse(rawValue);
    if (
      !isRecord(value) ||
      value.version !== STOREFRONT_STORAGE_VERSION ||
      value.regionSlug !== regionSlug ||
      !Array.isArray(value.cart)
    ) return null;

    const cart: CartLine[] = [];
    for (const candidate of value.cart.slice(0, 100)) {
      if (!isRecord(candidate)) continue;
      const product = restoreStoredProduct(candidate.product);
      const modifiers = restoreStoredModifiers(candidate.modifiers);
      const quantity = candidate.quantity;
      if (
        !product ||
        !modifiers ||
        !Number.isInteger(quantity) ||
        (quantity as number) < 1 ||
        (quantity as number) > 20
      ) continue;
      const key = cartLineKey(product.id, modifiers);
      const unitPrice = product.price + modifiers.reduce(
        (sum, modifier) => sum + (
          modifier.priceScope === "per-product"
            ? modifier.price * modifier.quantity
            : 0
        ),
        0,
      );
      if (
        unitPrice > 10_000_000
        || configuredProductTotal(product, quantity as number, modifiers) > 100_000_000
      ) continue;
      const existing = cart.find((line) => line.key === key);
      if (existing) {
        existing.quantity = Math.min(20, existing.quantity + (quantity as number));
      } else {
        cart.push({ key, product, quantity: quantity as number, unitPrice, modifiers });
      }
    }

    const address = boundedString(value.address, 300);
    const deliveryType: DeliveryType = value.deliveryType === "pickup" ? "pickup" : "delivery";
    const utensilsCount = Number.isInteger(value.utensilsCount)
      ? Math.min(20, Math.max(0, value.utensilsCount as number))
      : 1;
    const restoredDeliveryLocation = deliveryType === "delivery"
      ? restoreStoredDeliveryLocation(value.deliveryLocation)
      : null;
    return {
      cart,
      deliveryType,
      address,
      pickupLocationSelected: Boolean(address && deliveryType === "pickup" && value.pickupLocationSelected === true),
      utensilsCount,
      noUtensils: value.noUtensils === true,
      deliveryLocation: restoredDeliveryLocation?.address === address ? restoredDeliveryLocation : null,
    };
  } catch {
    return null;
  }
};
const normalizePhone = (value: string) => {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("996")) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith("7")) return `+${digits.slice(0, 11)}`;
  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  return trimmed;
};

const writeOverlayQuery = (name: "product" | "storyInspect", value: string | null, mode: "push" | "replace") => {
  const url = new URL(window.location.href);
  const other = name === "product" ? "storyInspect" : "product";
  url.searchParams.delete(other);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  const state = { ...(window.history.state || {}), storefrontOverlay: value ? name : null };
  window.history[`${mode}State`](state, "", url);
};

type StoryGroup = {
  title: string;
  kind: "student" | "telegram" | "pleasure" | "kids" | "cashback" | "sticks" | "cats";
  pages: Array<{ src: string }>;
  cta?: string;
  ctaUrl?: string;
};

const defaultStoryGroups: StoryGroup[] = [
  {
    title: "Скидка студентам",
    kind: "student",
    cta: "Заполнить форму",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/b92972a55683d636714fea75d11469ce_resize_in_box_2048_2048.png" }],
  },
  {
    title: "Telegram: промокоды и мемы",
    kind: "telegram",
    cta: "Подарки в студию!",
    ctaUrl: "https://t.me/mnogolososya",
    pages: [{ src: "/reference-telegram-story.png" }],
  },
  {
    title: "Много лосося — удовольствие есть",
    kind: "pleasure",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/19fb66365769d651613e33c969235601_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Всё вкусное — детям!",
    kind: "kids",
    cta: "Кавабанга!",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/2720f66e5f628289ea1c761222a24eb4_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Кешбэк до 100%",
    kind: "cashback",
    pages: [
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/e258569da4e992205d8f3ae006d151eb_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/268df916388b662e094cc8fdbab4095f_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/5f085f197e1afcf72c9ac61c8959140f_resize_in_box_2048_2048.jpg" },
      { src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/ce627f513c731ba28069085078e433dc_resize_in_box_2048_2048.jpg" },
    ],
  },
  {
    title: "Мноооооого палочки?",
    kind: "sticks",
    cta: "Хорошо",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/1ebd0558c6daa570f029071ce7bb1648_resize_in_box_2048_2048.jpg" }],
  },
  {
    title: "Помогаем котикам вместе",
    kind: "cats",
    cta: "Мяу!",
    pages: [{ src: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/7c7596a0dba0e9fff9f96d6e65df547d_resize_in_box_2048_2048.jpg" }],
  },
];

const promotionTitleAliases: Record<string, string> = {
  "Промокоды и подарки": "Telegram: промокоды и мемы",
  "Удовольствие есть": "Много лосося — удовольствие есть",
};

const promotionArtifactTitles = new Set(["memories/test", "test", "тест"]);
const normalizedPromotionTitle = (title: string) => title.trim().toLocaleLowerCase("ru-RU");

const reconcilePromotions = (promotions: Promotion[]) => {
  const normalized = promotions
    .filter((promotion) => !promotionArtifactTitles.has(normalizedPromotionTitle(promotion.title)))
    .map((promotion) => ({
      ...promotion,
      title: promotionTitleAliases[promotion.title] || promotion.title,
    }));
  const canonicalTitles = new Set(defaultStoryGroups.map((group) => group.title));
  const stories: StoryGroup[] = defaultStoryGroups.map((group) => ({ ...group }));
  const cards: Promotion[] = defaultStoryGroups.map((group, index) => {
    const remote = normalized.find((promotion) => promotion.title === group.title);
    const referenceCard = promoCards.find((card) => card.alt === group.title);
    return {
      id: remote?.id ?? -(index + 1),
      title: group.title,
      image: referenceCard?.src || group.pages[0].src,
      cta: group.cta,
      ctaUrl: group.ctaUrl,
    };
  });

  normalized
    .filter((promotion) => !canonicalTitles.has(promotion.title))
    .forEach((promotion) => {
      stories.push({
        title: promotion.title,
        kind: "pleasure",
        pages: [{ src: promotion.image }],
        cta: promotion.cta || undefined,
        ctaUrl: promotion.ctaUrl || undefined,
      });
      cards.push(promotion);
    });

  return { cards, stories };
};

function ProductArt({ product, mode, loading }: { product: Product; mode: "card" | "detail" | "related" | "cart"; loading?: "lazy" }) {
  if (mode === "detail") {
    return <img src={product.image} alt={product.name} loading="eager" fetchPriority="high" />;
  }
  if (mode === "related") {
    return <img src={product.image} alt={product.name} loading="lazy" />;
  }
  if (mode === "cart") {
    return <img src={product.image} alt={product.name} loading="lazy" />;
  }
  if (product.referenceCard) {
    return <span className={`reference-card-art reference-card-${product.referenceCard}`} role="img" aria-label={product.name} />;
  }
  return <img src={product.image} alt={product.name} loading={loading} />;
}

export function Storefront({ categorySlug }: { categorySlug?: string }) {
  return <Suspense fallback={null}><StorefrontContent categorySlug={categorySlug} /></Suspense>;
}

function StorefrontContent({ categorySlug }: { categorySlug?: string }) {
  const searchParams = useSearchParams();
  const initialRegion = searchParams.get("region") === "osh" ? "osh" : "bishkek";
  const usesRemoteCatalog = Boolean(STOREFRONT_API_URL);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [city, setCity] = useState(initialRegion === "osh" ? "Ош" : "Бишкек");
  const [regionSlug, setRegionSlug] = useState<"bishkek" | "osh">(initialRegion);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>(defaultRegions);
  const [cityOpen, setCityOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [compositionView, setCompositionView] = useState<"composition" | "equipment">("composition");
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);
  const [addressSearchRequest, setAddressSearchRequest] = useState(0);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [pickupLocationSelected, setPickupLocationSelected] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoSlide, setPromoSlide] = useState(0);
  const [promoPage, setPromoPage] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pendingCartLine, setPendingCartLine] = useState<PendingCartLine | null>(null);
  const [utensilsCount, setUtensilsCount] = useState(1);
  const [noUtensils, setNoUtensils] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [resumeCheckoutAfterAddress, setResumeCheckoutAfterAddress] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    customerName: "",
    phone: "",
    apartment: "",
    entrance: "",
    floor: "",
    intercom: "",
    comment: "",
    paymentMethod: "card_on_delivery",
  });
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modifierSelections, setModifierSelections] = useState<ModifierSelections>({});
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(() => usesRemoteCatalog ? [] : categories);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>(defaultStoryGroups);
  const [regionalPromotions, setRegionalPromotions] = useState<Promotion[] | null>(() => usesRemoteCatalog ? [] : null);
  const [catalogLoading, setCatalogLoading] = useState(usesRemoteCatalog);
  const [activeCategory, setActiveCategory] = useState(categorySlug || "novinki");
  const [headerPinned, setHeaderPinned] = useState(false);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const categoryNavRef = useRef<HTMLElement>(null);
  const promoRowRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const citySelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const baseUrl = STOREFRONT_API_URL;

    fetch(`${baseUrl}/regions`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Regions request failed")))
      .then((data: RegionOption[]) => { if (data.length > 0) setRegionOptions(data); })
      .catch(() => undefined);

    fetch(`${baseUrl}/categories?region=${regionSlug}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog request failed")))
      .then((data: Array<Category & { products: Product[] }>) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error("Catalog response is empty");
        setCatalogCategories(data.map((category) => ({
          slug: category.slug,
          title: category.title,
          products: category.products.map((product) => {
            const localProduct = categories.flatMap((entry) => entry.products)
              .find((entry) => entry.name === product.name);
            return { ...localProduct, ...product, category: category.slug };
          }),
        })));
        setCatalogLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setCatalogCategories(categories);
        setCatalogLoading(false);
      });

    fetch(`${baseUrl}/promotions?region=${regionSlug}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Promotions request failed")))
      .then((data: Promotion[]) => {
        if (!Array.isArray(data) || data.length === 0) throw new Error("Promotions response is empty");
        const reconciled = reconcilePromotions(data);
        setRegionalPromotions(reconciled.cards);
        setStoryGroups(reconciled.stories);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRegionalPromotions(null);
        setStoryGroups(defaultStoryGroups);
      });

    return () => controller.abort();
  }, [regionSlug]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const restored = parseStoredStorefrontState(
          window.localStorage.getItem(STOREFRONT_STORAGE_KEY),
          initialRegion,
        );
        if (restored) {
          setCart(restored.cart);
          setDeliveryType(restored.deliveryType);
          setAddress(restored.address);
          setDraftAddress(restored.deliveryType === "delivery" ? restored.address : "");
          setPickupLocationSelected(restored.pickupLocationSelected);
          setUtensilsCount(restored.utensilsCount);
          setNoUtensils(restored.noUtensils);
          setDeliveryLocation(restored.deliveryLocation);
        }
      } catch {
        // Storage can be unavailable in private or restricted browser contexts.
      } finally {
        if (!cancelled) setStorageHydrated(true);
      }
    });
    return () => { cancelled = true; };
  }, [initialRegion]);

  useEffect(() => {
    if (!storageHydrated) return;
    try {
      window.localStorage.setItem(STOREFRONT_STORAGE_KEY, JSON.stringify({
        version: STOREFRONT_STORAGE_VERSION,
        regionSlug,
        deliveryType,
        address: boundedString(address, 300),
        pickupLocationSelected,
        utensilsCount: Math.min(20, Math.max(0, utensilsCount)),
        noUtensils,
        deliveryLocation: (
          deliveryType === "delivery" &&
          deliveryLocation?.address === address &&
          isValidDeliveryCoordinates(deliveryLocation.coordinates)
        ) ? {
          address: boundedString(deliveryLocation.address, 300),
          coordinates: deliveryLocation.coordinates,
        } : null,
        cart: cart
          .filter((line) => line.product.available !== false)
          .slice(0, 100)
          .map((line) => ({
            product: {
              id: line.product.id,
              slug: line.product.slug,
              category: line.product.category,
              name: line.product.name,
              price: line.product.price,
              image: line.product.image,
              description: line.product.description,
              isNew: line.product.isNew,
              referenceCard: line.product.referenceCard,
              referenceDetail: line.product.referenceDetail,
              available: line.product.available,
            },
            quantity: Math.min(20, Math.max(1, line.quantity)),
            modifiers: line.modifiers,
          })),
      }));
    } catch {
      // A full quota or disabled storage must not break ordering in-memory.
    }
  }, [
    address,
    cart,
    deliveryLocation,
    deliveryType,
    noUtensils,
    pickupLocationSelected,
    regionSlug,
    storageHydrated,
    utensilsCount,
  ]);

  useEffect(() => {
    if (!cityOpen) return;
    const closeCityMenu = (event: PointerEvent) => {
      if (!citySelectRef.current?.contains(event.target as Node)) setCityOpen(false);
    };
    document.addEventListener("pointerdown", closeCityMenu);
    return () => document.removeEventListener("pointerdown", closeCityMenu);
  }, [cityOpen]);

  const visibleCategories = useMemo(() => {
    const source = categorySlug ? catalogCategories.filter((category) => category.slug === categorySlug) : catalogCategories;
    if (!search.trim()) return source;
    const query = search.trim().toLocaleLowerCase("ru");
    const matches = source.flatMap((category) => category.products)
      .filter((product) => product.name.toLocaleLowerCase("ru").includes(query))
      .filter((product, index, products) => products.findIndex((candidate) => candidate.name === product.name) === index);
    return matches.length > 0 ? [{ slug: "search-results", title: "Нашли для вас", products: matches }] : [];
  }, [catalogCategories, categorySlug, search]);

  const currentStory = storyGroups[promoSlide] || storyGroups[0] || defaultStoryGroups[0];
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + cartLineTotal(line), 0);
  const cartLocation = address.trim()
    ? (address.trim().toLocaleLowerCase("ru-RU").startsWith(city.toLocaleLowerCase("ru-RU"))
      ? address.trim()
      : `${city}, ${address.trim()}`)
    : city;
  const highlightedCategory = categorySlug || activeCategory;

  const openProduct = (product: Product, historyMode: "push" | "replace" = "push") => {
    if (product.available === false) return;
    setModalQuantity(1);
    setModifierSelections({});
    setCompositionView("composition");
    setCompositionOpen(false);
    setSelected(product);
    writeOverlayQuery("product", product.slug, historyMode);
  };

  const closeProduct = () => {
    if (window.history.state?.storefrontOverlay === "product") {
      window.history.back();
      return;
    }
    writeOverlayQuery("product", null, "replace");
    setCompositionOpen(false);
    setModifierSelections({});
    setSelected(null);
  };

  const addCartLine = (product: Product, quantity: number, modifiers: SelectedModifier[]) => {
    if (product.available === false || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
    const key = cartLineKey(product.id, modifiers);
    const unitPrice = product.price + modifiers.reduce(
      (sum, modifier) => sum + (
        modifier.priceScope === "per-product"
          ? modifier.price * modifier.quantity
          : 0
      ),
      0,
    );
    setCart((current) => {
      const found = current.find((line) => line.key === key);
      return found
        ? current.map((line) => line.key === key
          ? { ...line, quantity: Math.min(20, line.quantity + quantity) }
          : line)
        : [...current, { key, product, quantity, unitPrice, modifiers }];
    });
  };

  const addToCart = (product: Product, quantity = 1, modifiers: SelectedModifier[] = []) => {
    if (product.available === false) return;
    if (!address) {
      setPendingCartLine({ product, quantity, modifiers });
      setSelected(product);
      setAddressOpen(true);
      return;
    }
    addCartLine(product, quantity, modifiers);
    setPendingCartLine(null);
    writeOverlayQuery("product", null, "replace");
    setSelected(null);
  };

  const changeQuantity = (lineKey: string, delta: number) => {
    setCart((current) => current
      .map((line) => line.key === lineKey
        ? { ...line, quantity: Math.min(20, line.quantity + delta) }
        : line)
      .filter((line) => line.quantity > 0));
  };

  const finishPendingCartAdd = () => {
    if (pendingCartLine) {
      addCartLine(pendingCartLine.product, pendingCartLine.quantity, pendingCartLine.modifiers);
      setPendingCartLine(null);
      writeOverlayQuery("product", null, "replace");
      setSelected(null);
    }
  };

  const closeAddress = () => {
    setAddressOpen(false);
    setPendingCartLine(null);
    if (resumeCheckoutAfterAddress) {
      setResumeCheckoutAfterAddress(false);
      setCheckoutOpen(true);
    }
  };

  const saveAddress = () => {
    if (!deliveryLocation) {
      if (draftAddress.trim()) setAddressSearchRequest((current) => current + 1);
      return;
    }
    setAddress(deliveryLocation.address);
    setAddressOpen(false);
    finishPendingCartAdd();
    if (resumeCheckoutAfterAddress) {
      setResumeCheckoutAfterAddress(false);
      createCheckoutAttempt();
    }
  };

  const savePickup = () => {
    if (!pickupLocationSelected) return;
    setAddress(regionSlug === "osh" ? "Ош, улица Курманжан-Датка, 123" : "Бишкек, проспект Чуй, 123");
    setAddressOpen(false);
    finishPendingCartAdd();
    if (resumeCheckoutAfterAddress) {
      setResumeCheckoutAfterAddress(false);
      createCheckoutAttempt();
    }
  };

  const openDeliveryType = (type: DeliveryType) => {
    setDeliveryType(type);
    if (type === "pickup") {
      setPickupLocationSelected(false);
    } else {
      setDraftAddress(address);
      setDeliveryLocation(null);
    }
    setAddressOpen(true);
  };

  const createCheckoutAttempt = () => {
    const key = typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setCheckoutIdempotencyKey(key);
    setCheckoutError("");
    setPlacedOrder(null);
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const beginCheckout = () => {
    if (!address) {
      setResumeCheckoutAfterAddress(true);
      setCartOpen(false);
      openDeliveryType(deliveryType);
      return;
    }
    createCheckoutAttempt();
  };

  const editCheckoutAddress = () => {
    setResumeCheckoutAfterAddress(true);
    setCheckoutOpen(false);
    if (deliveryType === "delivery") {
      setDraftAddress(address);
      setDeliveryLocation(null);
    } else {
      setPickupLocationSelected(false);
    }
    setAddressOpen(true);
  };

  const updateCheckoutField = <Key extends keyof CheckoutForm>(key: Key, value: CheckoutForm[Key]) => {
    setCheckoutForm((current) => ({ ...current, [key]: value }));
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.length || checkoutSubmitting) return;
    const orderApiUrl = STOREFRONT_API_URL;

    const phone = normalizePhone(checkoutForm.phone);
    if (!/^(?:\+996\d{9}|\+7\d{10})$/.test(phone)) {
      setCheckoutError("Введите телефон в формате +996 XXX XXX XXX или +7 XXX XXX-XX-XX.");
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError("");
    try {
      const response = await fetch(`${orderApiUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: checkoutIdempotencyKey,
          regionSlug,
          deliveryType,
          customerName: checkoutForm.customerName.trim(),
          phone,
          address,
          ...(deliveryType === "delivery" &&
          deliveryLocation?.address === address &&
          isValidDeliveryCoordinates(deliveryLocation.coordinates) ? {
              latitude: deliveryLocation.coordinates[0],
              longitude: deliveryLocation.coordinates[1],
            } : {}),
          apartment: checkoutForm.apartment.trim(),
          entrance: checkoutForm.entrance.trim(),
          floor: checkoutForm.floor.trim(),
          intercom: checkoutForm.intercom.trim(),
          comment: checkoutForm.comment.trim(),
          paymentMethod: checkoutForm.paymentMethod,
          utensilsCount: noUtensils ? 0 : utensilsCount,
          noUtensils,
          items: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
            modifiers: line.modifiers.map((modifier) => ({
              groupId: modifier.groupId,
              itemId: modifier.itemId,
              quantity: modifier.quantity,
            })),
          })),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
        throw new Error(message || "Не удалось отправить заказ. Попробуйте ещё раз.");
      }
      setPlacedOrder(body as PlacedOrder);
      setCart([]);
      setPendingCartLine(null);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Не удалось отправить заказ. Попробуйте ещё раз.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const openPromo = (index: number) => {
    setPromoSlide(index);
    setPromoPage(0);
    setPromoOpen(true);
    writeOverlayQuery("storyInspect", String(index + 1), "push");
  };

  const changePromo = (delta: number) => {
    const pageCount = currentStory.pages.length;
    if (delta > 0 && promoPage < pageCount - 1) {
      setPromoPage((current) => current + 1);
      return;
    }
    if (delta < 0 && promoPage > 0) {
      setPromoPage((current) => current - 1);
      return;
    }

    const nextGroup = (promoSlide + delta + storyGroups.length) % storyGroups.length;
    setPromoSlide(nextGroup);
    setPromoPage(delta < 0 ? storyGroups[nextGroup].pages.length - 1 : 0);
    writeOverlayQuery("storyInspect", String(nextGroup + 1), "replace");
  };

  const closePromo = () => {
    if (window.history.state?.storefrontOverlay === "storyInspect") {
      window.history.back();
      return;
    }
    writeOverlayQuery("storyInspect", null, "replace");
    setPromoOpen(false);
  };

  const allCatalogProducts = catalogCategories.flatMap((category) => category.products);
  const relatedNames = [
    "Шаурдельфия",
    "Шаурфорния",
    "Соус спайси",
    "Темпура с креветками спайси",
    "Запечённый с лососем терияки",
    "Соус соевый",
    "Филадельфия лайт",
    "Филадельфия с лососем",
    "Том Ям с кальмаром и креветками",
    "Хрустящая креветка и соус аригато",
    "Том Ям с креветками",
    "Запеченная калифорния",
    "Запечённый с креветками",
    "Запечённый с кальмаром и пармезаном",
    "Темпура с лососем терияки",
    "Просто огурец",
    "Имбирь маринованный",
    "Даку 2.0",
  ];
  const potatoRelatedNames = [
    "Филадельфия с лососем",
    "Филадельфия лайт",
    "Запечённый с лососем терияки",
    "Снежная калифорния",
    "Запеченная калифорния",
    "Том Ям с креветками",
    "Просто огурец",
    "Темпура с лососем терияки",
    "Запечённый с креветками",
    "Темпура с лососем",
    "Хитовый",
    "Наггетсы куриные",
    "Хрустящая креветка и соус аригато",
    "Темпура с креветками спайси",
    "Том Ям с кальмаром и креветками",
    "Соус спайси",
    "Соус соевый",
    "Даку 2.0",
  ];
  const relatedForSelected = selected?.name === "Картофель фри" ? potatoRelatedNames : relatedNames;
  const related = selected?.modalKind === "related" || selected?.modalKind === "addons"
    ? (selected.id === 11301 || selected.name === "Картофель фри"
      ? relatedForSelected
        .map((name) => allCatalogProducts.find((product) => product.name === name))
        .filter((product): product is Product => product !== undefined && product.available !== false)
      : allCatalogProducts
        .filter((product) => product.id !== selected.id && product.available !== false)
        .slice(0, 18))
    : [];
  const cartProductIds = new Set(cart.map((line) => line.product.id));
  const cartRecommendations = [
    ...relatedNames.map((name) => allCatalogProducts.find((product) => product.name === name)),
    ...allCatalogProducts,
  ]
    .filter((product): product is Product => product !== undefined && product.available !== false)
    .filter((product, index, products) => !cartProductIds.has(product.id) && products.findIndex((candidate) => candidate.id === product.id) === index)
    .slice(0, 12);
  const modifierGroups = selected?.modifierGroups || [];
  const selectedModifiersForCart = modifierGroups.flatMap((group) =>
    group.items
      .filter((item) => (
        item.enabled !== false &&
        (modifierSelections[group.id]?.[item.id] || 0) > 0
      ))
      .map((item) => {
        const maximumQuantity = modifierItemMaximum(group, item);
        return {
          groupId: group.id,
          groupTitle: group.title,
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          quantity: Math.min(
            maximumQuantity,
            Math.max(1, modifierSelections[group.id]?.[item.id] || 1),
          ),
          priceScope: group.priceScope ?? "per-product",
        };
      }));
  const configuredModalTotal = selected
    ? configuredProductTotal(selected, modalQuantity, selectedModifiersForCart)
    : 0;
  const selectedModifierUnits = selectedModifiersForCart.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const modifiersComplete = modifierGroups.every((group) => {
    const groupSelections = modifierSelections[group.id] || {};
    const activeItems = group.items.filter((item) => item.enabled !== false);
    const selectedEntries = Object.entries(groupSelections)
      .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0);
    const count = selectedEntries.length;
    const minimum = group.required ? Math.max(1, group.minSelections || 1) : group.minSelections || 0;
    const maximum = group.selectionType === "single"
      ? 1
      : group.maxSelections ?? activeItems.length;
    const selectionsValid = selectedEntries.every(([itemId, quantity]) => {
      const item = activeItems.find((candidate) => candidate.id === itemId);
      return Boolean(
        item
        && quantity <= modifierItemMaximum(group, item)
        && (group.selectionType === "multiple" || quantity === 1),
      );
    });
    return selectionsValid && count >= minimum && count <= maximum;
  }) && selectedModifierUnits <= MAX_MODIFIER_UNITS;

  const toggleModifier = (groupId: string, itemId: string) => {
    const group = modifierGroups.find((candidate) => candidate.id === groupId);
    const item = group?.items.find((candidate) => candidate.id === itemId);
    if (!group || !item || item.enabled === false) return;
    setModifierSelections((current) => {
      const groupSelections = current[groupId] || {};
      const alreadySelected = (groupSelections[itemId] || 0) > 0;
      if (group.selectionType === "single") {
        const totalUnits = Object.values(current)
          .flatMap((selections) => Object.values(selections))
          .reduce((sum, quantity) => sum + quantity, 0);
        if (!alreadySelected && Object.keys(groupSelections).length === 0 && totalUnits >= MAX_MODIFIER_UNITS) {
          return current;
        }
        const minimum = group.required ? Math.max(1, group.minSelections || 1) : group.minSelections || 0;
        if (alreadySelected && minimum > 0) return current;
        return { ...current, [groupId]: alreadySelected ? {} : { [itemId]: 1 } };
      }
      if (alreadySelected) {
        if (modifierItemMaximum(group, item) > 1) return current;
        const nextGroupSelections = { ...groupSelections };
        delete nextGroupSelections[itemId];
        return { ...current, [groupId]: nextGroupSelections };
      }
      const selectedItems = Object.values(groupSelections).filter((quantity) => quantity > 0).length;
      if (group.maxSelections !== undefined && selectedItems >= group.maxSelections) return current;
      const totalUnits = Object.values(current)
        .flatMap((selections) => Object.values(selections))
        .reduce((sum, quantity) => sum + quantity, 0);
      if (totalUnits >= MAX_MODIFIER_UNITS) return current;
      return { ...current, [groupId]: { ...groupSelections, [itemId]: 1 } };
    });
  };

  const changeModifierQuantity = (groupId: string, itemId: string, delta: -1 | 1) => {
    const group = modifierGroups.find((candidate) => candidate.id === groupId);
    const item = group?.items.find((candidate) => candidate.id === itemId);
    if (!group || group.selectionType !== "multiple" || !item || item.enabled === false) return;
    const maximumQuantity = modifierItemMaximum(group, item);
    setModifierSelections((current) => {
      const groupSelections = current[groupId] || {};
      const quantity = groupSelections[itemId];
      if (!Number.isInteger(quantity) || quantity < 1) return current;
      const totalUnits = Object.values(current)
        .flatMap((selections) => Object.values(selections))
        .reduce((sum, value) => sum + value, 0);
      if (delta > 0 && totalUnits >= MAX_MODIFIER_UNITS) return current;
      const nextQuantity = quantity + delta;
      const nextGroupSelections = { ...groupSelections };
      if (nextQuantity < 1) delete nextGroupSelections[itemId];
      else if (nextQuantity <= maximumQuantity) nextGroupSelections[itemId] = nextQuantity;
      else return current;
      return { ...current, [groupId]: nextGroupSelections };
    });
  };

  const navigateProduct = (delta: number) => {
    if (!selected) return;
    const uniqueProducts = allCatalogProducts
      .filter((product) => product.available !== false)
      .filter((product, index, items) => items.findIndex((item) => item.id === product.id) === index);
    const index = uniqueProducts.findIndex((product) => product.id === selected.id);
    if (index < 0) return;
    openProduct(uniqueProducts[(index + delta + uniqueProducts.length) % uniqueProducts.length], "replace");
  };

  useEffect(() => {
    if (!promoOpen) return;
    const timer = window.setTimeout(() => {
      if (promoPage < currentStory.pages.length - 1) {
        setPromoPage((current) => current + 1);
        return;
      }
      const nextGroup = (promoSlide + 1) % storyGroups.length;
      setPromoSlide(nextGroup);
      setPromoPage(0);
      writeOverlayQuery("storyInspect", String(nextGroup + 1), "replace");
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [currentStory.pages.length, promoOpen, promoPage, promoSlide, storyGroups]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const productSlug = params.get("product");
      const product = productSlug
        ? catalogCategories
          .flatMap((category) => category.products)
          .find((item) => item.slug === productSlug && item.available !== false)
        : null;
      setSelected(product || null);
      if (!product) {
        setCompositionOpen(false);
        setModifierSelections({});
      }

      const storyNumber = Number(params.get("storyInspect"));
      if (Number.isInteger(storyNumber) && storyNumber >= 1 && storyNumber <= storyGroups.length) {
        setPromoSlide(storyNumber - 1);
        setPromoPage(0);
        setPromoOpen(true);
      } else {
        setPromoOpen(false);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [catalogCategories, storyGroups]);

  useEffect(() => {
    const locked = Boolean(selected || compositionOpen || addressOpen || cartOpen || checkoutOpen || promoOpen || menuOpen);
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected, compositionOpen, addressOpen, cartOpen, checkoutOpen, promoOpen, menuOpen]);

  useEffect(() => {
    if (categorySlug) return;

    let frame = 0;
    const updateActiveCategory = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const isDesktop = window.innerWidth > 720;
        setHeaderPinned(isDesktop && window.scrollY >= 315);
        const anchor = isDesktop ? 190 : 208;
        let nextCategory = visibleCategories[0]?.slug || "novinki";

        for (const category of visibleCategories) {
          const section = document.getElementById(category.slug);
          if (section && section.getBoundingClientRect().top <= anchor) {
            nextCategory = category.slug;
          } else {
            break;
          }
        }

        setActiveCategory((current) => current === nextCategory ? current : nextCategory);
        frame = 0;
      });
    };

    updateActiveCategory();
    window.addEventListener("scroll", updateActiveCategory, { passive: true });
    window.addEventListener("resize", updateActiveCategory);
    return () => {
      window.removeEventListener("scroll", updateActiveCategory);
      window.removeEventListener("resize", updateActiveCategory);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [categorySlug, visibleCategories]);

  useEffect(() => {
    if (!categorySlug) return;
    const updatePinnedHeader = () => setHeaderPinned(window.innerWidth > 720 && window.scrollY >= 315);
    updatePinnedHeader();
    window.addEventListener("scroll", updatePinnedHeader, { passive: true });
    window.addEventListener("resize", updatePinnedHeader);
    return () => {
      window.removeEventListener("scroll", updatePinnedHeader);
      window.removeEventListener("resize", updatePinnedHeader);
    };
  }, [categorySlug]);

  useEffect(() => {
    const nav = categoryNavRef.current;
    const item = nav?.querySelector<HTMLElement>(`[data-category-slug="${highlightedCategory}"]`);
    if (!nav || !item) return;
    const targetLeft = window.innerWidth <= 720
      ? 100
      : (nav.clientWidth - item.clientWidth) / 2;
    nav.scrollTo({
      left: item.offsetLeft - targetLeft,
      behavior: "smooth",
    });
  }, [highlightedCategory]);

  useEffect(() => {
    const row = promoRowRef.current;
    if (!row) return;
    if (window.innerWidth > 720) {
      row.scrollLeft = 92;
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      const lastIndex = Math.max(0, Math.floor((row.scrollWidth - row.clientWidth) / 132));
      index = index >= lastIndex ? 0 : index + 1;
      row.scrollTo({ left: index * 132, behavior: "smooth" });
    }, 5_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="site">
      <section className="brand-hero" aria-label="Salmon Lovers Club">
        <img className="brand-wordmark" src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" />
        <picture>
          <source media="(max-width: 720px)" srcSet="https://mnogolososya.ru/_nuxt/main-pic-bg-mobile.BduSm_pt.webp" />
          <img className="brand-main" src="https://mnogolososya.ru/_nuxt/main-pic-bg.CBG-DW8k.webp" alt="Salmon Lovers Club" />
        </picture>
        <img className="brand-smile" src="https://mnogolososya.ru/_nuxt/main-pic-face.DkOigqua.webp" alt="" />
        <a href="https://trk.mail.ru/c/a7gh71" aria-label="Скачайте приложение"><img className="download-app" src="https://mnogolososya.ru/_nuxt/download-app.BLqCltS2.svg" alt="Скачайте приложение" /></a>
      </section>

      <div className={`store-shell ${headerPinned ? "header-pinned" : ""}`}>
        <header className="delivery-header">
          <button className="cat-avatar" aria-label="Открыть меню" onClick={() => setMenuOpen(true)}><span className="cat-reference" aria-hidden="true" /></button>
          <div className="brand-shortcuts" aria-label="Способ получения заказа">
            <button className={`brand-shortcut ${deliveryType === "delivery" ? "active" : "muted"}`} aria-label="Доставка" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button>
            <button className={`brand-shortcut pickup-shortcut ${deliveryType === "pickup" ? "active" : "muted"}`} aria-label="Самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button>
          </div>
          <div className="order-location-bar">
            <div className="city-select" ref={citySelectRef}>
              <button className="city-button" aria-expanded={cityOpen} aria-haspopup="listbox" onClick={() => setCityOpen((current) => !current)}>{city} <span className={`city-chevron${cityOpen ? " open" : ""}`} aria-hidden="true" /></button>
              {cityOpen ? <div className="city-dropdown" role="listbox" aria-label="Город">
                {regionOptions.filter((option) => option.name !== city).map((option) => <button key={option.slug} role="option" aria-selected={city === option.name} onClick={() => { const url = new URL(window.location.href); url.searchParams.set("region", option.slug); window.history.replaceState(window.history.state, "", url); setCity(option.name); setCatalogCategories([]); setStoryGroups([]); setRegionalPromotions([]); setCatalogLoading(true); setRegionSlug(option.slug); setCityOpen(false); setAddress(""); setDeliveryLocation(null); setCart([]); setPendingCartLine(null); setUtensilsCount(1); setNoUtensils(false); setCheckoutOpen(false); setPlacedOrder(null); setSelected(null); }}>{option.name}</button>)}
              </div> : null}
            </div>
            <button className="address-button" onClick={() => { if (deliveryType === "delivery") { setDraftAddress(address); setDeliveryLocation(null); } setAddressOpen(true); }}>{address || (deliveryType === "pickup" ? "Выберите ресторан для самовывоза" : "Введите адрес доставки")}</button>
            <div className="delivery-mode" aria-label={`${deliveryType === "pickup" ? "Самовывоз ~40 минут" : "Доставка от ~45 минут"}`}>
              <div className="desktop-mode-icons"><button className={deliveryType === "delivery" ? "active" : "muted"} aria-label="Выбрать доставку" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button><button className={deliveryType === "pickup" ? "active" : "muted"} aria-label="Выбрать самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button></div>
              <span className="delivery-connector" aria-hidden="true" />
              <div className="delivery-status"><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>{deliveryType === "pickup" ? "~40 минут" : "от ~45 минут"}</small></div>
            </div>
          </div>
          <button className="cart-button" onClick={() => setCartOpen(true)}>Корзина{cartCount > 0 ? ` ${money(cartTotal)}` : ""}</button>
        </header>

        <div className="promo-row" aria-label="Акции" ref={promoRowRef}>
          {regionalPromotions
            ? regionalPromotions.map((promotion, index) => <button className="promo-card" key={promotion.id} onClick={() => openPromo(index)} aria-label={`Открыть акцию: ${promotion.title}`}><img src={promotion.image} alt={promotion.title} /></button>)
            : promoCards.map((card, index) => <button className="promo-card" key={card.alt} onClick={() => openPromo(index)} aria-label={`Открыть акцию: ${card.alt}`}>{"referenceCrop" in card ? <span className={`promo-reference promo-reference-${card.referenceCrop}`} role="img" aria-label={card.alt} /> : <img src={card.src} alt={card.alt} />}</button>)}
        </div>

        <nav className="category-nav" aria-label="Категории меню" ref={categoryNavRef}>
          <label className={`search-pill ${searchOpen || search ? "search-open" : ""}`} onClick={() => { setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0); }}><span>⌕</span><input ref={searchInputRef} value={search} onFocus={() => setSearchOpen(true)} onBlur={() => { if (!search) setSearchOpen(false); }} onChange={(event) => setSearch(event.target.value)} placeholder={searchOpen ? "Что ищем?" : "Поиск"} aria-label="Поиск" /></label>
          {catalogCategories.map((category) => (
            <a
              key={category.slug}
              href={categorySlug ? `/category/${category.slug}?region=${regionSlug}` : `#${category.slug}`}
              data-category-slug={category.slug}
              className={category.slug === highlightedCategory ? "active" : ""}
              onClick={() => setActiveCategory(category.slug)}
            >{category.title}</a>
          ))}
        </nav>

        <main className="catalog">
          {categorySlug && visibleCategories[0] ? <h1>{visibleCategories[0].title} в {city}</h1> : null}
          {catalogLoading ? <div className="empty-search">Загружаем меню…</div> : null}
          {!catalogLoading && visibleCategories.length === 0 ? <div className="empty-search">Ничего не нашли — попробуйте другое название</div> : null}
          {visibleCategories.map((category) => (
            <section className="category-section" id={category.slug} key={category.slug}>
              {!categorySlug ? search.trim()
                ? <h2 className="category-title">{category.title}</h2>
                : <Link href={`/category/${category.slug}?region=${regionSlug}`} className="category-title">{category.title}</Link>
                : null}
              <div className="product-grid">
                {category.products.map((product) => (
                  <article className={`product-card${product.available === false ? " unavailable" : ""}`} data-product-id={product.id} key={`${category.slug}-${product.id}`} role="button" aria-disabled={product.available === false} aria-label={`Открыть ${product.name}`} onClick={() => { if (product.available !== false) openProduct(product); }} tabIndex={product.available === false ? -1 : 0} onKeyDown={(event) => { if (product.available !== false && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openProduct(product); } }}>
                    <div className="product-image-wrap">
                      <ProductArt product={product} mode="card" loading="lazy" />
                      {product.isNew && !product.referenceCard ? <span className="product-new-badge">Новинка</span> : null}
                      {product.available === false ? <span className="product-finished">Закончилось</span> : null}
                    </div>
                    <div className="product-body">
                      <div className="product-name">{product.name}</div>
                      <div className="product-actions"><span>{money(product.price)}</span>{product.available === false ? null : <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); if (product.modifierGroups?.length) openProduct(product); else addToCart(product); }}>+</button>}</div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer className="footer" id="contacts">
        <div className="footer-brand"><img className="footer-logo" src="https://mnogolososya.ru/_nuxt/brand-name-logo.BwYmwvxd.svg" alt="Много лосося" /><span>© 2026 ООО «Гастрономия»</span></div>
        <a className="footer-app-link" href="https://trk.mail.ru/c/a7gh71" aria-label="Скачайте приложение"><img className="footer-app" src="https://mnogolososya.ru/_nuxt/download-app.BLqCltS2.svg" alt="Скачайте приложение" /></a>
        <div className="footer-contacts"><a href="tel:+996503178916">0503 178 916</a><a href="mailto:musaev.janybek.kg@gmail.com">musaev.janybek.kg@gmail.com</a></div>
        <div className="footer-links"><a href="https://about.mnogolososya.ru/">Правовая информация</a><span>•</span><a href="https://rabota.mnogolososya.ru/?utm_source=web_site&utm_medium=web&utm_campaign=hr">Работа</a></div>
        <p className="footer-legal">ОГРН 1197746601326, 109029, г. Москва, вн.тер.г. муниципальный округ Нижегородский, ул. Средняя Калитниковская, д.28, стр.4, этаж/пом/ком 1/VIII/№48</p>
      </footer>

      {cartCount > 0 ? <button className="mobile-cart-button" onClick={() => setCartOpen(true)}>Корзина · {money(cartTotal)}</button> : null}

      {menuOpen ? (
        <div className="overlay profile-overlay" role="dialog" aria-modal="true" aria-label="Профиль" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
          <section className="profile-modal">
            <button className="profile-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть">×</button>
            <div className="profile-user"><span className="cat-reference" aria-hidden="true" /><div><span>Привет!</span><strong>Войдите в профиль</strong></div></div>
            <img className="profile-award" src="https://mnogolososya.ru/_nuxt/auth-roskachestvo-banner.CHXK7t8d.png" alt="Официально лучшее приложение 2025 года для доставки готовой еды по итогам проверки Роскачества. Проверьте сами!" />
            <nav className="profile-links" aria-label="Меню профиля"><a href="https://mnogolososya.ru/support"><img src="https://mnogolososya.ru/_nuxt/Support.xyJ2YVkd.png" alt="" />Поддержка</a><a href="https://mnogolososya.ru/page/o-nas"><img src="https://mnogolososya.ru/_nuxt/About.TR1tfEtn.png" alt="" />О нас</a></nav>
            <button className="profile-login">Войти</button>
          </section>
        </div>
      ) : null}

      {promoOpen ? (
        <div className="promo-overlay" role="dialog" aria-modal="true" aria-label={currentStory.title} onMouseDown={(event) => { if (event.target === event.currentTarget) closePromo(); }}>
          <button className="story-arrow story-arrow-left" onClick={() => changePromo(-1)} aria-label="Предыдущая акция">←</button>
          <article className={`story-card story-${currentStory.kind}`}>
            <img key={currentStory.pages[promoPage]?.src || currentStory.pages[0].src} className="story-image" src={currentStory.pages[promoPage]?.src || currentStory.pages[0].src} alt={currentStory.title} />
            <div className="story-progress" aria-label="Следующая страница через 30 секунд">
              {currentStory.pages.map((page, index) => (
                <span className={`story-progress-segment${index < promoPage ? " complete" : ""}${index === promoPage ? " active" : ""}`} key={page.src}>
                  {index === promoPage ? <i key={`${promoSlide}-${promoPage}`} /> : null}
                </span>
              ))}
            </div>
            <button className="story-close" onClick={closePromo} aria-label="Закрыть">×</button>
            {currentStory.cta ? <button className="story-cta" type="button" onClick={() => { if (currentStory.ctaUrl) window.open(currentStory.ctaUrl, "_blank", "noopener,noreferrer"); }}>{currentStory.cta}</button> : null}
          </article>
          <button className="story-arrow story-arrow-right" onClick={() => changePromo(1)} aria-label="Следующая акция">→</button>
        </div>
      ) : null}

      {selected && !addressOpen ? (
        <div className="overlay product-overlay" role="dialog" aria-modal="true" aria-label={selected.name} onMouseDown={(event) => { if (event.target === event.currentTarget) closeProduct(); }}>
          <div className={`product-modal product-modal-${selected.modalKind || "related"}`}>
            <button className="modal-close" onClick={closeProduct} aria-label="Закрыть">×</button>
            <div className="modal-art"><ProductArt product={selected} mode="detail" />{selected.isNew && !selected.referenceCard ? <span className="modal-new-badge">Новинка</span> : null}</div>
            <div className="modal-info">
              <div className="modal-arrows"><button onClick={() => navigateProduct(-1)}>← &nbsp; Предыдущее</button><span>·</span><button onClick={() => navigateProduct(1)}>Следующее &nbsp; →</button></div>
              <div className="modal-description"><h2>{selected.name}</h2>{selected.description ? <p>{selected.description}</p> : null}</div>
              <div className="nutrition">
                <div><b>{selected.weight}</b><small>граммы</small></div><div><b>{selected.calories}</b><small>ккал</small></div><div><b>{selected.protein}</b><small>белок</small></div><div><b>{selected.fat}</b><small>жиры</small></div><div><b>{selected.carbs}</b><small>углеводы</small></div>
                <div className={`nutrition-actions${selected.name === "Собери свой сет" ? " has-equipment" : ""}`}><button onClick={() => { setCompositionView("composition"); setCompositionOpen(true); }}>Состав</button>{selected.name === "Собери свой сет" ? <button onClick={() => { setCompositionView("equipment"); setCompositionOpen(true); }}>Комплектация</button> : null}</div>
              </div>
              {modifierGroups.length ? <div className="modifier-groups">{modifierGroups.map((group) => {
                const selectedQuantities = modifierSelections[group.id] || {};
                const presentation = group.presentation ?? "rows";
                const minimumSelections = group.required
                  ? Math.max(1, group.minSelections || 1)
                  : group.minSelections || 0;
                const selectedItems = Object.values(selectedQuantities)
                  .filter((quantity) => quantity > 0).length;
                return <section className={`modifier-group modifier-group-${group.selectionType} modifier-presentation-${presentation}`} key={group.id}>
                  <div className="modifier-heading"><h3>{group.title}</h3>{group.required && selectedItems < minimumSelections ? <span>Нужно выбрать</span> : null}</div>
                  <div className="modifier-options">{group.items.filter((item) => item.enabled !== false).map((item) => {
                    const modifierQuantity = selectedQuantities[item.id] || 0;
                    const chosen = modifierQuantity > 0;
                    const maximumQuantity = modifierItemMaximum(group, item);
                    const art = item.image ? <img src={item.image} alt="" /> : <span className="modifier-option-placeholder" />;
                    const copy = <span><strong>{item.name}</strong><small>{item.price ? `+${money(item.price)}` : money(0)}</small></span>;
                    if (group.selectionType === "multiple" && chosen && maximumQuantity > 1) {
                      return <div className="modifier-option selected has-quantity" key={item.id}>
                        {art}
                        {copy}
                        <span className="modifier-option-quantity" role="group" aria-label={`Количество ${item.name}`}>
                          <button type="button" aria-label={`Уменьшить количество ${item.name}`} onClick={() => changeModifierQuantity(group.id, item.id, -1)}>−</button>
                          <b aria-live="polite">{modifierQuantity}</b>
                          <button type="button" aria-label={`Увеличить количество ${item.name}`} disabled={modifierQuantity >= maximumQuantity || selectedModifierUnits >= MAX_MODIFIER_UNITS} onClick={() => changeModifierQuantity(group.id, item.id, 1)}>+</button>
                        </span>
                      </div>;
                    }
                    return <button type="button" className={`modifier-option ${chosen ? "selected" : ""}`} key={item.id} onClick={() => toggleModifier(group.id, item.id)} aria-pressed={chosen}>
                      {art}
                      {copy}
                      <i>{chosen ? "✓" : "+"}</i>
                    </button>;
                  })}</div>
                </section>;
              })}</div> : null}
              {selected.modalKind === "related" || selected.modalKind === "addons" ? <><h3>Вместе вкуснее</h3><div className="related-row">{related.map((product) => <article key={`${product.category}-${product.id}`} onClick={() => openProduct(product)}><div className="related-image"><ProductArt product={product} mode="related" />{product.isNew && !product.referenceCard ? <span className="related-new-badge">Новинка</span> : null}</div><span>{product.name}</span><div className="related-actions"><b>{money(product.price)}</b><button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); if (product.modifierGroups?.length) openProduct(product); else addToCart(product); }}>+</button></div></article>)}</div></> : null}
              <div className="modal-buy"><div className="quantity"><button aria-label="Уменьшить количество" disabled={modalQuantity === 1} onClick={() => setModalQuantity((current) => Math.max(1, current - 1))}>−</button><span>{modalQuantity}</span><button aria-label="Увеличить количество" disabled={modalQuantity >= 20} onClick={() => setModalQuantity((current) => Math.min(20, current + 1))}>+</button></div><button className="buy-button" disabled={selected.available === false || !modifiersComplete} onClick={() => addToCart(selected, modalQuantity, selectedModifiersForCart)}>{selected.available === false ? "Закончилось" : modifiersComplete ? `Добавить ${money(configuredModalTotal)}` : "Настройте блюдо"}</button></div>
            </div>
          </div>
        </div>
      ) : null}

      {compositionOpen && selected ? (
        <div className="overlay composition-overlay" role="dialog" aria-modal="true" aria-labelledby="composition-title">
          <section className="composition-modal">
            <div className="composition-navigation">
              <button className="composition-back" onClick={() => setCompositionOpen(false)} aria-label="Назад">←</button>
              <button className="composition-close" onClick={() => setCompositionOpen(false)} aria-label="Закрыть">×</button>
            </div>
            <h2 id="composition-title">{compositionView === "composition" ? "Состав" : "Комплектация"}</h2>
            {compositionView === "composition"
              ? <div className="composition-copy">{selected.composition || selected.description}</div>
              : <div className="composition-copy equipment-copy">
                  <p>К заказу добавим базовую комплектацию. Количество палочек можно изменить в корзине.</p>
                  <div><span>Васаби</span><b>1 шт.</b></div>
                  <div><span>Соевый соус</span><b>{selected.name === "Собери свой сет" ? "2 шт." : "1 шт."}</b></div>
                  <div><span>Имбирь</span><b>1 шт.</b></div>
                  {selected.modifierGroups?.length ? <small>Соусы и добавки, выбранные в карточке блюда, будут сохранены в заказе отдельно.</small> : null}
                </div>}
            <button className="composition-return" onClick={() => setCompositionOpen(false)}>Назад</button>
          </section>
        </div>
      ) : null}

      {addressOpen ? (
        <div className="overlay address-overlay" role="dialog" aria-modal="true" aria-label={deliveryType === "pickup" ? "Самовывоз" : "Адрес доставки"}>
          <div className="address-modal">
            <div className={`map-placeholder ${deliveryType === "pickup" ? `pickup-map${pickupLocationSelected ? " pickup-map-selected" : ""}` : "delivery-map yandex-map-host"}`}>
              <button className="map-back" onClick={closeAddress} aria-label="Назад">←</button>
              {deliveryType === "delivery" ? (
                <YandexDeliveryMap
                  inputId="delivery-address-input"
                  query={draftAddress}
                  region={regionSlug}
                  searchRequest={addressSearchRequest}
                  onQueryChange={setDraftAddress}
                  onLocationChange={setDeliveryLocation}
                />
              ) : <>
                <img className="map-marker pickup-map-marker" src="https://mnogolososya.ru/_nuxt/pickup-marker-disabled.DSAcVKbt.svg" alt="" />
                <div className="map-controls"><button aria-label="Увеличить карту">+</button><button aria-label="Уменьшить карту">−</button></div>
                <div className="map-attribution"><span>📍 Открыть Яндекс Карты</span><small>© Яндекс&nbsp; Условия использования</small></div>
              </>}
            </div>
            <div className="address-panel">
              <button className="modal-close" onClick={closeAddress} aria-label="Закрыть">×</button>
              <div className="modal-mode-switch" aria-label="Способ получения заказа">
                <div className="modal-mode-icons">
                  <button className={deliveryType === "delivery" ? "active" : "muted"} aria-label="Выбрать доставку" onClick={() => openDeliveryType("delivery")}><img src="/delivery.png" alt="" /></button>
                  <button className={deliveryType === "pickup" ? "active" : "muted"} aria-label="Выбрать самовывоз" onClick={() => openDeliveryType("pickup")}><img src="/pickup.png" alt="" /></button>
                </div>
                <div><strong>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</strong><small>{deliveryType === "pickup" ? "~45 минут" : "от ~45 минут"}</small></div>
              </div>
              {deliveryType === "pickup" ? <>
                <h2>Самовывоз</h2><p>Выберите точку для самовывоза<br />из доступных в списке или на карте</p>
                <div className="address-input muted">{city} <span>×</span></div>
                <button className={`pickup-location ${pickupLocationSelected ? "selected" : ""}`} onClick={() => setPickupLocationSelected(true)}><span className="pickup-radio" /><span><b>{regionSlug === "osh" ? "Ош, улица Курманжан-Датка, 123" : "Бишкек, проспект Чуй, 123"}</b><small>Ежедневно, без выходных<br />11:30 – 22:30</small></span></button>
                <button className="save-address save-pickup" disabled={!pickupLocationSelected} onClick={savePickup}>Забрать здесь</button>
              </> : <>
                <h2>Адрес доставки</h2><p>Введите адрес для доставки курьером,<br />выберите подсказку или точку на карте</p>
                <div className="address-input muted">{city} <span>×</span></div>
                <div className="address-search">
                  <input
                    id="delivery-address-input"
                    className="address-input"
                    autoFocus
                    autoComplete="off"
                    value={draftAddress}
                    onChange={(event) => { setDraftAddress(event.target.value); setDeliveryLocation(null); }}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); setAddressSearchRequest((current) => current + 1); } }}
                    placeholder="Улица и номер дома"
                  />
                  {draftAddress ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftAddress("");
                        setDeliveryLocation(null);
                        window.requestAnimationFrame(() => document.getElementById("delivery-address-input")?.focus());
                      }}
                      aria-label="Очистить адрес"
                    >×</button>
                  ) : null}
                  <div id="delivery-address-input-suggestions" className="address-suggestions" />
                </div>
                {deliveryLocation ? <div className="resolved-address" aria-live="polite">{deliveryLocation.address}</div> : null}
                <button className="save-address delivery-save" disabled={!deliveryLocation} onClick={saveAddress}>Заказать сюда</button>
              </>}
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="drawer-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <aside className="cart-drawer" data-filled={cart.length > 0 ? "true" : "false"} aria-label="Корзина">
            <button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Закрыть">×</button>
            {cart.length === 0 ? <div className="cart-empty"><img src="https://mnogolososya.ru/_nuxt/empty-cart.CYKZtHDV.svg" alt="" /><div>Место сбора<br />вкусных блюд</div></div> : <>
              <div className="cart-address">{cartLocation}</div>
              <div className="cart-layout">
                <section className="cart-products">
                  <div className="cart-section-heading"><h2>Корзина</h2><button aria-label="Очистить корзину" onClick={() => setCart([])}><svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6.5 7l.9 12h9.2l.9-12" /><path d="M10 11v5" /><path d="M14 11v5" /></svg></button></div>
                  {cart.map((line) => (
                    <div className="cart-line" key={line.key}>
                      <div className="cart-line-art"><ProductArt product={line.product} mode="cart" /></div>
                      <div className="cart-line-copy">
                        <b>{line.product.name}</b>
                        {line.product.description ? <p>{line.product.description}</p> : null}
                        {line.modifiers.length ? <div className="cart-line-modifiers">{line.modifiers.map((modifier) => <span key={`${modifier.groupId}-${modifier.itemId}`}>{modifier.itemName} ×{modifier.quantity}{modifier.price ? ` +${money(modifier.price * modifier.quantity)}` : ""}</span>)}</div> : null}
                        <div className="cart-line-footer"><span>{money(cartLineTotal(line))}</span><div className="line-controls"><button aria-label={`Уменьшить ${line.product.name}`} onClick={() => changeQuantity(line.key, -1)}>−</button><span>{line.quantity}</span><button aria-label={`Увеличить ${line.product.name}`} disabled={line.quantity >= 20} onClick={() => changeQuantity(line.key, 1)}>+</button></div></div>
                      </div>
                    </div>
                  ))}
                  {cartRecommendations.length > 0 ? <div className="cart-related">
                    <h3>Вместе вкуснее</h3>
                    <div className="cart-related-grid">
                      {cartRecommendations.map((product) => <article key={`${product.category}-${product.id}`}>
                        <div className="cart-related-art"><ProductArt product={product} mode="related" />{product.isNew && !product.referenceCard ? <span>Новинка</span> : null}</div>
                        <b>{product.name}</b>
                        <div><span>{money(product.price)}</span><button aria-label={`Добавить ${product.name}`} onClick={() => { if (product.modifierGroups?.length) openProduct(product); else addToCart(product); }}>+</button></div>
                      </article>)}
                    </div>
                  </div> : null}
                </section>
                <section className="cart-options">
                  <div className="cart-kit">
                    <h2>Комплектация</h2>
                    <div className="kit-row"><span className="chopsticks-art" aria-hidden="true"><svg className="chopsticks-icon" viewBox="0 0 64 64"><path d="M12 58 42 8" /><path d="M24 58 54 9" /></svg></span><div><b>Палочки</b><div className="kit-quantity"><button disabled={noUtensils || utensilsCount === 0} onClick={() => setUtensilsCount((current) => Math.max(0, current - 1))}>−</button><span>{noUtensils ? 0 : utensilsCount}</span><button disabled={noUtensils || utensilsCount >= 20} onClick={() => setUtensilsCount((current) => Math.min(20, current + 1))}>+</button></div></div><label className="no-utensils"><span><b>Без<br />приборов</b><small>Если не<br />используете –<br />это экологично</small></span><button role="switch" aria-checked={noUtensils} className={noUtensils ? "active" : ""} onClick={() => setNoUtensils((current) => !current)}><i /></button></label></div>
                    <div className="kit-extras">{cartKitItems.map((item) => <div className="kit-extra" key={item.name}><img src={item.image} alt="" /><span><b>{item.name}</b><small>1 шт.</small></span></div>)}</div>
                  </div>
                  <div className="cart-benefit"><h2>Выгода</h2><div><span><b>Промокод или акция</b><small>Нужно будет авторизоваться</small></span><button>Выбрать</button></div></div>
                  <div className="cart-summary"><div className="cart-delivery-summary"><img src={deliveryType === "pickup" ? "/pickup.png" : "/delivery.png"} alt="" /><span><b>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</b><small>{deliveryType === "pickup" ? "Примерно через 40 минут" : "Примерно через 45 минут"}</small></span></div><button className="checkout" onClick={beginCheckout}><span>Оформить заказ</span><b>{money(cartTotal)}</b></button></div>
                </section>
              </div>
            </>}
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="drawer-overlay checkout-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !checkoutSubmitting) setCheckoutOpen(false); }}>
          <aside className="checkout-drawer" aria-label={placedOrder ? "Заказ принят" : "Оформление заказа"}>
            {placedOrder ? <section className="checkout-success">
              <div className="checkout-success-mark" aria-hidden="true">✓</div>
              <span>Спасибо!</span>
              <h2>Заказ принят</h2>
              <p>Номер заказа <b>#{placedOrder.orderNumber || placedOrder.id.slice(0, 8).toUpperCase()}</b>. Мы уже передали его ресторану.</p>
              <div><span>К оплате</span><b>{money(placedOrder.total)}</b></div>
              <button type="button" onClick={() => { setCheckoutOpen(false); setPlacedOrder(null); }}>Вернуться в меню</button>
            </section> : <form className="checkout-form" onSubmit={submitOrder}>
              <header className="checkout-head">
                <button type="button" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }} aria-label="Вернуться в корзину">←</button>
                <div><small>Последний шаг</small><h2>Оформление заказа</h2></div>
                <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Закрыть">×</button>
              </header>

              <div className="checkout-scroll">
                <section className="checkout-section checkout-contact">
                  <h3>Контакты</h3>
                  <label><span>Имя</span><input required autoComplete="name" value={checkoutForm.customerName} onChange={(event) => updateCheckoutField("customerName", event.target.value)} placeholder="Как к вам обращаться" /></label>
                  <label><span>Телефон</span><input required autoComplete="tel" inputMode="tel" value={checkoutForm.phone} onChange={(event) => updateCheckoutField("phone", event.target.value)} placeholder="+996 555 123 456" /></label>
                </section>

                <section className="checkout-section checkout-destination">
                  <div className="checkout-section-heading"><div><h3>{deliveryType === "pickup" ? "Самовывоз" : "Доставка"}</h3><p>{deliveryType === "pickup" ? "Примерно через 40 минут" : "Примерно через 45 минут"}</p></div><button type="button" onClick={editCheckoutAddress}>Изменить</button></div>
                  <strong>{address}</strong>
                  {deliveryType === "delivery" ? <div className="checkout-address-details">
                    <label><span>Квартира</span><input value={checkoutForm.apartment} onChange={(event) => updateCheckoutField("apartment", event.target.value)} /></label>
                    <label><span>Подъезд</span><input value={checkoutForm.entrance} onChange={(event) => updateCheckoutField("entrance", event.target.value)} /></label>
                    <label><span>Этаж</span><input value={checkoutForm.floor} onChange={(event) => updateCheckoutField("floor", event.target.value)} /></label>
                    <label><span>Домофон</span><input value={checkoutForm.intercom} onChange={(event) => updateCheckoutField("intercom", event.target.value)} /></label>
                  </div> : null}
                </section>

                <section className="checkout-section">
                  <h3>Оплата при получении</h3>
                  <div className="checkout-payment" role="group" aria-label="Способ оплаты">
                    <button type="button" className={checkoutForm.paymentMethod === "card_on_delivery" ? "active" : ""} aria-pressed={checkoutForm.paymentMethod === "card_on_delivery"} onClick={() => updateCheckoutField("paymentMethod", "card_on_delivery")}><span>▣</span><b>Картой курьеру</b></button>
                    <button type="button" className={checkoutForm.paymentMethod === "cash" ? "active" : ""} aria-pressed={checkoutForm.paymentMethod === "cash"} onClick={() => updateCheckoutField("paymentMethod", "cash")}><span>сом</span><b>Наличными</b></button>
                  </div>
                </section>

                <section className="checkout-section">
                  <h3>Комментарий</h3>
                  <textarea value={checkoutForm.comment} onChange={(event) => updateCheckoutField("comment", event.target.value)} placeholder="Например, не звонить в домофон" maxLength={500} />
                </section>

                <section className="checkout-section checkout-order-summary">
                  <h3>Ваш заказ</h3>
                  {cart.map((line) => <div className="checkout-line" key={line.key}>
                    <span><b>{line.product.name} × {line.quantity}</b>{line.modifiers.length ? <small>{line.modifiers.map((modifier) => `${modifier.itemName} ×${modifier.quantity}`).join(", ")}</small> : null}</span>
                    <strong>{money(cartLineTotal(line))}</strong>
                  </div>)}
                  <div className="checkout-total"><span>Итого</span><b>{money(cartTotal)}</b></div>
                </section>
              </div>

              <footer className="checkout-footer">
                {checkoutError ? <div className="checkout-error" role="alert">{checkoutError}</div> : null}
                <button className="checkout-submit" type="submit" disabled={checkoutSubmitting || !checkoutForm.customerName.trim() || !checkoutForm.phone.trim()}>
                  <span>{checkoutSubmitting ? "Отправляем заказ…" : "Заказать"}</span>
                  <b>{money(cartTotal)}</b>
                </button>
                <small>Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных</small>
              </footer>
            </form>}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
