"use client";
/* eslint-disable @next/next/no-img-element */

import { Icon } from "@mdi/react";
import {
  mdiAccountOutline,
  mdiCreditCardOutline,
  mdiMapMarkerOutline,
  mdiMessageOutline,
  mdiOfficeBuildingOutline,
  mdiOpenInNew,
  mdiPhoneOutline,
  mdiReceiptTextOutline,
  mdiSilverwareForkKnife,
} from "@mdi/js";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeliveryZoneEditor, type DeliveryZonePoint } from "./DeliveryZoneEditor";
import { StatisticsDashboard, type StatisticsPeriod } from "./StatisticsDashboard";

type PickupLocation = { id: number; title: string; address: string; workingHours: string; latitude: number | null; longitude: number | null; yandexUrl: string; enabled: boolean; sortOrder: number };
type Region = { id: number; slug: string; name: string; enabled: boolean; sortOrder: number; menuSourceRegionSlug: string | null; promotionSourceRegionSlug: string | null; contactPhone: string; contactEmail: string; contactAddress: string; supportPhone: string; supportUrl: string; pickupAddress: string; pickupYandexUrl: string; pickupWorkingHours: string; pickupLocations?: PickupLocation[]; deliveryOpenTime: string; deliveryCloseTime: string; deliveryIs24Hours: boolean; deliveryWorkingDays: number[]; freeDeliveryThreshold: number; deliveryFee: number; estimatedDeliveryMinutes: number; minimumOrderAmount: number; maximumOrderAmount: number; deliveryZone: DeliveryZonePoint[]; footerCompanyName: string; footerLegalInfo: string };
type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  naktaCoins: number;
  oldPrice: number | null;
  image: string;
  description: string;
  composition: string;
  isNew: boolean;
  modifierGroups: ModifierGroup[];
  available: boolean;
  posDishId: string | null;
  posVariantId: string | null;
  posAvailable: boolean;
  posLastSyncedAt: string | null;
  sortOrder: number;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
type ModifierItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  enabled?: boolean;
  maxQuantity?: number;
};
type ModifierGroup = {
  id: string;
  title: string;
  selectionType: "single" | "multiple";
  presentation?: "rows" | "cards";
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  priceScope?: "per-product" | "per-line";
  items: ModifierItem[];
};
type Category = { id: number; title: string; slug: string; image: string; sortOrder: number; products: Product[] };
type Promotion = { id: number; title: string; image: string; cta: string; ctaUrl: string; enabled: boolean; sortOrder: number };
type Dashboard = { region: Region; menuRegionSlug: string; promotionRegionSlug: string; categories: Category[]; promotions: Promotion[] };
type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";
type OrderModifierSnapshot = {
  groupId: string;
  groupTitle: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  priceScope: "per-product" | "per-line";
};
type AdminOrderItem = {
  id: number;
  productId: number;
  productName: string;
  basePrice: number;
  baseTotal?: number;
  modifiersPrice: number;
  modifiersTotal?: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  pricingVersion?: string;
  modifierSnapshots: OrderModifierSnapshot[];
  posStatus?: string | null;
  posReadyQuantity?: number;
  posRejectReason?: string | null;
};
type AdminOrder = {
  id: string;
  orderNumber: number;
  regionSlug: string;
  deliveryType: "delivery" | "pickup";
  customerName: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  utensilsCount: number;
  noUtensils: boolean;
  paymentMethod: "cash" | "card" | "online";
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  externalOrderId?: string | null;
  posOrderNumber?: string | null;
  posStatus?: string | null;
  posSyncStatus?: "pending" | "submitting" | "synced" | "pos_sync_failed";
  posItemsTotal?: number;
  posItemsReady?: number;
  posItemsRejected?: number;
  posLastError?: string;
  items: AdminOrderItem[];
};
type OrdersResponse = { items: AdminOrder[]; total: number; limit: number; offset: number; statusCounts: Partial<Record<OrderStatus, number>> };
type OrderPeriod = "all" | "today" | "week" | "month";
type Tab = "statistics" | "orders" | "products" | "promotions" | "categories" | "settings";
type EditorKind = "product" | "promotion" | "category";
type EditorValue = string | boolean | ModifierGroup[];
type Editor = { kind: EditorKind; id?: number; values: Record<string, EditorValue> };
type PickupLocationEditor = {
  id?: number;
  title: string;
  address: string;
  workingHours: string;
  latitude: string;
  longitude: string;
  yandexUrl: string;
  enabled: boolean;
  sortOrder: string;
};
type PickupCoordinatesResponse = {
  latitude: number;
  longitude: number;
  resolvedUrl: string;
};
type RegionEditor = {
  id?: number;
  values: Record<string, string | boolean | number[]>;
  pickupLocations: PickupLocationEditor[];
};

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");
const defaultDeliveryZones: Record<string, DeliveryZonePoint[]> = {
  bishkek: [[42.94, 74.48], [42.945, 74.62], [42.925, 74.71], [42.89, 74.75], [42.835, 74.74], [42.795, 74.68], [42.78, 74.57], [42.795, 74.48], [42.84, 74.43], [42.9, 74.44]].map(([latitude, longitude]) => ({ latitude, longitude })),
  osh: [[40.59, 72.75], [40.6, 72.84], [40.565, 72.9], [40.505, 72.91], [40.46, 72.86], [40.445, 72.78], [40.475, 72.72], [40.535, 72.7]].map(([latitude, longitude]) => ({ latitude, longitude })),
  "otuz-adyr": [[40.64, 72.92], [40.645, 72.98], [40.625, 73.02], [40.59, 73.02], [40.565, 72.99], [40.565, 72.94], [40.585, 72.91], [40.62, 72.91]].map(([latitude, longitude]) => ({ latitude, longitude })),
};
const defaultRegions: Region[] = [
  { id: 0, slug: "bishkek", name: "Бишкек", enabled: true, sortOrder: 0, menuSourceRegionSlug: null, promotionSourceRegionSlug: null, contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones.bishkek, footerCompanyName: "", footerLegalInfo: "" },
  { id: 1, slug: "osh", name: "Ош", enabled: true, sortOrder: 1, menuSourceRegionSlug: null, promotionSourceRegionSlug: null, contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones.osh, footerCompanyName: "", footerLegalInfo: "" },
  { id: 2, slug: "otuz-adyr", name: "Отуз-Адыр", enabled: true, sortOrder: 2, menuSourceRegionSlug: "osh", promotionSourceRegionSlug: "osh", contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones["otuz-adyr"], footerCompanyName: "", footerLegalInfo: "" },
];

function formatDeliveryZone(points: DeliveryZonePoint[] | undefined) {
  return (points || []).map((point) => `${point.latitude}, ${point.longitude}`).join("\n");
}

function parseDeliveryZone(value: string) {
  const points = value.split(/\r?\n|;/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [latitude, longitude, extra] = line.split(/[\s,]+/).filter(Boolean).map(Number);
    if (extra !== undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`Некорректная точка зоны доставки: ${line}`);
    }
    return { latitude, longitude };
  });
  if (points.length < 3) throw new Error("Укажите минимум три точки зоны доставки");
  return points;
}

function deliveryZoneEditorPoints(value: string) {
  try {
    return parseDeliveryZone(value);
  } catch {
    return [];
  }
}
const deliveryWeekdays = [
  { value: 1, label: "Пн" }, { value: 2, label: "Вт" }, { value: 3, label: "Ср" },
  { value: 4, label: "Чт" }, { value: 5, label: "Пт" }, { value: 6, label: "Сб" }, { value: 0, label: "Вс" },
];
function globalScheduleText(values: RegionEditor["values"]) {
  const days = Array.isArray(values.deliveryWorkingDays)
    ? values.deliveryWorkingDays as number[]
    : [0, 1, 2, 3, 4, 5, 6];
  const dayLabel = days.length === 7
    ? "Ежедневно, без выходных"
    : days.length
      ? deliveryWeekdays.filter((day) => days.includes(day.value)).map((day) => day.label).join(", ")
      : "Нет рабочих дней";
  const hours = values.deliveryIs24Hours
    ? "Круглосуточно"
    : `${String(values.deliveryOpenTime || "11:30")} – ${String(values.deliveryCloseTime || "22:30")}`;
  return `${dayLabel}, ${hours}`;
}
const defaultRegionByTab: Record<Tab, string> = {
  statistics: "bishkek",
  orders: "bishkek",
  products: "bishkek",
  promotions: "bishkek",
  categories: "bishkek",
  settings: "bishkek",
};
const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
};
const posStatusLabels: Record<string, string> = {
  sent_to_kitchen: "Передан на кухню",
  accepted_by_kitchen: "Принят кухней",
  cooking: "Готовится",
  partially_rejected: "Частично отклонён",
  ready: "Готов",
  rejected: "Отклонён кухней",
  cancelled: "Отменён",
};
const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivering", "completed", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const formatOrderDate = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const formatOrderNumber = (order: Pick<AdminOrder, "id" | "orderNumber">) =>
  `№${order.orderNumber || order.id.slice(0, 6).toUpperCase()}`;
