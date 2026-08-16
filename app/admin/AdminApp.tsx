"use client";
/* eslint-disable @next/next/no-img-element */

import { Icon } from "@mdi/react";
import {
  mdiAccountOutline,
  mdiBellOutline,
  mdiCheckCircleOutline,
  mdiCreditCardOutline,
  mdiMapMarkerOutline,
  mdiMessageOutline,
  mdiOfficeBuildingOutline,
  mdiOpenInNew,
  mdiPhoneOutline,
  mdiReceiptTextOutline,
  mdiShapeOutline,
  mdiSilverwareForkKnife,
  mdiTagOutline,
  mdiTrendingUp,
  mdiEyeOffOutline,
} from "@mdi/js";
import { FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { DeliveryZoneEditor, type DeliveryZonePoint } from "./DeliveryZoneEditor";
import { type StatisticsData, type StatisticsPeriod } from "./StatisticsDashboard";
import { AdminNavigation, type AdminTab } from "./AdminNavigation";
import { AdminOverview } from "./AdminOverview";
import OrdersWorkspace, { type OrdersWorkspaceView } from "./OrdersWorkspace";
import { CustomersView, type AdminCustomer } from "./CustomersView";
import {
  LoyaltyCenter,
  type LoyaltyOverview,
  type LoyaltyProgramDraft,
  type NftStatus,
  type NftUpdatePayload,
  type NftWithdrawal,
} from "./LoyaltyCenter";
import { IntegrationsView, type EduPosStatus } from "./IntegrationsView";

type PickupLocation = { id: number; title: string; address: string; workingHours: string; latitude: number | null; longitude: number | null; yandexUrl: string; enabled: boolean; sortOrder: number };
type Region = { id: number; slug: string; name: string; enabled: boolean; sortOrder: number; menuSourceRegionSlug: string | null; promotionSourceRegionSlug: string | null; contactPhone: string; contactEmail: string; contactAddress: string; supportPhone: string; supportUrl: string; pickupAddress: string; pickupYandexUrl: string; pickupWorkingHours: string; pickupLocations?: PickupLocation[]; deliveryOpenTime: string; deliveryCloseTime: string; deliveryIs24Hours: boolean; deliveryWorkingDays: number[]; freeDeliveryThreshold: number; deliveryFee: number; estimatedDeliveryMinutes: number; minimumOrderAmount: number; maximumOrderAmount: number; deliveryZone: DeliveryZonePoint[]; footerCompanyName: string; footerLegalInfo: string; nftRewardEveryOrders: number; nftRewardName: string; nftRewardImage: string; nftRewardDescription: string; nftRewardNetwork: string; nftContractAddress: string; nftMetadataUri: string };
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
type AdminOrderKitItem = {
  id: string;
  name: string;
  quantity: number;
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
  kitItems?: AdminOrderKitItem[];
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
type OrderKitDraft = {
  utensilsCount: number;
  noUtensils: boolean;
  kitItems: AdminOrderKitItem[];
};
type OrdersResponse = { items: AdminOrder[]; total: number; limit: number; offset: number; statusCounts: Partial<Record<OrderStatus, number>> };
type OrderPeriod = "all" | "today" | "week" | "month";
type Tab = AdminTab;
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
type Confirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  action: () => void | Promise<void>;
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
  { id: 0, slug: "bishkek", name: "Бишкек", enabled: true, sortOrder: 0, menuSourceRegionSlug: null, promotionSourceRegionSlug: null, contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones.bishkek, footerCompanyName: "", footerLegalInfo: "", nftRewardEveryOrders: 10, nftRewardName: "NFT NAKTA", nftRewardImage: "", nftRewardDescription: "", nftRewardNetwork: "polygon", nftContractAddress: "", nftMetadataUri: "" },
  { id: 1, slug: "osh", name: "Ош", enabled: true, sortOrder: 1, menuSourceRegionSlug: null, promotionSourceRegionSlug: null, contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones.osh, footerCompanyName: "", footerLegalInfo: "", nftRewardEveryOrders: 10, nftRewardName: "NFT NAKTA", nftRewardImage: "", nftRewardDescription: "", nftRewardNetwork: "polygon", nftContractAddress: "", nftMetadataUri: "" },
  { id: 2, slug: "otuz-adyr", name: "Отуз-Адыр", enabled: true, sortOrder: 2, menuSourceRegionSlug: "osh", promotionSourceRegionSlug: "osh", contactPhone: "", contactEmail: "", contactAddress: "", supportPhone: "", supportUrl: "", pickupAddress: "", pickupYandexUrl: "", pickupWorkingHours: "", pickupLocations: [], deliveryOpenTime: "11:30", deliveryCloseTime: "22:30", deliveryIs24Hours: false, deliveryWorkingDays: [0, 1, 2, 3, 4, 5, 6], freeDeliveryThreshold: 4900, deliveryFee: 99, estimatedDeliveryMinutes: 50, minimumOrderAmount: 900, maximumOrderAmount: 30000, deliveryZone: defaultDeliveryZones["otuz-adyr"], footerCompanyName: "", footerLegalInfo: "", nftRewardEveryOrders: 10, nftRewardName: "NFT NAKTA", nftRewardImage: "", nftRewardDescription: "", nftRewardNetwork: "polygon", nftContractAddress: "", nftMetadataUri: "" },
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
const formatPosOrderNumber = (value: string) => `№${value.replace(/^[№#\s]+/, "")}`;
const defaultAdminOrderKitItems: AdminOrderKitItem[] = [
  { id: "soy-sauce", name: "Соевый соус", quantity: 1 },
  { id: "wasabi", name: "Васаби", quantity: 1 },
  { id: "pickled-ginger", name: "Имбирь маринованный", quantity: 1 },
];
const orderKitItemsForDisplay = (order: Pick<AdminOrder, "kitItems">) => (
  order.kitItems?.length ? order.kitItems : defaultAdminOrderKitItems
);
const formatSom = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} сом`;
const ordersPerPage = 50;
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
    modifierGroups: [{
      id: "group-1",
      title: "Новая группа",
      selectionType: "single",
      presentation: "rows",
      required: false,
      minSelections: 0,
      maxSelections: 1,
      priceScope: "per-line",
      items: [
        { id: "option-none", name: "Без добавок", price: 0, image: "", enabled: true, maxQuantity: 1 },
        { id: "option-cheese", name: "Дополнительный сыр", price: 30, image: "", enabled: true, maxQuantity: 1 },
      ],
    }],
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
  const [authorizing, setAuthorizing] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [region, setRegion] = useState("bishkek");
  const [availableRegions, setAvailableRegions] = useState<Region[]>(defaultRegions);
  const [tab, setTab] = useState<Tab>("orders");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderKitDraft, setOrderKitDraft] = useState<OrderKitDraft | null>(null);
  const [orderKitSaving, setOrderKitSaving] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorSection, setEditorSection] = useState<"main" | "modifiers" | "nutrition">("main");
  const [loading, setLoading] = useState(false);
  const [eduPosAction, setEduPosAction] = useState<"import" | "export" | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<"all" | string>("all");
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [promotionStatus, setPromotionStatus] = useState<"all" | "active" | "hidden">("all");
  const [statistics, setStatistics] = useState<StatisticsData>({
    orders: 0,
    revenue: 0,
    average: 0,
    products: [],
    payments: [],
    peaks: [],
    statuses: [],
    chart: [],
  });
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>("week");
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [openProductActions, setOpenProductActions] = useState<number | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [orderPeriod, setOrderPeriod] = useState<OrderPeriod>("all");
  const [orderView, setOrderView] = useState<OrdersWorkspaceView>("kanban");
  const [orderPage, setOrderPage] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Partial<Record<OrderStatus, number>>>({});
  const [regionEditor, setRegionEditor] = useState<RegionEditor | null>(null);
  const [regionEditorSection, setRegionEditorSection] = useState<"main" | "delivery" | "pickup" | "footer">("main");
  const [deletedPickupLocationIds, setDeletedPickupLocationIds] = useState<number[]>([]);
  const [pickupResolvingIndex, setPickupResolvingIndex] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const [loyaltyOverview, setLoyaltyOverview] = useState<LoyaltyOverview | null>(null);
  const [loyaltyOverviewRegion, setLoyaltyOverviewRegion] = useState("");
  const [loyaltyDraft, setLoyaltyDraft] = useState<LoyaltyProgramDraft>({ enabled: true, everyOrders: "10", name: "NFT NAKTA", image: "", description: "", network: "polygon", contractAddress: "", metadataUri: "" });
  const [nftWithdrawals, setNftWithdrawals] = useState<NftWithdrawal[]>([]);
  const [nftFilter, setNftFilter] = useState<"all" | NftStatus>("all");
  const [loyaltyOverviewLoading, setLoyaltyOverviewLoading] = useState(false);
  const [nftWithdrawalsLoading, setNftWithdrawalsLoading] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [nftUpdatingId, setNftUpdatingId] = useState<string | null>(null);
  const [eduPosStatus, setEduPosStatus] = useState<EduPosStatus | null>(null);
  const [eduPosStatusLoading, setEduPosStatusLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const [editorBaseline, setEditorBaseline] = useState("");
  const [regionEditorBaseline, setRegionEditorBaseline] = useState("");
  const ordersRequestId = useRef(0);
  const customersRequestId = useRef(0);
  const loyaltyOverviewRequestId = useRef(0);
  const nftWithdrawalsRequestId = useRef(0);
  const deferredSearch = useDeferredValue(search);
  const selectedRegion = availableRegions.find((item) => item.slug === region) ?? availableRegions[0];
  const activeLoyaltyOverview = loyaltyOverviewRegion === region ? loyaltyOverview : null;
  const editorDirty = Boolean(editor && editorBaseline && JSON.stringify(editor) !== editorBaseline);
  const regionEditorDirty = Boolean(regionEditor && regionEditorBaseline && (
    JSON.stringify(regionEditor) !== regionEditorBaseline || deletedPickupLocationIds.length
  ));
  const loyaltyDirty = Boolean(activeLoyaltyOverview && (
    loyaltyDraft.enabled !== activeLoyaltyOverview.program.enabled
    || (loyaltyDraft.enabled ? Number(loyaltyDraft.everyOrders) : 0) !== activeLoyaltyOverview.program.everyOrders
    || loyaltyDraft.name !== activeLoyaltyOverview.program.name
    || loyaltyDraft.image !== activeLoyaltyOverview.program.image
    || loyaltyDraft.description !== activeLoyaltyOverview.program.description
    || loyaltyDraft.network !== activeLoyaltyOverview.program.network
    || loyaltyDraft.contractAddress !== activeLoyaltyOverview.program.contractAddress
    || loyaltyDraft.metadataUri !== activeLoyaltyOverview.program.metadataUri
  ));

  const presentEditor = (next: Editor) => {
    setEditorBaseline(JSON.stringify(next));
    setEditor(next);
  };
  const dismissEditor = () => {
    setEditor(null);
    setEditorBaseline("");
  };
  const presentRegionEditor = (next: RegionEditor) => {
    setRegionEditorBaseline(JSON.stringify(next));
    setRegionEditor(next);
  };
  const dismissRegionEditor = () => {
    setRegionEditor(null);
    setRegionEditorBaseline("");
  };

  const runConfirmation = async () => {
    if (!confirmation || confirmationBusy) return;
    setConfirmationBusy(true);
    try {
      await confirmation.action();
      setConfirmation(null);
    } finally {
      setConfirmationBusy(false);
    }
  };

  const closeEditor = () => {
    if (!editorDirty) {
      dismissEditor();
      return;
    }
    setConfirmation({
      title: "Закрыть без сохранения?",
      description: "Изменения в карточке ещё не сохранены и будут потеряны.",
      confirmLabel: "Закрыть",
      tone: "danger",
      action: dismissEditor,
    });
  };

  const closeRegionEditor = () => {
    if (!regionEditorDirty) {
      dismissRegionEditor();
      return;
    }
    setConfirmation({
      title: "Закрыть настройки филиала?",
      description: "Несохранённые изменения и удаление кухонь будут отменены.",
      confirmLabel: "Закрыть",
      tone: "danger",
      action: dismissRegionEditor,
    });
  };

  const selectRegion = (slug: string) => {
    if (slug === region) return;
    const applyRegion = () => {
      loyaltyOverviewRequestId.current += 1;
      nftWithdrawalsRequestId.current += 1;
      setRegion(slug);
      setOrderPage(1);
      setCustomerPage(1);
      setLoyaltyOverview(null);
      setLoyaltyOverviewRegion("");
      setNftWithdrawals([]);
      setLoyaltyOverviewLoading(false);
      setNftWithdrawalsLoading(false);
      dismissEditor();
    };
    if (loyaltyDirty) {
      setConfirmation({
        title: "Сменить филиал без сохранения?",
        description: "Изменения NFT-программы текущего филиала будут потеряны.",
        confirmLabel: "Сменить филиал",
        tone: "danger",
        action: applyRegion,
      });
      return;
    }
    applyRegion();
  };

  useEffect(() => {
    if (!editorDirty && !regionEditorDirty && !loyaltyDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [editorDirty, loyaltyDirty, regionEditorDirty]);

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
    if (response.status === 401) {
      sessionStorage.removeItem("losos-admin-token");
      setToken("");
      throw new Error("Сеанс завершён. Введите код администратора ещё раз");
    }
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
      setRegion((current) => nextRegions.some((item) => item.slug === current)
        ? current
        : nextRegions[0].slug);
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
    const requestId = ++ordersRequestId.current;
    if (!silent) setOrdersLoading(true);
    try {
      const baseQuery = new URLSearchParams({ regionSlug: region });
      if (deferredSearch.trim()) baseQuery.set("search", deferredSearch.trim());
      if (orderPeriod !== "all") {
        const now = new Date();
        const from = new Date(now);
        from.setHours(0, 0, 0, 0);
        if (orderPeriod === "week") from.setDate(from.getDate() - 6);
        if (orderPeriod === "month") from.setDate(1);
        baseQuery.set("from", from.toISOString());
        baseQuery.set("to", now.toISOString());
      }
      let nextOrders: AdminOrder[];
      let nextTotal: number;
      let nextStatusCounts: Partial<Record<OrderStatus, number>>;
      if (orderView === "kanban") {
        const workflowStatuses: OrderStatus[] = orderFilter === "all"
          ? ["new", "confirmed", "preparing", "ready", "delivering"]
          : [orderFilter];
        const results = await Promise.all(workflowStatuses.map(async (status) => {
          const query = new URLSearchParams(baseQuery);
          query.set("status", status);
          query.set("limit", "100");
          query.set("offset", "0");
          return request(`/admin/orders?${query}`) as Promise<OrdersResponse>;
        }));
        nextOrders = results.flatMap((result) => result.items);
        nextTotal = results.reduce((sum, result) => sum + result.total, 0);
        nextStatusCounts = results[0]?.statusCounts || {};
      } else {
        const query = new URLSearchParams(baseQuery);
        query.set("limit", String(ordersPerPage));
        query.set("offset", String((orderPage - 1) * ordersPerPage));
        if (orderFilter !== "all") query.set("status", orderFilter);
        const result = await request(`/admin/orders?${query}`) as OrdersResponse;
        nextOrders = result.items;
        nextTotal = result.total;
        nextStatusCounts = result.statusCounts || {};
      }
      if (requestId !== ordersRequestId.current) return;
      setOrders(nextOrders);
      setOrdersTotal(nextTotal);
      setStatusCounts(nextStatusCounts);
      setSelectedOrder((current) => current
        ? nextOrders.find((order) => order.id === current.id) || current
        : null);
    } catch (error) {
      if (!silent && requestId === ordersRequestId.current) setMessage(error instanceof Error ? error.message : "Не удалось загрузить заказы");
    } finally {
      if (!silent && requestId === ordersRequestId.current) setOrdersLoading(false);
    }
  }, [deferredSearch, orderFilter, orderPage, orderPeriod, orderView, region, request, token]);

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
      const query = new URLSearchParams({ region, period: statisticsPeriod });
      setStatistics(await request(`/admin/analytics?${query}`) as StatisticsData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить статистику");
    } finally {
      setStatisticsLoading(false);
    }
  }, [region, request, statisticsPeriod, token]);

  useEffect(() => {
    if (tab !== "statistics" || !token) return;
    const timer = window.setTimeout(() => void loadStatistics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStatistics, tab, token]);

  const loadCustomers = useCallback(async () => {
    if (!token) return;
    const requestId = ++customersRequestId.current;
    setCustomersLoading(true);
    try {
      const query = new URLSearchParams({
        region,
        search: deferredCustomerSearch.trim(),
        limit: "50",
        offset: String((customerPage - 1) * 50),
      });
      const result = await request(`/admin/customers?${query}`) as {
        items: AdminCustomer[];
        total: number;
      };
      if (requestId !== customersRequestId.current) return;
      setCustomers(result.items.map((customer) => ({
        ...customer,
        ordersCount: Number(customer.ordersCount),
        completedOrders: Number(customer.completedOrders),
        revenue: Number(customer.revenue),
        naktaCoins: Number(customer.naktaCoins),
        nftCount: Number(customer.nftCount),
        pendingNftCount: Number(customer.pendingNftCount),
      })));
      setCustomersTotal(Number(result.total));
    } catch (error) {
      if (requestId === customersRequestId.current) {
        setMessage(error instanceof Error ? error.message : "Не удалось загрузить клиентов");
      }
    } finally {
      if (requestId === customersRequestId.current) setCustomersLoading(false);
    }
  }, [customerPage, deferredCustomerSearch, region, request, token]);

  useEffect(() => {
    if (tab !== "customers" || !token) return;
    const timer = window.setTimeout(() => void loadCustomers(), 180);
    return () => {
      window.clearTimeout(timer);
      customersRequestId.current += 1;
    };
  }, [loadCustomers, tab, token]);

  const loadLoyaltyOverview = useCallback(async () => {
    if (!token) return;
    const requestId = ++loyaltyOverviewRequestId.current;
    setLoyaltyOverviewLoading(true);
    try {
      const overview = await request(`/admin/loyalty/overview?region=${encodeURIComponent(region)}`) as LoyaltyOverview;
      if (requestId !== loyaltyOverviewRequestId.current) return;
      setLoyaltyOverview(overview);
      setLoyaltyOverviewRegion(region);
      setLoyaltyDraft({
        enabled: overview.program.enabled,
        everyOrders: String(overview.program.everyOrders || 10),
        name: overview.program.name || "NFT NAKTA",
        image: overview.program.image || "",
        description: overview.program.description || "",
        network: overview.program.network || "polygon",
        contractAddress: overview.program.contractAddress || "",
        metadataUri: overview.program.metadataUri || "",
      });
    } catch (error) {
      if (requestId === loyaltyOverviewRequestId.current) {
        setMessage(error instanceof Error ? error.message : "Не удалось загрузить программу лояльности");
      }
    } finally {
      if (requestId === loyaltyOverviewRequestId.current) setLoyaltyOverviewLoading(false);
    }
  }, [region, request, token]);

  const loadNftWithdrawals = useCallback(async () => {
    if (!token) return;
    const requestId = ++nftWithdrawalsRequestId.current;
    setNftWithdrawalsLoading(true);
    try {
      const query = new URLSearchParams({ region });
      if (nftFilter !== "all") query.set("status", nftFilter);
      const withdrawals = await request(`/admin/nft-withdrawals?${query}`) as NftWithdrawal[];
      if (requestId !== nftWithdrawalsRequestId.current) return;
      setNftWithdrawals(withdrawals);
    } catch (error) {
      if (requestId === nftWithdrawalsRequestId.current) {
        setMessage(error instanceof Error ? error.message : "Не удалось загрузить NFT");
      }
    } finally {
      if (requestId === nftWithdrawalsRequestId.current) setNftWithdrawalsLoading(false);
    }
  }, [nftFilter, region, request, token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadLoyaltyOverview(), 0);
    return () => {
      window.clearTimeout(timer);
      loyaltyOverviewRequestId.current += 1;
    };
  }, [loadLoyaltyOverview, token]);

  useEffect(() => {
    if (tab !== "loyalty" || !token) return;
    const timer = window.setTimeout(() => void loadNftWithdrawals(), 0);
    return () => {
      window.clearTimeout(timer);
      nftWithdrawalsRequestId.current += 1;
    };
  }, [loadNftWithdrawals, tab, token]);

  const saveLoyaltyProgram = async () => {
    if (!selectedRegion?.id || loyaltySaving) return;
    if (!activeLoyaltyOverview) {
      setMessage("Дождитесь загрузки NFT-программы выбранного филиала");
      return;
    }
    setLoyaltySaving(true);
    setMessage("");
    try {
      const everyOrders = loyaltyDraft.enabled ? Number(loyaltyDraft.everyOrders) : 0;
      if (loyaltyDraft.enabled && (!Number.isInteger(everyOrders) || everyOrders < 1)) {
        throw new Error("Укажите, через сколько завершённых заказов выдавать NFT");
      }
      if (loyaltyDraft.enabled && !loyaltyDraft.name.trim()) {
        throw new Error("Укажите название NFT");
      }
      await request(`/admin/regions/${selectedRegion.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          nftRewardEveryOrders: everyOrders,
          nftRewardName: loyaltyDraft.name.trim(),
          nftRewardImage: loyaltyDraft.image,
          nftRewardDescription: loyaltyDraft.description.trim(),
          nftRewardNetwork: loyaltyDraft.network,
          nftContractAddress: loyaltyDraft.contractAddress.trim(),
          nftMetadataUri: loyaltyDraft.metadataUri.trim(),
        }),
      });
      await Promise.all([loadSettings(), loadLoyaltyOverview()]);
      setMessage("NFT-программа сохранена");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить NFT-программу");
    } finally {
      setLoyaltySaving(false);
    }
  };

  const updateNftWithdrawal = async (id: string, payload: NftUpdatePayload) => {
    if (nftUpdatingId) return false;
    setNftUpdatingId(id);
    setMessage("");
    try {
      await request(`/admin/nft-withdrawals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await Promise.all([loadNftWithdrawals(), loadLoyaltyOverview()]);
      setMessage("Статус вывода NFT обновлён");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось обновить вывод NFT");
      return false;
    } finally {
      setNftUpdatingId(null);
    }
  };

  const loadEduPosStatus = useCallback(async () => {
    if (!token) return;
    setEduPosStatusLoading(true);
    try {
      setEduPosStatus(await request("/admin/edu-pos/status") as EduPosStatus);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось проверить EDU POS");
    } finally {
      setEduPosStatusLoading(false);
    }
  }, [request, token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadEduPosStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEduPosStatus, token]);

  const products = useMemo(() => dashboard?.categories.flatMap((category) =>
    category.products.map((product) => ({ ...product, categoryId: category.id, categoryTitle: category.title }))) || [], [dashboard]);
  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const visibleProducts = useMemo(() => products.filter((product) =>
    (productCategoryFilter === "all" || String(product.categoryId) === productCategoryFilter)
    && (!normalizedSearch || `${product.name} ${product.categoryTitle} ${product.id}`.toLocaleLowerCase("ru").includes(normalizedSearch))
  ), [normalizedSearch, productCategoryFilter, products]);
  const visiblePromotions = useMemo(() => (dashboard?.promotions || []).filter((promotion) =>
    (!normalizedSearch || promotion.title.toLocaleLowerCase("ru").includes(normalizedSearch))
    && (promotionStatus === "all" || (promotionStatus === "active" ? promotion.enabled : !promotion.enabled))
  ), [dashboard?.promotions, normalizedSearch, promotionStatus]);
  const visibleCategories = useMemo(() => (dashboard?.categories || []).filter((category) =>
    !normalizedSearch || `${category.title} ${category.slug}`.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [dashboard?.categories, normalizedSearch]);
  const productPageCount = Math.max(1, Math.ceil(visibleProducts.length / productPageSize));
  const safeProductPage = Math.min(productPage, productPageCount);
  const pagedProducts = visibleProducts.slice((safeProductPage - 1) * productPageSize, safeProductPage * productPageSize);
  const openProduct = (product?: Product & { categoryId: number }) => {
    setEditorSection("main");
    if (!product) {
      presentEditor(emptyProduct(productCategoryFilter === "all" ? String(dashboard?.categories[0]?.id || "") : productCategoryFilter));
      return;
    }
    presentEditor({
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
    presentEditor(promotion ? {
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
    presentEditor(category ? {
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
    if (editor.kind === "product" && (
      !String(editor.values.name || "").trim()
      || !String(editor.values.image || "").trim()
      || !String(editor.values.categoryId || "").trim()
      || !Number.isFinite(Number(editor.values.price))
    )) {
      setEditorSection("main");
      setMessage("Заполните название, изображение, категорию и цену блюда");
      return;
    }
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
      dismissEditor();
      setMessage("Изменения сохранены");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  const deleteEditor = () => {
    if (!editor?.id) return;
    const currentEditor = editor;
    setConfirmation({
      title: `Удалить ${currentEditor.kind === "product" ? "блюдо" : currentEditor.kind === "promotion" ? "акцию" : "категорию"}?`,
      description: "Объект исчезнет из панели и витрины. Это действие нельзя отменить.",
      confirmLabel: "Удалить",
      tone: "danger",
      action: async () => {
        const resource = currentEditor.kind === "product" ? "products" : currentEditor.kind === "promotion" ? "promotions" : "categories";
        setLoading(true);
        try {
          await request(`/admin/${resource}/${currentEditor.id}`, { method: "DELETE" });
          dismissEditor();
          setMessage("Удалено");
          await loadDashboard();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Не удалось удалить");
        } finally {
          setLoading(false);
        }
      },
    });
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

  const deleteProduct = (product: Product) => {
    setOpenProductActions(null);
    setConfirmation({
      title: `Удалить «${product.name}»?`,
      description: "Блюдо исчезнет из каталога и клиентского меню. Это действие нельзя отменить.",
      confirmLabel: "Удалить блюдо",
      tone: "danger",
      action: async () => {
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
      },
    });
  };

  const authorize = async (event: FormEvent) => {
    event.preventDefault();
    const nextToken = tokenDraft.trim();
    if (!nextToken || authorizing) return;
    setAuthorizing(true);
    setLoginError("");
    try {
      const response = await fetch(`${apiUrl}/admin/settings`, {
        headers: { "x-admin-token": nextToken },
      });
      if (!response.ok) throw new Error(response.status === 401 ? "Неверный код администратора" : "Сервер временно недоступен");
      sessionStorage.setItem("losos-admin-token", nextToken);
      setToken(nextToken);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Не удалось войти");
    } finally {
      setAuthorizing(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("losos-admin-token");
    setToken("");
    setDashboard(null);
    setOrders([]);
    setSelectedOrder(null);
  };

  const openOrderKitEditor = (order: AdminOrder) => {
    setOrderKitDraft({
      utensilsCount: order.noUtensils ? Math.max(1, order.utensilsCount || 1) : order.utensilsCount,
      noUtensils: order.noUtensils,
      kitItems: orderKitItemsForDisplay(order).map((item) => ({ ...item })),
    });
  };

  const changeOrderKitQuantity = (id: string, delta: number) => {
    setOrderKitDraft((current) => current ? {
      ...current,
      kitItems: current.kitItems.map((item) => item.id === id
        ? { ...item, quantity: Math.min(20, Math.max(0, item.quantity + delta)) }
        : item),
    } : current);
  };

  const saveOrderKit = async () => {
    if (!selectedOrder || !orderKitDraft || orderKitSaving) return;
    setOrderKitSaving(true);
    setMessage("");
    try {
      const updated = await request(`/admin/orders/${selectedOrder.id}/kit`, {
        method: "PATCH",
        body: JSON.stringify({
          utensilsCount: orderKitDraft.noUtensils ? 0 : orderKitDraft.utensilsCount,
          noUtensils: orderKitDraft.noUtensils,
          kitItems: orderKitDraft.kitItems.map(({ id, quantity }) => ({ id, quantity })),
        }),
      }) as AdminOrder;
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedOrder(updated);
      setOrderKitDraft(null);
      setMessage(`${formatOrderNumber(updated)}: комплектация сохранена`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить комплектацию");
    } finally {
      setOrderKitSaving(false);
    }
  };

  const updateOrderStatus = async (order: AdminOrder, status: OrderStatus, confirmed = false) => {
    if (!confirmed && (status === "cancelled" || status === "completed")) {
      setConfirmation({
        title: status === "cancelled" ? `Отменить ${formatOrderNumber(order)}?` : `Завершить ${formatOrderNumber(order)}?`,
        description: status === "cancelled"
          ? "Заказ будет остановлен и больше не сможет вернуться в работу."
          : "Клиенту будут начислены NAKTA Coin и, если достигнут порог, NFT. Повторить начисление нельзя.",
        confirmLabel: status === "cancelled" ? "Отменить заказ" : "Завершить заказ",
        tone: status === "cancelled" ? "danger" : "default",
        action: () => updateOrderStatus(order, status, true),
      });
      return;
    }
    setOrdersLoading(true);
    setMessage("");
    try {
      const updated = await request(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }) as AdminOrder;
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
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
    presentRegionEditor(item ? {
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
      dismissRegionEditor();
      setDeletedPickupLocationIds([]);
      await loadSettings();
      setRegion(saved.slug);
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
        <h1>Вход в панель</h1>
        <label>Код администратора
          <span className="admin-login-input"><input type="password" name="admin-code" autoComplete="current-password" value={tokenDraft} onChange={(event) => { setTokenDraft(event.target.value); setLoginError(""); }} placeholder="Введите код" aria-invalid={Boolean(loginError)} autoFocus /></span>
        </label>
        {loginError ? <p className="admin-login-error" role="alert">{loginError}</p> : null}
        <button type="submit" disabled={authorizing}>{authorizing ? "Проверяем…" : "Войти"}</button>
      </form>
    </main>;
  }

  const pageMeta: Record<Tab, string> = {
    statistics: "Аналитика",
    orders: "Заказы",
    customers: "Клиенты",
    loyalty: "Лояльность",
    products: "Каталог",
    categories: "Категории",
    promotions: "Акции",
    settings: "Филиалы",
    integrations: "Интеграции",
  };
  const tabTitle = pageMeta[tab];
  const switchTab = (item: Tab) => {
    setTab(item);
    setSearch("");
    dismissEditor();
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
      await Promise.all([loadDashboard(), loadEduPosStatus()]);
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
      await loadEduPosStatus();
      setMessage(`Меню отправлено в EDU POS: ${exported.products || 0} блюд, ${exported.categories || 0} категорий`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось экспортировать меню в EDU POS");
    } finally {
      setEduPosAction(null);
      setLoading(false);
    }
  };
  const openCategoryManager = () => {
    setTab("categories");
    setSearch("");
    dismissEditor();
  };
  const totalOrderPages = Math.ceil(ordersTotal / ordersPerPage);
  const pendingNftCount = Number(activeLoyaltyOverview?.metrics.nftStatuses.pending || 0)
    + Number(activeLoyaltyOverview?.metrics.nftStatuses.submitted || 0);
  const renderSidebar = (mobile = false) => <AdminNavigation
    active={tab}
    mobile={mobile}
    newOrders={Number(statusCounts.new || 0)}
    pendingNfts={pendingNftCount}
    regionName={selectedRegion?.name || region}
    onSelect={switchTab}
    onLogout={logout}
  />;

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
          <button type="button" className="admin-notification-button" aria-label="Уведомления"><Icon path={mdiBellOutline} size={0.78} /><span>3</span></button>
          <label className="admin-region-context"><small>Рабочий филиал</small><select className="admin-topbar-region-select" aria-label="Рабочий филиал" value={region} onChange={(event) => selectRegion(event.target.value)}>{availableRegions.map((item) => <option value={item.slug} key={item.slug}>{item.name}{item.enabled ? "" : " · скрыт"}</option>)}</select></label>
        </div>
      </header>

      <section className="admin-content">
      {tab === "statistics" ? <AdminOverview
        regionName={selectedRegion?.name || region}
        data={statistics}
        period={statisticsPeriod}
        loading={statisticsLoading}
        onPeriodChange={setStatisticsPeriod}
      /> : null}

      {tab === "orders" ? <OrdersWorkspace
        orders={orders}
        total={ordersTotal}
        statusCounts={statusCounts}
        loading={ordersLoading}
        search={search}
        status={orderFilter}
        period={orderPeriod}
        view={orderView}
        page={orderPage}
        pageSize={ordersPerPage}
        pageCount={Math.max(1, totalOrderPages)}
        selectedOrderId={selectedOrder?.id}
        onSearchChange={(value) => { setSearch(value); setOrderPage(1); }}
        onStatusChange={(value) => { setOrderFilter(value); setOrderPage(1); }}
        onPeriodChange={(value) => { setOrderPeriod(value); setOrderPage(1); }}
        onViewChange={(value) => { setOrderView(value); setOrderPage(1); }}
        onPageChange={setOrderPage}
        onOrderOpen={(order) => { setOrderKitDraft(null); setSelectedOrder(order); }}
        onRefresh={() => void loadOrders()}
      /> : null}

      {tab === "customers" ? <CustomersView
        customers={customers}
        loading={customersLoading}
        search={customerSearch}
        total={customersTotal}
        page={customerPage}
        pageCount={Math.max(1, Math.ceil(customersTotal / 50))}
        onSearchChange={(value) => { setCustomerSearch(value); setCustomerPage(1); }}
        onPageChange={setCustomerPage}
        onOpenOrders={(phone) => {
          switchTab("orders");
          setSearch(phone);
          setOrderPage(1);
        }}
      /> : null}

      {tab === "loyalty" ? <LoyaltyCenter
        regionName={selectedRegion?.name || region}
        overview={activeLoyaltyOverview}
        draft={loyaltyDraft}
        withdrawals={nftWithdrawals}
        filter={nftFilter}
        loading={loyaltyOverviewLoading || nftWithdrawalsLoading}
        saving={loyaltySaving}
        updatingId={nftUpdatingId}
        onDraftChange={(patch) => setLoyaltyDraft((current) => ({ ...current, ...patch }))}
        onFilterChange={setNftFilter}
        onSave={saveLoyaltyProgram}
        onWithdrawalUpdate={updateNftWithdrawal}
        onOpenCatalog={() => switchTab("products")}
        onImageFile={async (file) => {
          try {
            const image = await fileToOptimizedDataUrl(file);
            setLoyaltyDraft((current) => ({ ...current, image }));
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Не удалось обработать изображение");
          }
        }}
      /> : null}

      {tab === "integrations" ? <IntegrationsView
        status={eduPosStatus}
        loading={eduPosStatusLoading}
        action={eduPosAction}
        nftTransferConfigured={Boolean(activeLoyaltyOverview?.transferProviderConfigured)}
        onRefresh={loadEduPosStatus}
        onImport={importEduPosMenu}
        onExport={exportEduPosMenu}
      /> : null}

      {tab === "products" ? <>
        <div className="admin-page-summary admin-catalog-kpis">
          <article><i><Icon path={mdiSilverwareForkKnife} size={0.82} /></i><span><small>Всего блюд</small><b>{products.length}</b></span><em>+8 за неделю</em></article>
          <article><i><Icon path={mdiShapeOutline} size={0.82} /></i><span><small>Категорий</small><b>{dashboard?.categories.length || 0}</b></span><em>+1 за неделю</em></article>
          <article><i><Icon path={mdiTrendingUp} size={0.82} /></i><span><small>В продаже</small><b>{products.filter((product) => product.available).length}</b></span><em>{products.length ? Math.round(products.filter((product) => product.available).length / products.length * 100) : 0}% от общего</em></article>
          <article><i><Icon path={mdiEyeOffOutline} size={0.82} /></i><span><small>Скрыто</small><b>{products.filter((product) => !product.available).length}</b></span><em>{products.length ? Math.round(products.filter((product) => !product.available).length / products.length * 100) : 0}% от общего</em></article>
          <article><i><Icon path={mdiTagOutline} size={0.82} /></i><span><small>В черновиках</small><b>{products.filter((product) => !product.posDishId).length}</b></span><em>{products.length ? Math.round(products.filter((product) => !product.posDishId).length / products.length * 100) : 0}% от общего</em></article>
        </div>
        <div className="admin-catalog-card">
          <nav className="admin-catalog-subnav" aria-label="Разделы каталога"><button type="button" className="active">Блюда</button><button type="button" onClick={openCategoryManager}>Категории</button></nav>
          <div className="admin-catalog-toolbar">
            <label className="admin-search-field"><input value={search} onChange={(event) => { setSearch(event.target.value); setProductPage(1); }} placeholder="Поиск по названию блюда" /></label>
            <div className="admin-menu-actions"><button type="button" className="admin-category-add" onClick={() => switchTab("integrations")}>EDU POS</button><button className="admin-add" onClick={() => openProduct()}>＋ Добавить блюдо</button></div>
          </div>
          <div className="admin-menu-categories" aria-label="Категории меню">
            <button type="button" className={productCategoryFilter === "all" ? "active" : ""} onClick={() => { setProductCategoryFilter("all"); setProductPage(1); }}>Все блюда <span>{products.length}</span></button>
            {(dashboard?.categories || []).map((category) => <button type="button" key={category.id} className={productCategoryFilter === String(category.id) ? "active" : ""} onClick={() => { setProductCategoryFilter(String(category.id)); setProductPage(1); }}>{category.title} <span>{category.products.length}</span></button>)}
          </div>
          <div className="admin-products-table">
        <div className="admin-products-head"><span>Блюдо</span><span>Категория</span><span>Цена</span><span>NAKTA Coin</span><span>Статус</span><span>Действия</span></div>
        {pagedProducts.map((product) => <article className="admin-product" key={product.id} role="button" tabIndex={0} onClick={() => openProduct(product)} onKeyDown={(event) => {
          if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          openProduct(product);
        }}>
          <img src={product.image} alt="" />
          <span><b>{product.name}</b><small>ID: {product.id}{product.posDishId ? ` · POS: ${product.posDishId}` : " · не сопоставлено с POS"}</small></span>
          <span className="admin-product-category">{product.categoryTitle}</span>
          <strong>{product.price} сом{product.oldPrice && product.oldPrice > product.price ? <small> {product.oldPrice} сом</small> : null}</strong>
          <span className={`admin-product-coins${product.naktaCoins ? " configured" : ""}`}>{product.naktaCoins ? `+${product.naktaCoins}` : "—"}</span>
          <i className={product.available && product.posAvailable ? "available" : ""}>{!product.available ? "Отключено" : product.posAvailable ? "В продаже" : "Стоп-лист POS"}</i>
          <div className="admin-product-actions" onClick={(event) => event.stopPropagation()}><button type="button" aria-label={`Действия: ${product.name}`} aria-expanded={openProductActions === product.id} onClick={() => setOpenProductActions((current) => current === product.id ? null : product.id)}>⋮</button>{openProductActions === product.id ? <div className="admin-product-action-menu"><button type="button" onClick={() => void updateProductAvailability(product)}>{product.available ? "Сделать неактивным" : "Сделать активным"}</button><button type="button" className="delete" onClick={() => void deleteProduct(product)}>Удалить</button></div> : null}</div>
        </article>)}
          {!visibleProducts.length && !loading ? <div className="admin-empty"><span>Блюда не найдены</span></div> : null}
          </div>
          <footer className="admin-table-footer"><span>Показано {visibleProducts.length ? (safeProductPage - 1) * productPageSize + 1 : 0}–{Math.min(safeProductPage * productPageSize, visibleProducts.length)} из {visibleProducts.length} блюд</span><nav aria-label="Страницы каталога"><button type="button" disabled={safeProductPage <= 1} onClick={() => setProductPage(safeProductPage - 1)}>‹</button>{Array.from({ length: productPageCount }, (_, index) => index + 1).slice(Math.max(0, safeProductPage - 3), Math.min(productPageCount, safeProductPage + 2)).map((pageNumber) => <button type="button" className={pageNumber === safeProductPage ? "active" : ""} key={pageNumber} onClick={() => setProductPage(pageNumber)}>{pageNumber}</button>)}<button type="button" disabled={safeProductPage >= productPageCount} onClick={() => setProductPage(safeProductPage + 1)}>›</button></nav><label><select value={productPageSize} onChange={(event) => { setProductPageSize(Number(event.target.value)); setProductPage(1); }}><option value="10">10 на странице</option><option value="20">20 на странице</option><option value="50">50 на странице</option></select></label></footer>
        </div>
      </> : null}

      {tab === "promotions" ? <>
        <div className="admin-promotions-summary"><article><i><Icon path={mdiTagOutline} size={0.9} /></i><span><small>Всего акций</small><b>{dashboard?.promotions.length || 0}</b></span></article><article><i><Icon path={mdiCheckCircleOutline} size={0.9} /></i><span><small>Активных акций</small><b>{dashboard?.promotions.filter((item) => item.enabled).length || 0}</b></span></article><button className="admin-add" onClick={() => openPromotion()}>＋ Добавить акцию</button></div>
        <div className="admin-catalog-card">
          <div className="admin-catalog-toolbar">
            <label className="admin-search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по акциям" /></label>
            <div className="admin-promotion-filters"><select aria-label="Статус акций" value={promotionStatus} onChange={(event) => setPromotionStatus(event.target.value as typeof promotionStatus)}><option value="all">Все статусы</option><option value="active">Активные</option><option value="hidden">Скрытые</option></select><span><button type="button" className="active" aria-label="Карточки">▦</button><button type="button" aria-label="Список">☰</button></span></div>
          </div>
          <div className="admin-grid admin-promotions">
            {visiblePromotions.map((promotion) => <button className="admin-promotion" key={promotion.id} onClick={() => openPromotion(promotion)}>
              <img src={promotion.image} alt="" />
              <span><b>{promotion.title}</b><small>{promotion.cta || "Специальное предложение для гостей."}</small><i className={promotion.enabled ? "active" : ""}>● {promotion.enabled ? "Активна" : "Скрыта"}</i><strong aria-label="Изменить">✎</strong></span>
            </button>)}
            {!visiblePromotions.length && !loading ? <div className="admin-empty"><span>Акции не найдены</span></div> : null}
          </div>
          <footer className="admin-table-footer"><span>Показано 1–{visiblePromotions.length} из {dashboard?.promotions.length || 0}</span><nav><button type="button">‹</button><button type="button" className="active">1</button><button type="button">2</button><button type="button">›</button></nav><label><select defaultValue="12"><option value="12">12 на странице</option></select></label></footer>
        </div>
      </> : null}

      {tab === "categories" ? <>
        <nav className="admin-catalog-subnav admin-categories-tabs" aria-label="Разделы каталога"><button type="button" onClick={() => switchTab("products")}>Блюда</button><button type="button" className="active">Категории</button></nav>
        <div className="admin-category-summary-card"><article><i><Icon path={mdiShapeOutline} size={0.86} /></i><span><small>Категорий</small><b>{dashboard?.categories.length || 0}</b></span></article><article><i><Icon path={mdiSilverwareForkKnife} size={0.86} /></i><span><small>Блюд</small><b>{products.length}</b></span></article><label className="admin-search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по названию или slug" /></label><button className="admin-add" onClick={() => openCategory()}>＋ Добавить категорию</button></div>
        <div className="admin-catalog-card admin-category-table-card">
          <div className="admin-categories">
            <div className="admin-categories-head"><span></span><span>Порядок</span><span>Категория</span><span>Блюд</span><span>Slug</span><span>Сортировка</span><span>Видимость</span><span>Действия</span></div>
            {visibleCategories.map((category) => <button key={category.id} onClick={() => openCategory(category)}>
              <i>⁙</i><em>{category.sortOrder}</em><span className="admin-category-name"><span className="admin-category-thumb">{category.image ? <img src={category.image} alt="" /> : "—"}</span><b>{category.title}</b></span><em>{category.products.length}</em><small>{category.slug}</small><em>По порядку</em><strong>● Видимая</strong><span className="admin-row-actions">✎ Изменить</span>
            </button>)}
          </div>
          <footer className="admin-category-footer">« Свернуть меню</footer>
        </div>
      </> : null}

      {tab === "settings" ? <div className="admin-settings">
        <div className="admin-settings-toolbar"><article><i>▥</i><span><small>Всего филиалов</small><b>{availableRegions.length}</b></span></article><label className="admin-search-field"><input placeholder="Поиск по городу, телефону или e-mail..." /></label><button type="button" className="admin-category-add">☷ Фильтры</button><button className="admin-add" onClick={() => openRegion()}>＋ Добавить город</button></div>
        <section>
          <div className="admin-settings-title"><span>Город</span><span>Статус</span><span>Действия</span></div>
          <div className="admin-settings-list">
            {availableRegions.map((item) => <button key={item.id || item.slug} onClick={() => openRegion(item)}>
              <span className="admin-settings-city"><i aria-hidden="true">⌂</i><span><b>{item.name}</b><small>{item.slug}</small><em>Меню: {availableRegions.find((source) => source.slug === item.menuSourceRegionSlug)?.name || "своё"}　•　Акции: {availableRegions.find((source) => source.slug === item.promotionSourceRegionSlug)?.name || "свои"}</em></span></span>
              <i className={item.enabled ? "enabled" : ""}>● {item.enabled ? "Активен" : "Скрыт"}</i>
              <strong>✎ Изменить</strong>
            </button>)}
          </div>
          <footer className="admin-table-footer"><span>Показано 1–{availableRegions.length} из {availableRegions.length}</span><nav><button type="button">‹</button><button type="button" className="active">1</button><button type="button">›</button></nav></footer>
        </section>
      </div> : null}
      </section>
    </div>

    {editor ? <div className={`admin-editor-overlay admin-editor-page admin-${editor.kind}-overlay ${editor.id ? "is-edit" : "is-create"}`} role="dialog" aria-modal="true" aria-label="Редактирование" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
      <form className={`admin-editor admin-editor-${editor.kind}`} onSubmit={saveEditor}>
        <div className="admin-editor-head">
          <span><b>{editor.id ? "Редактирование" : "Добавление"} {editor.kind === "product" ? "блюда" : editor.kind === "promotion" ? "акции" : "категории"}</b>{editor.kind === "category" ? <small>{editor.id ? "Измените название, изображение и порядок отображения категории." : "Заполните информацию — категория появится в меню."}</small> : null}</span>
          <button type="button" onClick={closeEditor} aria-label="Закрыть">×</button>
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
                <h3>{editor.id ? "Карточка блюда" : "Информация о блюде"}</h3>
                <label>Название блюда<input required maxLength={120} value={String(editor.values.name || "")} onChange={(event) => updateValue("name", event.target.value)} placeholder="Введите название блюда" /></label>
                <p className="admin-slug-hint">{editor.id ? "Адрес страницы сформируется автоматически из названия." : "Это название будет видно клиентам в меню."}</p>
                <ImageField variant="product" creating={!editor.id} value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
              </section>
              <section className="admin-editor-section">
                <h3>Продажа и описание</h3>
                <div className="admin-two-fields">
                  <label>Категория<select value={String(editor.values.categoryId || "")} onChange={(event) => updateValue("categoryId", event.target.value)}>{dashboard?.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
                  <label>Цена, сом<input required type="number" min="0" value={String(editor.values.price)} onChange={(event) => updateValue("price", event.target.value)} /></label>
                  <label>Старая цена, сом<input type="number" min="0" value={String(editor.values.oldPrice || "")} onChange={(event) => updateValue("oldPrice", event.target.value)} placeholder="Без скидки" /></label>
                  <label>NAKTA Coin за 1 шт.<input type="number" min="0" step="1" value={String(editor.values.naktaCoins ?? "")} onChange={(event) => updateValue("naktaCoins", event.target.value)} /></label>
                </div>
                <label>Короткое описание<textarea maxLength={200} value={String(editor.values.description || "")} onChange={(event) => updateValue("description", event.target.value)} placeholder="Опишите блюдо: состав, вкус, способ приготовления и особенности" /></label>
                <div className="admin-two-fields">
                  <label>EDU POS dishId<input value={String(editor.values.posDishId || "")} onChange={(event) => updateValue("posDishId", event.target.value)} placeholder="ID блюда из /menu" /></label>
                  <label>EDU POS variantId<input value={String(editor.values.posVariantId || "")} onChange={(event) => updateValue("posVariantId", event.target.value)} placeholder="Необязательно" /></label>
                </div>
                <div className="admin-editor-inline-row">
                  <label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label>
                  <label className="admin-switch"><span><b>Новинка</b><small>Показывать отметку в меню</small></span><input type="checkbox" checked={Boolean(editor.values.isNew)} onChange={(event) => updateValue("isNew", event.target.checked)} /></label>
                  <label className="admin-switch"><span><b>В продаже</b><small>Можно заказать на сайте</small></span><input type="checkbox" checked={Boolean(editor.values.available)} onChange={(event) => updateValue("available", event.target.checked)} /></label>
                </div>
              </section>
            </div> : null}
            {editorSection === "modifiers" ? <section className="admin-editor-section admin-editor-section-wide">
              <div className="admin-editor-section-heading"><span><h3>Модификаторы блюда</h3><p>Добавки и варианты выбора, которые увидит клиент.</p></span></div>
              <ModifierGroupsEditor value={editor.values.modifierGroups as ModifierGroup[] || []} onChange={(value) => updateValue("modifierGroups", value)} />
            </section> : null}
            {editorSection === "nutrition" ? <section className="admin-editor-section admin-editor-section-wide">
              <div className="admin-editor-section-heading admin-nutrition-heading"><i>♧</i><span><h3>Пищевая ценность</h3><p>Укажите состав и пищевую ценность блюда на одну порцию.</p></span></div>
              <label>Состав<textarea maxLength={1000} className="admin-composition-field" value={String(editor.values.composition || "")} onChange={(event) => updateValue("composition", event.target.value)} placeholder="Опишите состав блюда: основные ингредиенты, добавки, соусы и т.д." /></label>
              <div className="admin-nutrition">
                {[["weight", "Граммы"], ["calories", "Ккал"], ["protein", "Белки"], ["fat", "Жиры"], ["carbs", "Углеводы"]].map(([name, label]) => <label key={name}>{label}<input type="number" min="0" value={String(editor.values[name])} onChange={(event) => updateValue(name, event.target.value)} /></label>)}
              </div>
              <p className="admin-nutrition-note">ⓘ Значения указываются для одной стандартной порции блюда.</p>
            </section> : null}
          </div>
        </> : <div className="admin-editor-body admin-editor-simple-body">
          <label>{editor.kind === "promotion" ? "Название акции" : "Название категории"}<input required value={String(editor.values.title || "")} onChange={(event) => updateValue("title", event.target.value)} placeholder={editor.kind === "promotion" ? "Введите название акции" : "Например, Роллы"} /></label>
          {editor.kind === "category" ? <p className="admin-slug-hint">Это название будет отображаться в меню приложения и на сайте.</p> : null}
          <ImageField variant={editor.kind} creating={!editor.id} value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
          {editor.kind === "promotion" ? <>
            <label>Ссылка кнопки<input type="url" required={Boolean(editor.values.cta)} value={String(editor.values.ctaUrl || "")} onChange={(event) => updateValue("ctaUrl", event.target.value)} placeholder="https://t.me/... или https://example.com" /></label>
            <div className="admin-two-fields"><label>Текст кнопки<input value={String(editor.values.cta || "")} onChange={(event) => updateValue("cta", event.target.value)} placeholder="Например, Подробнее" /></label><label>Порядок отображения<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label></div>
            <label className="admin-switch"><span><b>Показывать акцию</b><small>В ленте выбранного города</small></span><input type="checkbox" checked={Boolean(editor.values.enabled)} onChange={(event) => updateValue("enabled", event.target.checked)} /></label>
          </> : <label>Порядок отображения<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /><small>Меньшее число — выше в списке.</small></label>}
        </div>}

        <div className="admin-editor-actions">
          {editor.id ? <button type="button" className="admin-delete" onClick={deleteEditor}>♧ Удалить {editor.kind === "product" ? "блюдо" : editor.kind === "promotion" ? "акцию" : "категорию"}</button> : <span />}
          <div className="admin-editor-action-buttons">
            <button type="button" className="admin-cancel" onClick={closeEditor}>Отмена</button>
            <button type="submit" className="admin-save" disabled={loading}>{loading ? "Сохраняем…" : editor.id ? "Сохранить изменения" : "Сохранить"}</button>
          </div>
        </div>
      </form>
    </div> : null}

    {regionEditor ? <div className="admin-editor-overlay admin-region-overlay" role="dialog" aria-modal="true" aria-label="Настройки города" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRegionEditor(); }}>
      <form className="admin-region-editor" onSubmit={saveRegion}>
        <div className="admin-editor-head">
          <span><small>Настройки</small><b>{regionEditor.id ? "Редактирование города" : "Новый город"}</b></span>
          <button type="button" onClick={closeRegionEditor} aria-label="Закрыть">×</button>
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
        <div className="admin-editor-actions"><span /><div className="admin-editor-action-buttons"><button type="button" className="admin-cancel" onClick={closeRegionEditor}>Отмена</button><button type="submit" className="admin-save" disabled={loading}>{loading ? "Сохраняем…" : "Сохранить"}</button></div></div>
      </form>
    </div> : null}

    {selectedOrder ? <div className="admin-editor-overlay admin-order-overlay" role="dialog" aria-modal="true" aria-label={`Заказ ${formatOrderNumber(selectedOrder)}`} onMouseDown={(event) => { if (event.target === event.currentTarget) { setOrderKitDraft(null); setSelectedOrder(null); } }}>
      <section className="admin-order-detail">
        <header className="admin-order-detail-head">
          <div className="admin-order-head-identity">
            <span className="admin-order-head-icon"><Icon path={mdiReceiptTextOutline} size={1.05} aria-hidden="true" /></span>
            <span className="admin-order-head-copy"><span><b>Заказ {formatOrderNumber(selectedOrder)}</b><i className={`admin-order-status status-${selectedOrder.status}`}>{orderStatusLabels[selectedOrder.status]}</i></span><small>{formatOrderDate(selectedOrder.createdAt)}</small></span>
          </div>
          <div className="admin-order-head-total"><small>Итого</small><strong>{formatSom(selectedOrder.total)}</strong></div>
          <button type="button" onClick={() => { setOrderKitDraft(null); setSelectedOrder(null); }} aria-label="Закрыть">×</button>
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
              <button type="button" className="admin-order-kit-card" disabled={["completed", "cancelled"].includes(selectedOrder.status)} onClick={() => openOrderKitEditor(selectedOrder)}><i><Icon path={mdiSilverwareForkKnife} size={0.9} aria-hidden="true" /></i><span><small>Комплектация{!["completed", "cancelled"].includes(selectedOrder.status) ? " · изменить" : ""}</small><b>{selectedOrder.noUtensils ? "Без палочек" : `Палочки: ${selectedOrder.utensilsCount}`}</b></span></button>
            </div>
            {orderKitDraft ? <form className="admin-order-kit-editor" onSubmit={(event) => { event.preventDefault(); void saveOrderKit(); }}>
              <div className="admin-order-kit-editor-head"><span><b>Комплектация заказа</b><small>Палочки, соусы и добавки</small></span><button type="button" onClick={() => setOrderKitDraft(null)} aria-label="Закрыть редактирование">×</button></div>
              <label className="admin-order-kit-toggle"><span><b>Палочки</b><small>{orderKitDraft.noUtensils ? "Не добавлять" : `${orderKitDraft.utensilsCount} шт.`}</small></span><input type="checkbox" checked={!orderKitDraft.noUtensils} onChange={(event) => setOrderKitDraft((current) => current ? { ...current, noUtensils: !event.target.checked } : current)} /></label>
              {!orderKitDraft.noUtensils ? <div className="admin-order-kit-row"><span><b>Количество палочек</b></span><span className="admin-order-kit-stepper"><button type="button" onClick={() => setOrderKitDraft((current) => current ? { ...current, utensilsCount: Math.max(1, current.utensilsCount - 1) } : current)}>−</button><b>{orderKitDraft.utensilsCount}</b><button type="button" onClick={() => setOrderKitDraft((current) => current ? { ...current, utensilsCount: Math.min(50, current.utensilsCount + 1) } : current)}>+</button></span></div> : null}
              {orderKitDraft.kitItems.map((item) => <div className="admin-order-kit-row" key={item.id}><span><b>{item.name}</b><small>{item.quantity ? `${item.quantity} шт.` : "Не добавлять"}</small></span><span className="admin-order-kit-stepper"><button type="button" onClick={() => changeOrderKitQuantity(item.id, -1)}>−</button><b>{item.quantity}</b><button type="button" onClick={() => changeOrderKitQuantity(item.id, 1)}>+</button></span></div>)}
              <div className="admin-order-kit-editor-actions"><button type="button" onClick={() => setOrderKitDraft(null)}>Отмена</button><button type="submit" disabled={orderKitSaving}>{orderKitSaving ? "Сохраняем…" : "Сохранить"}</button></div>
            </form> : null}
            <div className="admin-order-comment"><span className="admin-order-detail-icon"><Icon path={mdiMessageOutline} size={0.95} aria-hidden="true" /></span><span><small>Комментарий</small><b>{selectedOrder.comment || "Без комментария"}</b></span></div>
            {selectedOrder.posSyncStatus ? <div className="admin-order-pos-state"><small>EDU POS</small><b>{selectedOrder.posSyncStatus === "pos_sync_failed" ? `Ошибка синхронизации${selectedOrder.posLastError ? `: ${selectedOrder.posLastError}` : ""}` : selectedOrder.posSyncStatus === "submitting" ? "Отправляется на кухню…" : selectedOrder.posStatus ? `${selectedOrder.posOrderNumber ? `${formatPosOrderNumber(selectedOrder.posOrderNumber)} · ` : ""}${posStatusLabels[selectedOrder.posStatus] || selectedOrder.posStatus} · готово ${selectedOrder.posItemsReady || 0} из ${selectedOrder.posItemsTotal || 0}${selectedOrder.posItemsRejected ? ` · отклонено ${selectedOrder.posItemsRejected}` : ""}` : selectedOrder.status === "new" ? "Отправится после подтверждения" : "Ожидает отправки"}</b></div> : null}
          </section>

          <section className="admin-order-items-pane">
            <h3>Состав заказа</h3>
            <div className="admin-order-lines">
              {selectedOrder.items.map((item) => <article key={item.id}>
                <span className="admin-order-qty">{item.quantity}×</span>
                <span><b>{item.productName}</b>{item.modifierSnapshots?.length ? <span className="admin-order-modifiers">{item.modifierSnapshots.map((modifier) => {
                  const contribution = modifier.totalPrice
                    * (modifier.priceScope === "per-product" ? item.quantity : 1);
                  const scopeLabel = modifier.priceScope === "per-line"
                    ? "за строку"
                    : `за ${item.quantity} шт.`;
                  return <small key={`${modifier.groupId}:${modifier.itemId}`}><b>{modifier.groupTitle}:</b> {modifier.itemName}
                    {modifier.quantity > 1 ? ` ×${modifier.quantity}` : ""}
                    {contribution ? ` (+${contribution} сом ${scopeLabel})` : ""}
                  </small>;
                })}</span> : null}{item.posStatus ? <small>{item.posStatus === "rejected" ? `EDU POS: отклонено${item.posRejectReason ? ` — ${item.posRejectReason}` : ""}` : item.posStatus === "ready" ? "EDU POS: готово" : `EDU POS: ${item.posStatus}`}</small> : null}</span>
                <strong>{formatSom(item.lineTotal)}</strong>
              </article>)}
            </div>
            <div className="admin-order-kit-summary"><span><b>Комплектация</b><small>{selectedOrder.noUtensils ? "Без палочек" : `Палочки — ${selectedOrder.utensilsCount} шт.`}</small>{orderKitItemsForDisplay(selectedOrder).filter((item) => item.quantity > 0).map((item) => <small key={item.id}>{item.name} — {item.quantity} шт.</small>)}{orderKitItemsForDisplay(selectedOrder).every((item) => item.quantity === 0) ? <small>Без соусов и добавок</small> : null}</span>{!["completed", "cancelled"].includes(selectedOrder.status) ? <button type="button" onClick={() => openOrderKitEditor(selectedOrder)}>Изменить</button> : null}</div>
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

    {confirmation ? <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !confirmationBusy) setConfirmation(null); }}>
      <section className="admin-confirm-dialog">
        <span className={`admin-confirm-icon ${confirmation.tone === "danger" ? "danger" : "default"}`} aria-hidden="true">{confirmation.tone === "danger" ? "!" : "✓"}</span>
        <h2 id="admin-confirm-title">{confirmation.title}</h2>
        <p>{confirmation.description}</p>
        <div><button type="button" className="admin-secondary-button" disabled={confirmationBusy} onClick={() => setConfirmation(null)}>Оставить как есть</button><button type="button" className={confirmation.tone === "danger" ? "admin-danger-button" : "admin-primary-button"} disabled={confirmationBusy} onClick={() => void runConfirmation()}>{confirmationBusy ? "Выполняем…" : confirmation.confirmLabel}</button></div>
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
        <i aria-hidden="true">⁙</i><span aria-hidden="true">⌄</span>
        <input aria-label="Название группы" value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} />
        <button type="button" onClick={() => removeGroup(groupIndex)} aria-label={`Удалить группу ${group.title}`}>♧</button>
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
          <i className="admin-modifier-handle" aria-hidden="true">⁙</i>
          {item.image ? <img src={item.image} alt="" /> : <span className="admin-modifier-placeholder">Фото</span>}
          <label>Название варианта<input aria-label="Название варианта" value={item.name} onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })} /></label>
          <input className="admin-modifier-image-url" aria-label="Ссылка на фото варианта" value={item.image} onChange={(event) => updateItem(groupIndex, itemIndex, { image: event.target.value })} placeholder="Ссылка на фото" />
          <label>Цена<input type="number" min="0" value={item.price} onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })} /></label>
          <label>Макс. количество<input type="number" min="1" max="99" disabled={group.selectionType === "single"} value={item.maxQuantity ?? (group.selectionType === "single" ? 1 : 20)} onChange={(event) => updateItem(groupIndex, itemIndex, { maxQuantity: Number(event.target.value) })} /></label>
          <label className="admin-modifier-enabled"><span>Доступен</span><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateItem(groupIndex, itemIndex, { enabled: event.target.checked })} /></label>
          <button type="button" onClick={() => removeItem(groupIndex, itemIndex)} aria-label={`Удалить ${item.name}`}>×</button>
        </div>)}
      </div>
      <button className="admin-add-option" type="button" onClick={() => addItem(groupIndex)}>+ Добавить вариант</button>
    </article>)}
  </section>;
}

function ImageField({
  value,
  onChange,
  variant = "product",
  creating = false,
}: {
  value: string;
  onChange: (value: string) => void;
  variant?: "product" | "promotion" | "category";
  creating?: boolean;
}) {
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
  const uploadTitle = variant === "product"
    ? creating ? "Загрузите фото блюда" : "Выбрать фото с устройства"
    : variant === "category"
      ? creating ? "Загрузите изображение" : "Перетащите новое изображение сюда"
      : creating ? "Перетащите изображение сюда" : "Загрузить изображение";
  return <div className={`admin-image-field admin-image-${variant}${creating ? " is-create" : " is-edit"}`}>
    <span className="admin-image-label">{variant === "product" ? "Фото блюда" : variant === "promotion" ? creating ? "Фото" : "Изображение (URL)" : "Фото категории"}</span>
    <label className="admin-image-url"><input required={!value} value={value.startsWith("data:") ? "" : value} onChange={(event) => onChange(event.target.value)} placeholder={variant === "promotion" ? "Ссылка на изображение" : "https://storage.example.com/image.png"} /></label>
    <div className="admin-image-media">
      {value ? <img src={value} alt="Предпросмотр" /> : null}
      <label className="admin-upload"><i>♧</i><b>{processing ? "Обрабатываем…" : uploadTitle}</b><span>{variant === "product" && creating ? "Перетащите файл сюда или выберите на устройстве" : "или выберите файл с компьютера"}</span><input type="file" accept="image/*" onChange={(event) => void selectFile(event.target.files?.[0])} /></label>
    </div>
    <small>JPG, PNG до 5 МБ. {variant === "product" ? "Рекомендуем 800×800 px" : ""}</small>
    {value && !creating ? <button type="button" className="admin-image-remove" onClick={() => onChange("")}>♧ Удалить фото</button> : null}
  </div>;
}