const formatSom = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} сом`;
const ordersPerPage = 10;
const slugify = (value: string) => {
  const letters: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
  return value.toLowerCase().split("").map((letter) => letters[letter] ?? letter).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
};

const emptyProduct = (categoryId = ""): Editor => ({
  kind: "product",
  values: {
    name: "",
    slug: "",
    categoryId,
    price: "0",
    naktaCoins: "0",
    oldPrice: "",
    image: "",
    description: "",
    composition: "",
    isNew: false,
    modifierGroups: [],
    available: true,
    posDishId: "",
    posVariantId: "",
    sortOrder: "0",
    weight: "0",
    calories: "0",
    protein: "0",
    fat: "0",
    carbs: "0",
  },
});

function fileToOptimizedDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Не удалось обработать изображение"));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AdminApp() {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [regionByTab, setRegionByTab] = useState<Record<Tab, string>>(defaultRegionByTab);
  const [availableRegions, setAvailableRegions] = useState<Region[]>(defaultRegions);
  const [tab, setTab] = useState<Tab>("statistics");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorSection, setEditorSection] = useState<"main" | "modifiers" | "nutrition">("main");
  const [loading, setLoading] = useState(false);
  const [eduPosAction, setEduPosAction] = useState<"import" | "export" | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<"all" | string>("all");
  const [statisticsOrders, setStatisticsOrders] = useState<AdminOrder[]>([]);
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>("week");
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [openProductActions, setOpenProductActions] = useState<number | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [orderPeriod, setOrderPeriod] = useState<OrderPeriod>("all");
  const [orderPage, setOrderPage] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<OrderStatus, number>>>({});
  const [regionEditor, setRegionEditor] = useState<RegionEditor | null>(null);
  const [regionEditorSection, setRegionEditorSection] = useState<"main" | "delivery" | "pickup" | "footer">("main");
  const [deletedPickupLocationIds, setDeletedPickupLocationIds] = useState<number[]>([]);
  const [pickupResolvingIndex, setPickupResolvingIndex] = useState<number | null>(null);
  const [openOrderMenu, setOpenOrderMenu] = useState<"status" | "period" | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const orderControlsRef = useRef<HTMLDivElement>(null);
  const region = regionByTab[tab];

  const selectRegion = (slug: string) => {
    setRegionByTab((current) => ({ ...current, [tab]: slug }));
    setOrderPage(1);
    setEditor(null);
  };

  useEffect(() => {
    queueMicrotask(() => setToken(sessionStorage.getItem("losos-admin-token") || ""));
  }, []);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        ...init?.headers,
      },
    });
    if (response.status === 401) throw new Error("Неверный код администратора");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const details = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
      throw new Error(details || "Не удалось сохранить изменения");
    }
    return response.json();
  }, [token]);

  const requestPickupCoordinates = useCallback((yandexUrl: string) => request(
    "/admin/pickup-locations/resolve-map-link",
    {
      method: "POST",
      body: JSON.stringify({ yandexUrl: yandexUrl.trim() }),
    },
  ) as Promise<PickupCoordinatesResponse>, [request]);

  const fillPickupCoordinates = useCallback(async (index: number) => {
    const location = regionEditor?.pickupLocations[index];
    if (!location?.yandexUrl.trim() || pickupResolvingIndex !== null) return;
    setPickupResolvingIndex(index);
    setMessage("");
    try {
      const resolved = await requestPickupCoordinates(location.yandexUrl);
      setRegionEditor((current) => current ? {
        ...current,
        pickupLocations: current.pickupLocations.map((item, locationIndex) => (
          locationIndex === index
            ? {
                ...item,
                latitude: String(resolved.latitude),
                longitude: String(resolved.longitude),
              }
            : item
        )),
      } : current);
      setMessage("Координаты кухни определены по ссылке");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось определить координаты");
    } finally {
      setPickupResolvingIndex(null);
    }
  }, [pickupResolvingIndex, regionEditor?.pickupLocations, requestPickupCoordinates]);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const nextRegions = await request("/admin/settings") as Region[];
      if (!nextRegions.length) return;
      setAvailableRegions(nextRegions);
      setRegionByTab((current) => (Object.keys(current) as Tab[]).reduce((next, item) => ({
        ...next,
        [item]: nextRegions.some((region) => region.slug === current[item]) ? current[item] : nextRegions[0].slug,
      }), {} as Record<Tab, string>));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить настройки");
    }
  }, [request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSettings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSettings]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3_500);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!openOrderMenu) return;
    const closeMenu = (event: PointerEvent) => {
      if (!orderControlsRef.current?.contains(event.target as Node)) setOpenOrderMenu(null);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, [openOrderMenu]);

  useEffect(() => {
    if (openProductActions === null) return;
    const closeActions = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest(".admin-product-actions")) setOpenProductActions(null);
    };
    document.addEventListener("pointerdown", closeActions);
    return () => document.removeEventListener("pointerdown", closeActions);
  }, [openProductActions]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      setDashboard(await request(`/admin/dashboard?region=${region}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [region, request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const loadOrders = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setOrdersLoading(true);
    try {
      const query = new URLSearchParams({ regionSlug: region, limit: String(ordersPerPage), offset: String((orderPage - 1) * ordersPerPage) });
      if (orderFilter !== "all") query.set("status", orderFilter);
      if (orderPeriod !== "all") {
        const now = new Date();
        const from = new Date(now);
        from.setHours(0, 0, 0, 0);
        if (orderPeriod === "week") from.setDate(from.getDate() - 6);
        if (orderPeriod === "month") from.setDate(1);
        query.set("from", from.toISOString());
        query.set("to", now.toISOString());
      }
      const result = await request(`/admin/orders?${query}`) as OrdersResponse;
      setOrders(result.items);
      setOrdersTotal(result.total);
      setStatusCounts(result.statusCounts || {});
      setSelectedOrder((current) => current
        ? result.items.find((order) => order.id === current.id) || current
        : null);
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : "Не удалось загрузить заказы");
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  }, [orderFilter, orderPage, orderPeriod, region, request, token]);

  useEffect(() => {
    if (tab !== "orders" || !token) return;
    const initialTimer = window.setTimeout(() => void loadOrders(), 0);
    const refreshTimer = window.setInterval(() => void loadOrders(true), 15_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadOrders, tab, token]);

  const loadStatistics = useCallback(async () => {
    if (!token) return;
    setStatisticsLoading(true);
    try {
      const items: AdminOrder[] = [];
      let offset = 0;
      let total = 0;
      do {
        const result = await request(`/admin/orders?${new URLSearchParams({ regionSlug: region, limit: "100", offset: String(offset) })}`) as OrdersResponse;
        items.push(...result.items);
        total = result.total;
        offset += result.items.length;
      } while (offset < total && offset < 2_000);
      setStatisticsOrders(items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить статистику");
    } finally {
      setStatisticsLoading(false);
    }
  }, [region, request, token]);

  useEffect(() => {
    if (tab !== "statistics" || !token) return;
    const timer = window.setTimeout(() => void loadStatistics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStatistics, tab, token]);

  const products = useMemo(() => dashboard?.categories.flatMap((category) =>
    category.products.map((product) => ({ ...product, categoryId: category.id, categoryTitle: category.title }))) || [], [dashboard]);
  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = orderFilter === "all" || order.status === orderFilter;
    const haystack = `${order.id} ${order.customerName} ${order.phone} ${order.address}`.toLocaleLowerCase("ru");
    return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
  }), [normalizedSearch, orderFilter, orders]);
  const visibleProducts = useMemo(() => products.filter((product) =>
    (productCategoryFilter === "all" || String(product.categoryId) === productCategoryFilter)
    && (!normalizedSearch || `${product.name} ${product.categoryTitle} ${product.id}`.toLocaleLowerCase("ru").includes(normalizedSearch))
  ), [normalizedSearch, productCategoryFilter, products]);
  const visiblePromotions = useMemo(() => (dashboard?.promotions || []).filter((promotion) =>
    !normalizedSearch || promotion.title.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [dashboard?.promotions, normalizedSearch]);
  const visibleCategories = useMemo(() => (dashboard?.categories || []).filter((category) =>
    !normalizedSearch || `${category.title} ${category.slug}`.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [dashboard?.categories, normalizedSearch]);
  const statistics = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    if (statisticsPeriod === "today") from.setHours(0, 0, 0, 0);
    if (statisticsPeriod === "week") { from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - 6); }
    if (statisticsPeriod === "month") { from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - 29); }
    if (statisticsPeriod === "all") from.setTime(0);
    const completionDate = (order: AdminOrder) => new Date(order.completedAt || order.updatedAt || order.createdAt);
    const completedOrders = statisticsOrders.filter((order) => order.status === "completed" && completionDate(order) >= from);
    const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const byProduct = new Map<string, { name: string; count: number; revenue: number }>();
    const byPayment = new Map<string, number>();
    const byHour = new Map<number, number>();
    const byStatus = new Map<OrderStatus, number>();
    for (const order of completedOrders) {
      byPayment.set(order.paymentMethod, (byPayment.get(order.paymentMethod) || 0) + order.total);
      const hour = completionDate(order).getHours();
      byHour.set(hour, (byHour.get(hour) || 0) + order.total);
      byStatus.set(order.status, (byStatus.get(order.status) || 0) + 1);
      for (const item of order.items) {
        const current = byProduct.get(item.productName) || { name: item.productName, count: 0, revenue: 0 };
        current.count += item.quantity;
        current.revenue += item.lineTotal;
        byProduct.set(item.productName, current);
      }
    }
    const productRows = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue);
    const paymentLabels: Record<string, string> = { cash: "Наличные", card: "Картой", online: "Онлайн" };
    const payments = [...byPayment.entries()].map(([name, amount]) => ({ name: paymentLabels[name] || name, amount })).sort((a, b) => b.amount - a.amount);
    const peaks = [...byHour.entries()].map(([hour, amount]) => ({ label: `${String(hour).padStart(2, "0")}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`, amount })).sort((a, b) => b.amount - a.amount);
    const statuses = [...byStatus.entries()].map(([status, count]) => ({ name: orderStatusLabels[status], count })).sort((a, b) => b.count - a.count);
    const days = 7;
    const chart = Array.from({ length: days }, (_, index) => {
      const day = new Date(now);
      if (statisticsPeriod === "today") { day.setHours(index * 4, 0, 0, 0); }
      else { day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (days - 1 - index)); }
      const amount = completedOrders.filter((order) => {
        const date = completionDate(order);
        return statisticsPeriod === "today" ? date.getHours() >= index * 4 && date.getHours() < (index + 1) * 4 : date.toDateString() === day.toDateString();
      }).reduce((sum, order) => sum + order.total, 0);
      return { label: statisticsPeriod === "today" ? `${String(index * 4).padStart(2, "0")}:00` : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(day), amount };
    });
    const chartMax = Math.max(...chart.map((point) => point.amount), 1);
    return { orders: completedOrders.length, revenue, average: completedOrders.length ? revenue / completedOrders.length : 0, products: productRows, payments, peaks, statuses, chart: chart.map((point) => ({ ...point, percent: Math.max(4, (point.amount / chartMax) * 100) })) };
  }, [statisticsOrders, statisticsPeriod]);

  const openProduct = (product?: Product & { categoryId: number }) => {
    setEditorSection("main");
    if (!product) {
      setEditor(emptyProduct(productCategoryFilter === "all" ? String(dashboard?.categories[0]?.id || "") : productCategoryFilter));
      return;
    }
    setEditor({
      kind: "product",
      id: product.id,
      values: {
        name: product.name,
        slug: product.slug,
        image: product.image,
        description: product.description,
        composition: product.composition,
        available: product.available,
        posDishId: product.posDishId || "",
        posVariantId: product.posVariantId || "",
        isNew: product.isNew,
        modifierGroups: product.modifierGroups || [],
        categoryId: String(product.categoryId),
        price: String(product.price),
        naktaCoins: String(product.naktaCoins || 0),
        oldPrice: product.oldPrice ? String(product.oldPrice) : "",
        sortOrder: String(product.sortOrder),
        weight: String(product.weight),
        calories: String(product.calories),
        protein: String(product.protein),
        fat: String(product.fat),
        carbs: String(product.carbs),
      },
    });
  };

  const openPromotion = (promotion?: Promotion) => {
    setEditorSection("main");
    setEditor(promotion ? {
      kind: "promotion",
      id: promotion.id,
      values: {
        title: promotion.title,
        image: promotion.image,
        cta: promotion.cta,
        ctaUrl: promotion.ctaUrl,
        enabled: promotion.enabled,
        sortOrder: String(promotion.sortOrder),
      },
    } : {
      kind: "promotion",
      values: { title: "", image: "", cta: "", ctaUrl: "", enabled: true, sortOrder: "0" },
    });
  };

  const openCategory = (category?: Category) => {
    setEditorSection("main");
    setEditor(category ? {
      kind: "category",
      id: category.id,
      values: { title: category.title, slug: category.slug, image: category.image || "", sortOrder: String(category.sortOrder) },
    } : {
      kind: "category",
      values: { title: "", slug: "", image: "", sortOrder: "0" },
    });
  };

  const updateValue = (name: string, value: EditorValue) => {
    setEditor((current) => current ? { ...current, values: { ...current.values, [name]: value } } : current);
  };

  const saveEditor = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const numberFields = ["categoryId", "price", "naktaCoins", "sortOrder", "weight", "calories", "protein", "fat", "carbs"];
    const editorValues = { ...editor.values };
    if (!editor.id && editor.kind !== "promotion") editorValues.slug = slugify(String(editorValues.title || editorValues.name || "")) || `${editor.kind}-${Date.now()}`;
    const payload = Object.fromEntries(Object.entries(editorValues).map(([key, value]) =>
      [key, key === "oldPrice" ? (value === "" ? null : Number(value)) : numberFields.includes(key) ? Number(value) : value]));
    if (!editor.id) payload.regionSlug = region;
    const resource = editor.kind === "product" ? "products" : editor.kind === "promotion" ? "promotions" : "categories";
    setLoading(true);
    setMessage("");
    try {
      await request(`/admin/${resource}${editor.id ? `/${editor.id}` : ""}`, {
        method: editor.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setEditor(null);
      setMessage("Изменения сохранены");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  const deleteEditor = async () => {
    if (!editor?.id || !window.confirm("Удалить без возможности восстановления?")) return;
    const resource = editor.kind === "product" ? "products" : editor.kind === "promotion" ? "promotions" : "categories";
    setLoading(true);
    try {
      await request(`/admin/${resource}/${editor.id}`, { method: "DELETE" });
      setEditor(null);
      setMessage("Удалено");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить");
    } finally {
      setLoading(false);
    }
  };

  const updateProductAvailability = async (product: Product) => {
    setOpenProductActions(null);
    setLoading(true);
    try {
      await request(`/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ available: !product.available }) });
      setMessage(product.available ? "Блюдо снято с продажи" : "Блюдо доступно для заказа");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить доступность блюда");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    setOpenProductActions(null);
    if (!window.confirm(`Удалить блюдо «${product.name}» без возможности восстановления?`)) return;
    setLoading(true);
    try {
      await request(`/admin/products/${product.id}`, { method: "DELETE" });
      setMessage("Блюдо удалено");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить блюдо");
    } finally {
      setLoading(false);
    }
  };

  const authorize = (event: FormEvent) => {
    event.preventDefault();
    const nextToken = tokenDraft.trim();
    if (!nextToken) return;
    sessionStorage.setItem("losos-admin-token", nextToken);
    setToken(nextToken);
  };

  const logout = () => {
    sessionStorage.removeItem("losos-admin-token");
    setToken("");
    setDashboard(null);
    setOrders([]);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (order: AdminOrder, status: OrderStatus) => {
    setOrdersLoading(true);
    setMessage("");
    try {
      const updated = await request(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }) as AdminOrder;
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setStatisticsOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedOrder(updated);
      setMessage(`${formatOrderNumber(updated)}: ${orderStatusLabels[updated.status]}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить статус");
      await loadOrders(true);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openRegion = (item?: Region) => {
    setRegionEditorSection("main");
    setDeletedPickupLocationIds([]);
    setRegionEditor(item ? {
      id: item.id,
      values: {
        slug: item.slug,
        name: item.name,
        enabled: item.enabled,
        sortOrder: String(item.sortOrder),
        menuSourceRegionSlug: item.menuSourceRegionSlug || "",
        promotionSourceRegionSlug: item.promotionSourceRegionSlug || "",
        contactPhone: item.contactPhone || "",
        contactEmail: item.contactEmail || "",
        contactAddress: item.contactAddress || "",
        supportPhone: item.supportPhone || "",
        supportUrl: item.supportUrl || "",
        pickupAddress: item.pickupAddress || "",
        pickupYandexUrl: item.pickupYandexUrl || "",
        pickupWorkingHours: item.pickupWorkingHours || "",
        deliveryOpenTime: item.deliveryOpenTime || "11:30",
        deliveryCloseTime: item.deliveryCloseTime || "22:30",
        deliveryIs24Hours: item.deliveryIs24Hours === true,
        deliveryWorkingDays: Array.isArray(item.deliveryWorkingDays) ? item.deliveryWorkingDays : [0, 1, 2, 3, 4, 5, 6],
        freeDeliveryThreshold: String(item.freeDeliveryThreshold ?? 4900),
        deliveryFee: String(item.deliveryFee ?? 99),
        estimatedDeliveryMinutes: String(item.estimatedDeliveryMinutes ?? 50),
        minimumOrderAmount: String(item.minimumOrderAmount ?? 900),
        maximumOrderAmount: String(item.maximumOrderAmount ?? 30000),
        deliveryZone: formatDeliveryZone(item.deliveryZone?.length ? item.deliveryZone : defaultDeliveryZones[item.slug]),
        footerCompanyName: item.footerCompanyName || "",
        footerLegalInfo: item.footerLegalInfo || "",
      },
      pickupLocations: (item.pickupLocations || []).map((location) => ({
        id: location.id,
        title: location.title || "",
        address: location.address,
        workingHours: location.workingHours || "",
        latitude: location.latitude === null ? "" : String(location.latitude),
        longitude: location.longitude === null ? "" : String(location.longitude),
        yandexUrl: location.yandexUrl || "",
        enabled: location.enabled,
        sortOrder: String(location.sortOrder),
      })),
    } : {
      values: {
        slug: "",
        name: "",
        enabled: true,
        sortOrder: String(availableRegions.length),
        menuSourceRegionSlug: "",
        promotionSourceRegionSlug: "",
        contactPhone: "",
        contactEmail: "",
        contactAddress: "",
        supportPhone: "",
        supportUrl: "",
        pickupAddress: "",
        pickupYandexUrl: "",
        pickupWorkingHours: "",
        deliveryOpenTime: "11:30",
        deliveryCloseTime: "22:30",
        deliveryIs24Hours: false,
        deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6],
        freeDeliveryThreshold: "4900",
        deliveryFee: "99",
        estimatedDeliveryMinutes: "50",
        minimumOrderAmount: "900",
        maximumOrderAmount: "30000",
        deliveryZone: "",
        footerCompanyName: "",
        footerLegalInfo: "",
      },
      pickupLocations: [],
    });
  };

  const updateRegionValue = (name: string, value: string | boolean | number[]) => {
    setRegionEditor((current) => current ? { ...current, values: { ...current.values, [name]: value } } : current);
  };

  const updatePickupLocation = (
    index: number,
    name: keyof PickupLocationEditor,
    value: string | boolean,
  ) => {
    setRegionEditor((current) => current ? {
      ...current,
      pickupLocations: current.pickupLocations.map((location, locationIndex) => (
        locationIndex === index ? { ...location, [name]: value } : location
      )),
    } : current);
  };

  const addPickupLocation = () => {
    setRegionEditor((current) => current ? {
      ...current,
      pickupLocations: [...current.pickupLocations, {
        title: "",
        address: "",
        workingHours: "",
        latitude: "",
        longitude: "",
        yandexUrl: "",
        enabled: true,
        sortOrder: String(current.pickupLocations.length),
      }],
    } : current);
  };

  const removePickupLocation = (index: number) => {
    setRegionEditor((current) => {
      if (!current) return current;
      const location = current.pickupLocations[index];
      if (location?.id) {
        setDeletedPickupLocationIds((ids) => [...ids, location.id as number]);
      }
      return {
        ...current,
        pickupLocations: current.pickupLocations.filter((_, locationIndex) => locationIndex !== index),
      };
    });
  };

  const saveRegion = async (event: FormEvent) => {
    event.preventDefault();
    if (!regionEditor) return;
    setLoading(true);
    setMessage("");
    try {
      const pickupLocations = await Promise.all(regionEditor.pickupLocations.map(async (location) => {
        if (!location.yandexUrl.trim()) return location;
        const resolved = await requestPickupCoordinates(location.yandexUrl);
        return {
          ...location,
          latitude: String(resolved.latitude),
          longitude: String(resolved.longitude),
        };
      }));
      const schedule = globalScheduleText(regionEditor.values);
      const firstPickup = pickupLocations.find((location) => location.enabled)
        ?? pickupLocations[0];
      const { deliveryZone: deliveryZoneValue, ...values } = regionEditor.values;
      const payload = {
        ...values,
        pickupAddress: firstPickup?.address.trim() || "",
        pickupYandexUrl: firstPickup?.yandexUrl.trim() || "",
        pickupWorkingHours: firstPickup ? schedule : "",
        sortOrder: Number(regionEditor.values.sortOrder),
        freeDeliveryThreshold: Number(regionEditor.values.freeDeliveryThreshold),
        deliveryFee: Number(regionEditor.values.deliveryFee),
        estimatedDeliveryMinutes: Number(regionEditor.values.estimatedDeliveryMinutes),
        minimumOrderAmount: Number(regionEditor.values.minimumOrderAmount),
        maximumOrderAmount: Number(regionEditor.values.maximumOrderAmount),
        deliveryZone: parseDeliveryZone(String(deliveryZoneValue || "")),
        slug: String(regionEditor.values.slug).trim().toLowerCase().replace(/\s+/g, "-"),
      };
      const saved = await request(`/admin/regions${regionEditor.id ? `/${regionEditor.id}` : ""}`, {
        method: regionEditor.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      }) as Region;
      await Promise.all([
        ...pickupLocations
          .filter((location) => location.address.trim())
          .map((location) => request(
            `/admin/pickup-locations${location.id ? `/${location.id}` : ""}`,
            {
              method: location.id ? "PATCH" : "POST",
              body: JSON.stringify({
                ...(!location.id ? { regionId: saved.id } : {}),
                title: location.title.trim(),
                address: location.address.trim(),
                workingHours: schedule,
                latitude: location.latitude === "" ? undefined : Number(location.latitude),
                longitude: location.longitude === "" ? undefined : Number(location.longitude),
                yandexUrl: location.yandexUrl.trim(),
                enabled: location.enabled,
                sortOrder: Number(location.sortOrder),
              }),
            },
          )),
        ...deletedPickupLocationIds.map((id) => request(`/admin/pickup-locations/${id}`, {
          method: "DELETE",
        })),
      ]);
      setRegionEditor(null);
      setDeletedPickupLocationIds([]);
      await loadSettings();
      setRegionByTab((current) => ({ ...current, [tab]: saved.slug }));
      setMessage("Настройки города сохранены");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить город");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <main className="admin-login">
      <form onSubmit={authorize}>
        <div className="admin-login-brand"><img src="/logo.webp" alt="Накта суши" /><span><b>Накта суши</b><small>Кабинет управления</small></span></div>
        <h1>Добро пожаловать</h1>
        <p>Управляйте заказами, меню и работой заведений в одном месте.</p>
        <label>Код администратора
          <span className="admin-login-input"><input type="password" name="admin-code" autoComplete="current-password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="Введите код" autoFocus /></span>
        </label>
        <button type="submit">Войти</button>
      </form>
    </main>;
  }

  const tabTitle = tab === "statistics" ? "Статистика" : tab === "orders" ? "Заказы" : tab === "products" ? "Меню" : tab === "promotions" ? "Акции" : tab === "categories" ? "Категории" : "Настройки";
  const tabIcon: Record<Tab, string> = { statistics: "⌁", orders: "▤", products: "☰", promotions: "✦", categories: "▦", settings: "⚙" };
  const tabIconAsset: Partial<Record<Tab, string>> = {
    statistics: "/statistics.svg",
    orders: "/orders.svg",
    products: "/menu.svg",
    settings: "/settings.svg",
  };
  const renderTabIcon = (item: Tab) => <i aria-hidden="true">
    {tabIconAsset[item] ? <img src={tabIconAsset[item]} alt="" /> : tabIcon[item]}
  </i>;
  const switchTab = (item: Tab) => {
    if (item === "products" && tab === "categories") {
      setRegionByTab((current) => ({ ...current, products: current.categories }));
    }
    setTab(item);
    setSearch("");
    setEditor(null);
    setMobileNavOpen(false);
  };

  const importEduPosMenu = async () => {
    if (eduPosAction) return;
    setEduPosAction("import");
    setLoading(true);
    setMessage("");
    try {
      const menu = await request("/admin/edu-pos/sync-menu", { method: "POST" }) as { matched?: number; received?: number };
      const stopList = await request("/admin/edu-pos/sync-stop-list", { method: "POST" }) as { unavailable?: number };
      await loadDashboard();
      setMessage(`EDU POS: сопоставлено ${menu.matched || 0} из ${menu.received || 0}, недоступно ${stopList.unavailable || 0}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось синхронизировать EDU POS");
    } finally {
      setEduPosAction(null);
      setLoading(false);
    }
  };

  const exportEduPosMenu = async () => {
    if (eduPosAction) return;
    setEduPosAction("export");
    setLoading(true);
    setMessage("");
    try {
      const exported = await request(
        `/admin/edu-pos/export-menu?region=${encodeURIComponent(region)}`,
        { method: "POST" },
      ) as { categories?: number; products?: number };
      setMessage(`Меню отправлено в EDU POS: ${exported.products || 0} блюд, ${exported.categories || 0} категорий`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось экспортировать меню в EDU POS");
    } finally {
      setEduPosAction(null);
      setLoading(false);
    }
  };
  const openCategoryManager = () => {
    setRegionByTab((current) => ({ ...current, categories: region }));
    setTab("categories");
    setSearch("");
    setEditor(null);
  };
  const statusOptions: { value: "all" | OrderStatus; label: string }[] = [
    { value: "all", label: "Все статусы" },
    { value: "new", label: "Новые" },
    { value: "confirmed", label: "Подтверждённые" },
    { value: "preparing", label: "Готовятся" },
    { value: "ready", label: "Готовые" },
    { value: "delivering", label: "В пути" },
    { value: "completed", label: "Завершённые" },
    { value: "cancelled", label: "Отменённые" },
  ];
  const periodOptions: { value: OrderPeriod; label: string }[] = [
    { value: "all", label: "Всё время" },
    { value: "today", label: "Сегодня" },
    { value: "week", label: "За 7 дней" },
    { value: "month", label: "В этом месяце" },
  ];
  const totalStatusCount = Object.values(statusCounts).reduce((total, count) => total + (count || 0), 0);
  const selectedStatus = statusOptions.find((option) => option.value === orderFilter) || statusOptions[0];
  const selectedPeriod = periodOptions.find((option) => option.value === orderPeriod) || periodOptions[0];
  const activeOrderCount = (statusCounts.confirmed || 0) + (statusCounts.preparing || 0) + (statusCounts.ready || 0) + (statusCounts.delivering || 0);
  const navigation = ["statistics", "orders", "products", "promotions", "settings"] as Tab[];
  const navigationLabel = (item: Tab) => item === "statistics" ? "Статистика" : item === "orders" ? "Заказы" : item === "products" ? "Меню" : item === "promotions" ? "Акции" : "Настройки";
  const renderNavigationButton = (item: Tab) => <button
    key={item}
    type="button"
    aria-current={tab === item || (item === "products" && tab === "categories") ? "page" : undefined}
    className={tab === item || (item === "products" && tab === "categories") ? "active" : ""}
    onClick={() => switchTab(item)}
  >{renderTabIcon(item)}<span>{navigationLabel(item)}</span></button>;
  const renderSidebar = (mobile = false) => <aside className={`admin-sidebar${mobile ? " admin-sidebar-mobile" : ""}`} aria-label="Навигация администратора">
    <div className="admin-sidebar-brand">
      <img src="/logo.webp" alt="Накта суши" />
      <b>НАКТА СУШИ</b>
    </div>
    <nav className="admin-sidebar-navigation">{navigation.map(renderNavigationButton)}</nav>
    <div className="admin-sidebar-footer">
      <button type="button" className="admin-logout" onClick={logout}><i aria-hidden="true">↪</i><span>Выйти</span></button>
    </div>
  </aside>;

  return <div className={`admin-shell${selectedOrder ? " has-order" : ""}`}>
    {renderSidebar()}
    {mobileNavOpen ? <div className="admin-mobile-drawer open">
      <button type="button" className="admin-mobile-backdrop" aria-label="Закрыть меню" onClick={() => setMobileNavOpen(false)} />
      {renderSidebar(true)}
    </div> : null}

    {message ? <div className="admin-message" role="status">{message}</div> : null}
    {loading && !dashboard ? <div className="admin-loading" role="status">Загружаем…</div> : null}

    <div className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-topbar-title">
          <button type="button" className="admin-menu-toggle" onClick={() => setMobileNavOpen(true)} aria-label="Открыть меню"><span /><span /><span /></button>
          <h1>{tabTitle}</h1>
        </div>
        <div className="admin-topbar-actions">
          <select className="admin-topbar-region-select" aria-label="Город" value={region} onChange={(event) => selectRegion(event.target.value)}>
            {availableRegions.filter((item) => item.enabled).map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
          </select>
        </div>
      </header>

      <section className="admin-content">
      {tab === "statistics" ? <StatisticsDashboard data={statistics} period={statisticsPeriod} loading={statisticsLoading} onPeriodChange={setStatisticsPeriod} /> : null}

      {tab === "orders" ? <>
        <div className="admin-order-overview" aria-label="Сводка заказов">
          <span><small>Всего</small><strong>{ordersTotal}</strong></span>
          <i />
          <span><small>Новые</small><strong>{statusCounts.new || 0}</strong></span>
          <i />
          <span><small>В работе</small><strong>{activeOrderCount}</strong></span>
          <i />
          <span><small>Завершены</small><strong>{statusCounts.completed || 0}</strong></span>
        </div>
        <div className="admin-list-tools">
          <label><i>⌕</i><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по № заказа, клиенту или адресу..." /></label>
          <div className="admin-order-selects" ref={orderControlsRef}>
            <div className={`admin-select-control${openOrderMenu === "status" ? " open" : ""}${orderFilter !== "all" ? " selected" : ""}`}>
              <button type="button" className="admin-select-trigger" aria-haspopup="listbox" aria-expanded={openOrderMenu === "status"} onClick={() => setOpenOrderMenu((current) => current === "status" ? null : "status")}>
                <span>{selectedStatus.label}</span><em>{orderFilter === "all" ? totalStatusCount : statusCounts[orderFilter] || 0}</em>
              </button>
              {openOrderMenu === "status" ? <div className="admin-select-options" role="listbox" aria-label="Статус заказа">
                {statusOptions.map((option) => {
                  const count = option.value === "all" ? totalStatusCount : statusCounts[option.value] || 0;
                  return <button type="button" role="option" aria-selected={orderFilter === option.value} className={orderFilter === option.value ? "selected" : ""} key={option.value} onClick={() => { setOrderFilter(option.value); setOrderPage(1); setOpenOrderMenu(null); }}><span>{option.label}</span><em>{count}</em>{orderFilter === option.value ? <b>✓</b> : null}</button>;
                })}
              </div> : null}
            </div>
            <div className={`admin-select-control admin-period-control${openOrderMenu === "period" ? " open" : ""}${orderPeriod !== "all" ? " selected" : ""}`}>
              <button type="button" className="admin-select-trigger" aria-haspopup="listbox" aria-expanded={openOrderMenu === "period"} onClick={() => setOpenOrderMenu((current) => current === "period" ? null : "period")}><span>{selectedPeriod.label}</span></button>
              {openOrderMenu === "period" ? <div className="admin-select-options" role="listbox" aria-label="Период заказов">
                {periodOptions.map((option) => <button type="button" role="option" aria-selected={orderPeriod === option.value} className={orderPeriod === option.value ? "selected" : ""} key={option.value} onClick={() => { setOrderPeriod(option.value); setOrderPage(1); setOpenOrderMenu(null); }}><span>{option.label}</span>{orderPeriod === option.value ? <b>✓</b> : null}</button>)}
              </div> : null}
            </div>
          </div>
        </div>
        <div className="admin-orders">
          <div className="admin-table-head"><span>Заказ</span><span>Клиент</span><span>Адрес</span><span>Статус</span><span>Сумма</span><span>Время</span></div>
        {visibleOrders.map((order) => <button className={`admin-order-card${selectedOrder?.id === order.id ? " selected" : ""}`} key={order.id} onClick={() => setSelectedOrder(order)}>
          <span className="admin-order-number"><b>{formatOrderNumber(order)}</b><small>{order.phone}</small></span>
          <span className="admin-order-customer"><b>{order.customerName}</b><small>{order.phone}</small></span>
          <span className="admin-order-address">{order.deliveryType === "pickup" ? "Самовывоз" : order.address}</span>
          <span className={`admin-order-status status-${order.status}`}>{orderStatusLabels[order.status]}</span>
          <span className="admin-order-total">{order.total.toLocaleString("ru-RU")} сом</span>
          <span className="admin-order-time">{formatOrderDate(order.createdAt)}</span>
          <span className="admin-order-open">›</span>
        </button>)}
        {!ordersLoading && orders.length === 0 ? <div className="admin-empty"><b>Заказов пока нет</b><span>Новые заказы появятся здесь автоматически.</span></div> : null}
        {!ordersLoading && orders.length > 0 && visibleOrders.length === 0 ? <div className="admin-empty"><b>Ничего не найдено</b><span>Попробуйте изменить поиск или фильтр.</span></div> : null}
        <footer><span>Показано {(orderPage - 1) * ordersPerPage + visibleOrders.length} из {ordersTotal}</span>{Math.ceil(ordersTotal / ordersPerPage) > 1 ? <>
          <button type="button" disabled={orderPage === 1} onClick={() => setOrderPage((current) => current - 1)}>‹</button>
          {Array.from({ length: Math.ceil(ordersTotal / ordersPerPage) }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={page === orderPage ? "active" : ""} onClick={() => setOrderPage(page)}>{page}</button>)}
          <button type="button" disabled={orderPage === Math.ceil(ordersTotal / ordersPerPage)} onClick={() => setOrderPage((current) => current + 1)}>›</button>
        </> : null}</footer>
      </div></> : null}

      {tab === "products" ? <>
        <div className="admin-page-summary">
          <span>Всего блюд: <b>{products.length}</b></span><i />
          <span>Категорий: <b>{dashboard?.categories.length || 0}</b></span><i />
          <span>В продаже: <b>{products.filter((product) => product.available).length}</b></span>
          {dashboard?.menuRegionSlug !== region ? <><i /><span>Общее меню: <b>{availableRegions.find((item) => item.slug === dashboard?.menuRegionSlug)?.name || dashboard?.menuRegionSlug}</b></span></> : null}
        </div>
        <div className="admin-catalog-card">
          <div className="admin-catalog-toolbar">
            <label className="admin-search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по названию блюда" /></label>
            <div className="admin-menu-actions"><button type="button" className="admin-category-add" disabled={loading} aria-busy={eduPosAction === "import"} title="Получить цены и стоп-лист из EDU POS" onClick={() => void importEduPosMenu()}>{eduPosAction === "import" ? "Получаем…" : "↓ Из EDU POS"}</button><button type="button" className="admin-category-add" disabled={loading} aria-busy={eduPosAction === "export"} title="Отправить всё меню выбранного города в EDU POS" onClick={() => void exportEduPosMenu()}>{eduPosAction === "export" ? "Отправляем…" : "↑ В EDU POS"}</button><button type="button" className="admin-category-add" onClick={openCategoryManager}>＋ Категория</button><button className="admin-add" onClick={() => openProduct()}>＋ Добавить блюдо</button></div>
          </div>
          <div className="admin-menu-categories" aria-label="Категории меню">
            <button type="button" className={productCategoryFilter === "all" ? "active" : ""} onClick={() => setProductCategoryFilter("all")}>Все блюда <span>{products.length}</span></button>
            {(dashboard?.categories || []).map((category) => <button type="button" key={category.id} className={productCategoryFilter === String(category.id) ? "active" : ""} onClick={() => setProductCategoryFilter(String(category.id))}>{category.title} <span>{category.products.length}</span></button>)}
          </div>
          <div className="admin-products-table">
        <div className="admin-products-head"><span>Блюдо</span><span>Категория</span><span>Цена</span><span>Статус</span><span>Действия</span></div>
        {visibleProducts.map((product) => <article className="admin-product" key={product.id} role="button" tabIndex={0} onClick={() => openProduct(product)} onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          openProduct(product);
        }}>
          <img src={product.image} alt="" />
          <span><b>{product.name}</b><small>ID: {product.id}{product.posDishId ? ` · POS: ${product.posDishId}` : " · не сопоставлено с POS"}</small></span>
          <span className="admin-product-category">{product.categoryTitle}</span>
          <strong>{product.price} сом{product.oldPrice && product.oldPrice > product.price ? <small> {product.oldPrice} сом</small> : null}</strong>
          <i className={product.available && product.posAvailable ? "available" : ""}>{!product.available ? "Отключено" : product.posAvailable ? "В продаже" : "Стоп-лист POS"}</i>
          <div className="admin-product-actions" onClick={(event) => event.stopPropagation()}><button type="button" aria-label={`Действия: ${product.name}`} aria-expanded={openProductActions === product.id} onClick={() => setOpenProductActions((current) => current === product.id ? null : product.id)}>⋮</button>{openProductActions === product.id ? <div className="admin-product-action-menu"><button type="button" onClick={() => void updateProductAvailability(product)}>{product.available ? "Сделать неактивным" : "Сделать активным"}</button><button type="button" className="delete" onClick={() => void deleteProduct(product)}>Удалить</button></div> : null}</div>
        </article>)}
          {!visibleProducts.length && !loading ? <div className="admin-empty"><span>Блюда не найдены</span></div> : null}
          </div>
        </div>
      </> : null}

      {tab === "promotions" ? <>
        <div className="admin-page-summary"><span>Всего акций: <b>{dashboard?.promotions.length || 0}</b></span><i /><span>Активных: <b>{dashboard?.promotions.filter((item) => item.enabled).length || 0}</b></span>{dashboard?.promotionRegionSlug !== region ? <><i /><span>Общие акции: <b>{availableRegions.find((item) => item.slug === dashboard?.promotionRegionSlug)?.name || dashboard?.promotionRegionSlug}</b></span></> : null}</div>
        <div className="admin-catalog-card">
          <div className="admin-catalog-toolbar">
            <label className="admin-search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по акциям" /></label>
            <button className="admin-add" onClick={() => openPromotion()}>＋ Добавить акцию</button>
          </div>
          <div className="admin-grid admin-promotions">
            {visiblePromotions.map((promotion) => <button className="admin-promotion" key={promotion.id} onClick={() => openPromotion(promotion)}>
              <img src={promotion.image} alt="" />
              <span><b>{promotion.title}</b><small>{promotion.enabled ? "Показывается на сайте" : "Скрыта"}</small><strong>Изменить →</strong></span>
            </button>)}
            {!visiblePromotions.length && !loading ? <div className="admin-empty"><span>Акции не найдены</span></div> : null}
          </div>
        </div>
      </> : null}

      {tab === "categories" ? <>
        <div className="admin-page-summary"><span>Категорий: <b>{dashboard?.categories.length || 0}</b></span><i /><span>Блюд: <b>{products.length}</b></span></div>
        <div className="admin-catalog-card">
          <div className="admin-catalog-toolbar">
            <label className="admin-search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по категориям" /></label>
            <div className="admin-menu-actions"><button type="button" className="admin-category-add" onClick={() => switchTab("products")}>← К меню</button><button className="admin-add" onClick={() => openCategory()}>＋ Добавить категорию</button></div>
          </div>
          <div className="admin-categories">
            <div className="admin-categories-head"><span>Фото</span><span>Название</span><span>Блюд</span><span>Slug</span><span>Порядок</span><span>Видимость</span><span>Действия</span></div>
            {visibleCategories.map((category) => <button key={category.id} onClick={() => openCategory(category)}>
              <i>⁙</i><span className="admin-category-thumb">{category.image ? <img src={category.image} alt="" /> : "—"}</span><span><b>{category.title}</b></span><em>{category.products.length}</em><small>{category.slug}</small><em>{category.sortOrder}</em><strong>Видимая</strong><span className="admin-row-actions">Изменить →</span>
            </button>)}
          </div>
        </div>
      </> : null}

      {tab === "settings" ? <div className="admin-settings">
        <div className="admin-settings-toolbar"><span>Управляйте городами, графиком, доставкой и контактами</span><button className="admin-add" onClick={() => openRegion()}>＋ Добавить город</button></div>
        <section>
          <div className="admin-settings-title"><span><b>Города и контакты</b><small>Города, доступные на витрине, и данные для связи с клиентами.</small></span></div>
          <div className="admin-settings-list">
            {availableRegions.map((item) => <button key={item.id || item.slug} onClick={() => openRegion(item)}>
              <span className="admin-settings-city"><b>{item.name}</b><small>/{item.slug} · меню: {availableRegions.find((source) => source.slug === item.menuSourceRegionSlug)?.name || "своё"} · акции: {availableRegions.find((source) => source.slug === item.promotionSourceRegionSlug)?.name || "свои"}</small></span>
              <span><small>Телефон</small><b>{item.contactPhone || "Не указан"}</b></span>
              <span><small>Почта</small><b>{item.contactEmail || "Не указана"}</b></span>
              <span><small>Доставка</small><b>{item.deliveryOpenTime || "11:30"}–{item.deliveryCloseTime || "22:30"} · бесплатно от {formatSom(item.freeDeliveryThreshold ?? 4900)}</b></span>
              <i className={item.enabled ? "enabled" : ""}>{item.enabled ? "Активен" : "Скрыт"}</i>
              <strong>Изменить →</strong>
            </button>)}
          </div>
        </section>
        <section className="admin-settings-exit">
          <div><b>Сеанс администратора</b><small>Выход из панели на этом устройстве.</small></div>
          <button onClick={logout}>Выйти</button>
        </section>
      </div> : null}
      </section>
    </div>

    {editor ? <div className={`admin-editor-overlay admin-editor-page${editor.kind === "category" ? " admin-category-overlay" : ""}`} role="dialog" aria-modal="true" aria-label="Редактирование" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
      <form className={`admin-editor admin-editor-${editor.kind}`} onSubmit={saveEditor}>
        <div className="admin-editor-head">
          <span><b>{editor.id ? "Редактирование" : "Добавление"} {editor.kind === "product" ? "блюда" : editor.kind === "promotion" ? "акции" : "категории"}</b></span>
          <button type="button" onClick={() => setEditor(null)} aria-label="Закрыть">×</button>
        </div>

        {editor.kind === "product" ? <>
          <nav className="admin-editor-tabs" aria-label="Разделы блюда">
            <button type="button" className={editorSection === "main" ? "active" : ""} onClick={() => setEditorSection("main")}>Основное</button>
            <button type="button" className={editorSection === "modifiers" ? "active" : ""} onClick={() => setEditorSection("modifiers")}>Модификаторы</button>
            <button type="button" className={editorSection === "nutrition" ? "active" : ""} onClick={() => setEditorSection("nutrition")}>Пищевая ценность</button>
          </nav>
          <div className="admin-editor-body">
            {editorSection === "main" ? <div className="admin-product-editor-grid">
              <section className="admin-editor-section">
                <h3>Карточка блюда</h3>
                <label>Название<input required value={String(editor.values.name || "")} onChange={(event) => updateValue("name", event.target.value)} /></label>
                <p className="admin-slug-hint">Адрес страницы сформируется автоматически из названия.</p>
                <ImageField value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
              </section>
              <section className="admin-editor-section">
                <h3>Продажа и описание</h3>
                <div className="admin-two-fields">
                  <label>Категория<select value={String(editor.values.categoryId || "")} onChange={(event) => updateValue("categoryId", event.target.value)}>{dashboard?.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
                  <label>Цена, сом<input required type="number" min="0" value={String(editor.values.price)} onChange={(event) => updateValue("price", event.target.value)} /></label>
                  <label>Старая цена, сом<input type="number" min="0" value={String(editor.values.oldPrice || "")} onChange={(event) => updateValue("oldPrice", event.target.value)} placeholder="Без скидки" /></label>
                  <label>NAKTA Coin за 1 шт.<input type="number" min="0" step="1" value={String(editor.values.naktaCoins ?? "")} onChange={(event) => updateValue("naktaCoins", event.target.value)} /></label>
                </div>
                <label>Короткое описание<textarea value={String(editor.values.description || "")} onChange={(event) => updateValue("description", event.target.value)} /></label>
                <div className="admin-two-fields">
                  <label>EDU POS dishId<input value={String(editor.values.posDishId || "")} onChange={(event) => updateValue("posDishId", event.target.value)} placeholder="ID блюда из /menu" /></label>
                  <label>EDU POS variantId<input value={String(editor.values.posVariantId || "")} onChange={(event) => updateValue("posVariantId", event.target.value)} placeholder="Необязательно" /></label>
                </div>
                <div className="admin-editor-inline-row">
                  <label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label>
                  <label className="admin-switch"><span><b>В продаже</b><small>Можно заказать на сайте</small></span><input type="checkbox" checked={Boolean(editor.values.available)} onChange={(event) => updateValue("available", event.target.checked)} /></label>
                </div>
              </section>
            </div> : null}
            {editorSection === "modifiers" ? <section className="admin-editor-section admin-editor-section-wide">
              <div className="admin-editor-section-heading"><span><h3>Модификаторы блюда</h3><p>Добавки и варианты выбора, которые увидит клиент.</p></span></div>
              <ModifierGroupsEditor value={editor.values.modifierGroups as ModifierGroup[] || []} onChange={(value) => updateValue("modifierGroups", value)} />
            </section> : null}
            {editorSection === "nutrition" ? <section className="admin-editor-section admin-editor-section-wide">
              <div className="admin-editor-section-heading"><span><h3>Пищевая ценность</h3><p>Значения указываются для одной порции блюда.</p></span></div>
              <label>Состав<textarea className="admin-composition-field" value={String(editor.values.composition || "")} onChange={(event) => updateValue("composition", event.target.value)} /></label>
              <div className="admin-nutrition">
                {[["weight", "Граммы"], ["calories", "Ккал"], ["protein", "Белки"], ["fat", "Жиры"], ["carbs", "Углеводы"]].map(([name, label]) => <label key={name}>{label}<input type="number" min="0" value={String(editor.values[name])} onChange={(event) => updateValue(name, event.target.value)} /></label>)}
              </div>
            </section> : null}
          </div>
        </> : <div className="admin-editor-body admin-editor-simple-body">
          <label>Название<input required value={String(editor.values.title || "")} onChange={(event) => updateValue("title", event.target.value)} /></label>
          {editor.kind === "category" ? <p className="admin-slug-hint">Адрес страницы сформируется автоматически из названия.</p> : null}
          <ImageField value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
          {editor.kind === "promotion" ? <>
            <label>Ссылка кнопки<input type="url" required={Boolean(editor.values.cta)} value={String(editor.values.ctaUrl || "")} onChange={(event) => updateValue("ctaUrl", event.target.value)} placeholder="https://t.me/..." /></label>
            <div className="admin-two-fields"><label>Текст кнопки<input value={String(editor.values.cta || "")} onChange={(event) => updateValue("cta", event.target.value)} placeholder="Подробнее" /></label><label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label></div>
            <label className="admin-switch"><span><b>Показывать акцию</b><small>В ленте выбранного города</small></span><input type="checkbox" checked={Boolean(editor.values.enabled)} onChange={(event) => updateValue("enabled", event.target.checked)} /></label>
          </> : <label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label>}
        </div>}

        <div className="admin-editor-actions">
          {editor.id ? <button type="button" className="admin-delete" onClick={deleteEditor}>Удалить</button> : <span />}
          <div className="admin-editor-action-buttons">
            <button type="button" className="admin-cancel" onClick={() => setEditor(null)}>Отмена</button>
            <button type="submit" className="admin-save" disabled={loading}>{loading ? "Сохраняем…" : "Сохранить"}</button>
          </div>
        </div>
      </form>
    </div> : null}

    {regionEditor ? <div className="admin-editor-overlay admin-region-overlay" role="dialog" aria-modal="true" aria-label="Настройки города" onMouseDown={(event) => { if (event.target === event.currentTarget) setRegionEditor(null); }}>
      <form className="admin-region-editor" onSubmit={saveRegion}>
        <div className="admin-editor-head">
          <span><small>Настройки</small><b>{regionEditor.id ? "Редактирование города" : "Новый город"}</b></span>
          <button type="button" onClick={() => setRegionEditor(null)} aria-label="Закрыть">×</button>
        </div>
        <nav className="admin-editor-tabs admin-region-tabs" aria-label="Разделы города">
          <button type="button" className={regionEditorSection === "main" ? "active" : ""} onClick={() => setRegionEditorSection("main")}>Основное</button>
          <button type="button" className={regionEditorSection === "delivery" ? "active" : ""} onClick={() => setRegionEditorSection("delivery")}>Доставка</button>
          <button type="button" className={regionEditorSection === "pickup" ? "active" : ""} onClick={() => setRegionEditorSection("pickup")}>Самовывоз</button>
          <button type="button" className={regionEditorSection === "footer" ? "active" : ""} onClick={() => setRegionEditorSection("footer")}>Витрина</button>
        </nav>
        <div className="admin-region-editor-body">
        {regionEditorSection === "main" ? <div className="admin-region-panel admin-region-panel-main">
        <div className="admin-two-fields">
          <label>Название города<input required value={String(regionEditor.values.name)} onChange={(event) => updateRegionValue("name", event.target.value)} placeholder="Бишкек" /></label>
          <label>Адрес в ссылке<input required disabled={Boolean(regionEditor.id)} value={String(regionEditor.values.slug)} onChange={(event) => updateRegionValue("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="bishkek" /></label>
        </div>
        <div className="admin-two-fields">
          <label>Телефон<input value={String(regionEditor.values.contactPhone)} onChange={(event) => updateRegionValue("contactPhone", event.target.value)} placeholder="+996 555 123 456" /></label>
          <label>Электронная почта<input type="email" value={String(regionEditor.values.contactEmail)} onChange={(event) => updateRegionValue("contactEmail", event.target.value)} placeholder="hello@example.com" /></label>
        </div>
        <label>Адрес для страницы поддержки<input value={String(regionEditor.values.contactAddress)} onChange={(event) => updateRegionValue("contactAddress", event.target.value)} placeholder="Бишкек, улица …" /></label>
        <div className="admin-region-block">
          <b>Поддержка в приложении и на сайте</b><small>Ссылка открывается первой. Если её нет, кнопка поддержки позвонит на указанный номер.</small>
          <div className="admin-two-fields">
            <label>Номер поддержки<input value={String(regionEditor.values.supportPhone)} onChange={(event) => updateRegionValue("supportPhone", event.target.value)} placeholder="+996 555 123 456" /></label>
            <label>Ссылка на поддержку<input type="url" value={String(regionEditor.values.supportUrl)} onChange={(event) => updateRegionValue("supportUrl", event.target.value)} placeholder="https://t.me/your_support" /></label>
          </div>
        </div>
        <div className="admin-region-block">
          <b>Общее меню и акции</b><small>Можно использовать контент другого города. Доставка, кухни и заказы при этом останутся у текущего города.</small>
          <div className="admin-two-fields">
            <label>Источник меню<select value={String(regionEditor.values.menuSourceRegionSlug || "")} onChange={(event) => updateRegionValue("menuSourceRegionSlug", event.target.value)}><option value="">Собственное меню</option>{availableRegions.filter((item) => item.slug !== String(regionEditor.values.slug)).map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label>
            <label>Источник акций<select value={String(regionEditor.values.promotionSourceRegionSlug || "")} onChange={(event) => updateRegionValue("promotionSourceRegionSlug", event.target.value)}><option value="">Собственные акции</option>{availableRegions.filter((item) => item.slug !== String(regionEditor.values.slug)).map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label>
          </div>
        </div>
        </div> : null}
        {regionEditorSection === "delivery" ? <div className="admin-region-panel"><div className="admin-region-block">
          <b>Доставка</b><small>График действует по времени Бишкека. В нерабочие дни и после закрытия новые заказы не принимаются.</small>
          <label className="admin-switch"><span><b>Круглосуточно</b><small>Доставка доступна 24 часа в выбранные дни</small></span><input type="checkbox" checked={Boolean(regionEditor.values.deliveryIs24Hours)} onChange={(event) => updateRegionValue("deliveryIs24Hours", event.target.checked)} /></label>
          <div className="admin-working-days" role="group" aria-label="Рабочие дни доставки">
            <span>Рабочие дни</span>
            <div>{deliveryWeekdays.map((day) => {
              const days = Array.isArray(regionEditor.values.deliveryWorkingDays) ? regionEditor.values.deliveryWorkingDays : [];
              const selected = days.includes(day.value);
              return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => updateRegionValue("deliveryWorkingDays", selected ? days.filter((value) => value !== day.value) : [...days, day.value].sort((left, right) => left - right))} key={day.value}>{day.label}</button>;
            })}</div>
          </div>
          <div className="admin-two-fields">
            <label>Начало рабочего дня<input required={!Boolean(regionEditor.values.deliveryIs24Hours)} disabled={Boolean(regionEditor.values.deliveryIs24Hours)} type="time" value={String(regionEditor.values.deliveryOpenTime)} onChange={(event) => updateRegionValue("deliveryOpenTime", event.target.value)} /></label>
            <label>Конец рабочего дня<input required={!Boolean(regionEditor.values.deliveryIs24Hours)} disabled={Boolean(regionEditor.values.deliveryIs24Hours)} type="time" value={String(regionEditor.values.deliveryCloseTime)} onChange={(event) => updateRegionValue("deliveryCloseTime", event.target.value)} /></label>
          </div>
          <div className="admin-two-fields">
            <label>Примерное время, мин<input required type="number" min="1" max="600" value={String(regionEditor.values.estimatedDeliveryMinutes)} onChange={(event) => updateRegionValue("estimatedDeliveryMinutes", event.target.value)} /></label>
            <label>Стоимость доставки, сом<input required type="number" min="0" value={String(regionEditor.values.deliveryFee)} onChange={(event) => updateRegionValue("deliveryFee", event.target.value)} /></label>
          </div>
          <label>Бесплатная доставка от, сом<input required type="number" min="0" step="1" value={String(regionEditor.values.freeDeliveryThreshold)} onChange={(event) => updateRegionValue("freeDeliveryThreshold", event.target.value)} /></label>
          <div className="admin-two-fields">
            <label>Минимальный заказ, сом<input required type="number" min="0" value={String(regionEditor.values.minimumOrderAmount)} onChange={(event) => updateRegionValue("minimumOrderAmount", event.target.value)} /></label>
            <label>Максимальный заказ, сом<input required type="number" min="1" value={String(regionEditor.values.maximumOrderAmount)} onChange={(event) => updateRegionValue("maximumOrderAmount", event.target.value)} /></label>
          </div>
          <b>Зона доставки</b><small>Нарисуйте границу — сайт и приложение используют один и тот же полигон.</small>
          <DeliveryZoneEditor
            cityName={String(regionEditor.values.name || "Город")}
            points={deliveryZoneEditorPoints(String(regionEditor.values.deliveryZone || ""))}
            regionSlug={String(regionEditor.values.slug || "bishkek")}
            onChange={(points) => updateRegionValue("deliveryZone", formatDeliveryZone(points))}
          />
          <details className="admin-zone-coordinates">
            <summary>Координаты вручную</summary>
            <label><small>Одна точка «широта, долгота» в строке.</small><textarea required rows={6} value={String(regionEditor.values.deliveryZone)} onChange={(event) => updateRegionValue("deliveryZone", event.target.value)} placeholder={"42.90, 74.50\n42.90, 74.70\n42.80, 74.60"} /></label>
          </details>
        </div></div> : null}
        {regionEditorSection === "pickup" ? <div className="admin-region-panel"><div className="admin-region-block">
          <div className="admin-pickup-heading"><span><b>Кухни самовывоза</b><small>Список синхронно используется сайтом и приложением.</small></span><button type="button" onClick={addPickupLocation}>+ Добавить кухню</button></div>
          <div className="admin-pickup-list">
            {regionEditor.pickupLocations.length ? regionEditor.pickupLocations.map((location, index) => <section key={location.id ?? `new-${index}`}>
              <div className="admin-pickup-row-head"><b>Кухня {index + 1}</b><button type="button" onClick={() => removePickupLocation(index)}>Удалить</button></div>
              <div className="admin-two-fields">
                <label>Название<input value={location.title} onChange={(event) => updatePickupLocation(index, "title", event.target.value)} placeholder="Центральная кухня" /></label>
                <label>Порядок<input type="number" min="0" value={location.sortOrder} onChange={(event) => updatePickupLocation(index, "sortOrder", event.target.value)} /></label>
              </div>
              <label>Адрес<input required value={location.address} onChange={(event) => updatePickupLocation(index, "address", event.target.value)} placeholder="Бишкек, проспект Чуй, 155" /></label>
              <div className="admin-pickup-map-link">
                <label>Ссылка на Яндекс Карты<input type="url" value={location.yandexUrl} onBlur={() => void fillPickupCoordinates(index)} onChange={(event) => updatePickupLocation(index, "yandexUrl", event.target.value)} placeholder="https://yandex.ru/maps/-/..." /></label>
                <button type="button" disabled={!location.yandexUrl.trim() || pickupResolvingIndex !== null} onClick={() => void fillPickupCoordinates(index)}>{pickupResolvingIndex === index ? "Определяем…" : "Определить точку"}</button>
              </div>
              <small className="admin-pickup-coordinate-status">{location.latitude && location.longitude ? `Координаты: ${location.latitude}, ${location.longitude}` : "Координаты автоматически заполнятся по ссылке"}</small>
              <details className="admin-zone-coordinates">
                <summary>Координаты вручную</summary>
                <div className="admin-two-fields">
                  <label>Широта<input type="number" step="any" min="-90" max="90" value={location.latitude} onChange={(event) => updatePickupLocation(index, "latitude", event.target.value)} placeholder="42.8746" /></label>
                  <label>Долгота<input type="number" step="any" min="-180" max="180" value={location.longitude} onChange={(event) => updatePickupLocation(index, "longitude", event.target.value)} placeholder="74.5698" /></label>
                </div>
              </details>
              <small className="admin-pickup-coordinate-status">Для кухни используется глобальный график города, указанный выше.</small>
              <label className="admin-switch"><span><b>Доступна для заказа</b><small>Показывается клиентам</small></span><input type="checkbox" checked={location.enabled} onChange={(event) => updatePickupLocation(index, "enabled", event.target.checked)} /></label>
            </section>) : <p className="admin-pickup-empty">Добавьте хотя бы одну кухню, чтобы включить самовывоз.</p>}
          </div>
        </div></div> : null}
        {regionEditorSection === "footer" ? <div className="admin-region-panel"><div className="admin-region-block">
          <b>Футер сайта</b><small>Контакты внизу витрины для выбранного города.</small>
          <label>Название компании<input value={String(regionEditor.values.footerCompanyName)} onChange={(event) => updateRegionValue("footerCompanyName", event.target.value)} placeholder="Накта суши" /></label>
          <label>Юридическая информация<textarea value={String(regionEditor.values.footerLegalInfo)} onChange={(event) => updateRegionValue("footerLegalInfo", event.target.value)} placeholder="Реквизиты, адрес и условия обслуживания" /></label>
        </div>
        <div className="admin-two-fields">
          <label>Порядок<input type="number" min="0" value={String(regionEditor.values.sortOrder)} onChange={(event) => updateRegionValue("sortOrder", event.target.value)} /></label>
          <label className="admin-switch"><span><b>Город активен</b><small>Показывается на витрине</small></span><input type="checkbox" checked={Boolean(regionEditor.values.enabled)} onChange={(event) => updateRegionValue("enabled", event.target.checked)} /></label>
        </div>
        </div> : null}
        </div>
        <div className="admin-editor-actions"><span /><div className="admin-editor-action-buttons"><button type="button" className="admin-cancel" onClick={() => setRegionEditor(null)}>Отмена</button><button type="submit" className="admin-save" disabled={loading}>{loading ? "Сохраняем…" : "Сохранить"}</button></div></div>
      </form>
    </div> : null}

    {selectedOrder ? <div className="admin-editor-overlay admin-order-overlay" role="dialog" aria-modal="true" aria-label={`Заказ ${formatOrderNumber(selectedOrder)}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null); }}>
      <section className="admin-order-detail">
        <header className="admin-order-detail-head">
          <div className="admin-order-head-identity">
            <span className="admin-order-head-icon"><Icon path={mdiReceiptTextOutline} size={1.05} aria-hidden="true" /></span>
            <span className="admin-order-head-copy"><span><b>Заказ {formatOrderNumber(selectedOrder)}</b><i className={`admin-order-status status-${selectedOrder.status}`}>{orderStatusLabels[selectedOrder.status]}</i></span><small>{formatOrderDate(selectedOrder.createdAt)}</small></span>
          </div>
          <div className="admin-order-head-total"><small>Итого</small><strong>{formatSom(selectedOrder.total)}</strong></div>
          <button type="button" onClick={() => setSelectedOrder(null)} aria-label="Закрыть">×</button>
        </header>

        <div className="admin-order-detail-body">
          <section className="admin-order-info-pane">
            <div className="admin-order-person-row">
              <span className="admin-order-detail-icon"><Icon path={mdiAccountOutline} size={1} aria-hidden="true" /></span>
              <span><small>Клиент</small><b>{selectedOrder.customerName}</b></span>
              <a className="admin-order-phone" href={`tel:${selectedOrder.phone}`}><span><small>Телефон</small><b>{selectedOrder.phone}</b></span><i><Icon path={mdiPhoneOutline} size={0.82} aria-hidden="true" /></i></a>
            </div>
            <div className="admin-order-address-row">
              <span className="admin-order-detail-icon"><Icon path={mdiMapMarkerOutline} size={1} aria-hidden="true" /></span>
              <span><small>{selectedOrder.deliveryType === "pickup" ? "Самовывоз" : "Адрес доставки"}</small><b>{selectedOrder.address}</b></span>
              {typeof selectedOrder.latitude === "number" && typeof selectedOrder.longitude === "number" ? <a href={`https://yandex.ru/maps/?pt=${selectedOrder.longitude},${selectedOrder.latitude}&z=17&l=map`} target="_blank" rel="noreferrer">Открыть на карте <Icon path={mdiOpenInNew} size={0.65} aria-hidden="true" /></a> : null}
            </div>
            {selectedOrder.deliveryType === "delivery" && (selectedOrder.apartment || selectedOrder.entrance || selectedOrder.floor || selectedOrder.intercom) ? <div className="admin-order-address-details">
              <span className="admin-order-detail-icon"><Icon path={mdiOfficeBuildingOutline} size={1} aria-hidden="true" /></span>
              <span><small>Детали адреса</small><b>{[
                selectedOrder.apartment && `кв. ${selectedOrder.apartment}`,
                selectedOrder.entrance && `подъезд ${selectedOrder.entrance}`,
                selectedOrder.floor && `этаж ${selectedOrder.floor}`,
                selectedOrder.intercom && `домофон ${selectedOrder.intercom}`,
              ].filter(Boolean).join(" · ")}</b></span>
            </div> : null}

            <div className="admin-order-notes">
              <span><i><Icon path={mdiCreditCardOutline} size={0.9} aria-hidden="true" /></i><span><small>Оплата</small><b>{selectedOrder.paymentMethod === "card" ? "Картой при получении" : selectedOrder.paymentMethod === "online" ? "Онлайн" : "Наличными"}</b></span></span>
              <span><i><Icon path={mdiSilverwareForkKnife} size={0.9} aria-hidden="true" /></i><span><small>Приборы</small><b>{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} компл.`}</b></span></span>
            </div>
            <div className="admin-order-comment"><span className="admin-order-detail-icon"><Icon path={mdiMessageOutline} size={0.95} aria-hidden="true" /></span><span><small>Комментарий</small><b>{selectedOrder.comment || "Без комментария"}</b></span></div>
            {selectedOrder.posSyncStatus ? <div className="admin-order-pos-state"><small>EDU POS</small><b>{selectedOrder.posSyncStatus === "pos_sync_failed" ? `Ошибка синхронизации${selectedOrder.posLastError ? `: ${selectedOrder.posLastError}` : ""}` : selectedOrder.posSyncStatus === "submitting" ? "Отправляется на кухню…" : selectedOrder.posStatus ? `${selectedOrder.posOrderNumber ? `№${selectedOrder.posOrderNumber} · ` : ""}${posStatusLabels[selectedOrder.posStatus] || selectedOrder.posStatus} · готово ${selectedOrder.posItemsReady || 0} из ${selectedOrder.posItemsTotal || 0}${selectedOrder.posItemsRejected ? ` · отклонено ${selectedOrder.posItemsRejected}` : ""}` : selectedOrder.status === "new" ? "Отправится после подтверждения" : "Ожидает отправки"}</b></div> : null}
          </section>

          <section className="admin-order-items-pane">
            <h3>Состав заказа</h3>
            <div className="admin-order-lines">
              {selectedOrder.items.map((item) => <article key={item.id}>
                <span className="admin-order-qty">{item.quantity}×</span>
                <span><b>{item.productName}</b>{item.modifierSnapshots.map((modifier) => {
                  const contribution = modifier.totalPrice
                    * (modifier.priceScope === "per-product" ? item.quantity : 1);
                  const scopeLabel = modifier.priceScope === "per-line"
                    ? "за строку"
                    : `за ${item.quantity} шт.`;
                  return <small key={`${modifier.groupId}:${modifier.itemId}`}>
                    {modifier.groupTitle}: {modifier.itemName}
                    {modifier.quantity > 1 ? ` ×${modifier.quantity}` : ""}
                    {contribution ? ` (+${contribution} сом ${scopeLabel})` : ""}
                  </small>;
                })}{item.posStatus ? <small>{item.posStatus === "rejected" ? `EDU POS: отклонено${item.posRejectReason ? ` — ${item.posRejectReason}` : ""}` : item.posStatus === "ready" ? "EDU POS: готово" : `EDU POS: ${item.posStatus}`}</small> : null}</span>
                <strong>{formatSom(item.lineTotal)}</strong>
              </article>)}
            </div>
            <div className="admin-order-summary"><span>Итого / К оплате</span><strong>{formatSom(selectedOrder.total)}</strong></div>
          </section>
        </div>

        {orderStatusTransitions[selectedOrder.status].length ? <div className="admin-order-actions">
          {orderStatusTransitions[selectedOrder.status].map((status) => <button
            type="button"
            className={status === "cancelled" ? "cancel" : ""}
            disabled={ordersLoading}
            key={status}
            onClick={() => void updateOrderStatus(selectedOrder, status)}
          >{status === "cancelled" ? "Отменить заказ" : selectedOrder.status === "new" && status === "confirmed" ? "→ Подтвердить заказ" : `→ ${orderStatusLabels[status]}`}</button>)}
        </div> : null}
      </section>
    </div> : null}
  </div>;
}

function ModifierGroupsEditor({ value, onChange }: { value: ModifierGroup[]; onChange: (groups: ModifierGroup[]) => void }) {
  const updateGroup = (index: number, patch: Partial<ModifierGroup>) =>
    onChange(value.map((group, groupIndex) => groupIndex === index ? { ...group, ...patch } : group));
  const removeGroup = (index: number) => onChange(value.filter((_, groupIndex) => groupIndex !== index));
  const addGroup = () => onChange([...value, {
    id: `group-${Date.now()}`,
    title: "Новая группа",
    selectionType: "single",
    presentation: "rows",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    priceScope: "per-line",
    items: [],
  }]);
  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<ModifierItem>) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, currentIndex) => currentIndex === itemIndex ? { ...item, ...patch } : item),
    });
  };
  const addItem = (groupIndex: number) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, {
      items: [...group.items, {
        id: `option-${Date.now()}`,
        name: "Новый вариант",
        price: 0,
        image: "",
        enabled: true,
        maxQuantity: group.selectionType === "single" ? 1 : 20,
      }],
    });
  };
  const removeItem = (groupIndex: number, itemIndex: number) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, { items: group.items.filter((_, currentIndex) => currentIndex !== itemIndex) });
  };

  return <section className="admin-modifiers">
    <div className="admin-modifiers-head">
      <span><b>Группы выбора и добавки</b><small>Название и назначение могут быть любыми</small></span>
      <button type="button" onClick={addGroup}>+ Группа</button>
    </div>
    {value.map((group, groupIndex) => <article className="admin-modifier-group" key={group.id}>
      <div className="admin-modifier-title">
        <input aria-label="Название группы" value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} />
        <button type="button" onClick={() => removeGroup(groupIndex)} aria-label={`Удалить группу ${group.title}`}>×</button>
      </div>
      <div className="admin-modifier-rules">
        <label>Режим<select value={group.selectionType} onChange={(event) => {
          const selectionType = event.target.value as ModifierGroup["selectionType"];
          updateGroup(groupIndex, {
            selectionType,
            minSelections: selectionType === "single"
              ? Math.min(1, group.minSelections ?? (group.required ? 1 : 0))
              : group.minSelections,
            maxSelections: selectionType === "single" ? 1 : Math.max(1, group.maxSelections || 1),
            items: selectionType === "single"
              ? group.items.map((item) => ({ ...item, maxQuantity: 1 }))
              : group.items,
          });
        }}><option value="single">Один вариант</option><option value="multiple">Несколько вариантов</option></select></label>
        <label>Вид<select value={group.presentation || "rows"} onChange={(event) => updateGroup(groupIndex, { presentation: event.target.value as NonNullable<ModifierGroup["presentation"]> })}><option value="rows">Строки</option><option value="cards">Карточки</option></select></label>
        <label>Минимум<input type="number" min="0" max={group.selectionType === "single" ? 1 : 99} value={group.minSelections ?? (group.required ? 1 : 0)} onChange={(event) => {
          const minSelections = Number(event.target.value);
          updateGroup(groupIndex, { minSelections, required: minSelections > 0 });
        }} /></label>
        <label>Максимум<input type="number" min="0" max="99" disabled={group.selectionType === "single"} value={group.selectionType === "single" ? 1 : group.maxSelections ?? group.items.length} onChange={(event) => updateGroup(groupIndex, { maxSelections: Number(event.target.value) })} /></label>
        <label>Цена применяется<select value={group.priceScope || "per-product"} onChange={(event) => updateGroup(groupIndex, { priceScope: event.target.value as NonNullable<ModifierGroup["priceScope"]> })}><option value="per-product">К каждой порции</option><option value="per-line">Один раз в строке</option></select></label>
        <label className="admin-required"><span>Обязательно</span><input type="checkbox" checked={group.required} onChange={(event) => {
          const required = event.target.checked;
          updateGroup(groupIndex, {
            required,
            minSelections: required ? Math.max(1, group.minSelections || 0) : 0,
          });
        }} /></label>
      </div>
      <div className="admin-modifier-items">
        {group.items.map((item, itemIndex) => <div className="admin-modifier-item" key={item.id}>
          {item.image ? <img src={item.image} alt="" /> : <span className="admin-modifier-placeholder">Фото</span>}
          <div>
            <input aria-label="Название варианта" value={item.name} onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })} />
            <input aria-label="Ссылка на фото варианта" value={item.image} onChange={(event) => updateItem(groupIndex, itemIndex, { image: event.target.value })} placeholder="Ссылка на фото" />
          </div>
          <label>Цена<input type="number" min="0" value={item.price} onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })} /></label>
          <label>Макс. шт.<input type="number" min="1" max="99" disabled={group.selectionType === "single"} value={item.maxQuantity ?? (group.selectionType === "single" ? 1 : 20)} onChange={(event) => updateItem(groupIndex, itemIndex, { maxQuantity: Number(event.target.value) })} /></label>
          <label className="admin-modifier-enabled"><span>Доступен</span><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateItem(groupIndex, itemIndex, { enabled: event.target.checked })} /></label>
          <button type="button" onClick={() => removeItem(groupIndex, itemIndex)} aria-label={`Удалить ${item.name}`}>×</button>
        </div>)}
      </div>
      <button className="admin-add-option" type="button" onClick={() => addItem(groupIndex)}>+ Добавить вариант</button>
    </article>)}
  </section>;
}

function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [processing, setProcessing] = useState(false);
  const selectFile = async (file?: File) => {
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await fileToOptimizedDataUrl(file));
    } finally {
      setProcessing(false);
    }
  };
  return <label className="admin-image-field">
    Фото
    {value ? <img src={value} alt="Предпросмотр" /> : null}
    <input required={!value} value={value.startsWith("data:") ? "" : value} onChange={(event) => onChange(event.target.value)} placeholder="Ссылка на изображение" />
    <span className="admin-upload">📷 {processing ? "Обрабатываем…" : "Выбрать фото с телефона"}<input type="file" accept="image/*" onChange={(event) => void selectFile(event.target.files?.[0])} /></span>
  </label>;
}
