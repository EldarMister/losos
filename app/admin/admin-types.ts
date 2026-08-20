export type AdminSection =
  | "orders"
  | "analytics"
  | "menu"
  | "categories"
  | "users"
  | "finance"
  | "promotions"
  | "settings";

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export type OrderModifier = {
  groupId?: string;
  groupTitle?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  priceScope?: "per-product" | "per-line";
};

export type OrderKitItem = {
  id: string;
  name: string;
  quantity: number;
};

export type OrderItem = {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifierSnapshots?: OrderModifier[];
};

export type AdminOrder = {
  id: string;
  orderNumber: number;
  regionSlug: string;
  deliveryType: "delivery" | "pickup";
  customerName: string;
  phone: string;
  address: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  utensilsCount: number;
  noUtensils: boolean;
  kitItems?: OrderKitItem[];
  paymentMethod: "cash" | "card" | "online";
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  posStatus?: string | null;
  posLastError?: string;
  items: OrderItem[];
};

export type OrdersResponse = {
  items: AdminOrder[];
  total: number;
  limit: number;
  offset: number;
  statusCounts: Partial<Record<OrderStatus, number>>;
};

export type Product = {
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
  sortOrder: number;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type ModifierItem = {
  id: string;
  name: string;
  price: number;
  naktaCoins?: number;
  image: string;
  enabled?: boolean;
  maxQuantity?: number;
};

export type ModifierGroup = {
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

export type Category = {
  id: number;
  title: string;
  slug: string;
  image: string;
  sortOrder: number;
  products: Product[];
};

export type Promotion = {
  id: number;
  title: string;
  image: string;
  cta: string;
  ctaUrl: string;
  enabled: boolean;
  sortOrder: number;
};

export type PickupLocation = {
  id: number;
  title: string;
  address: string;
  workingHours: string;
  latitude: number | null;
  longitude: number | null;
  yandexUrl: string;
  enabled: boolean;
  sortOrder: number;
};

export type DeliveryZonePoint = {
  latitude: number;
  longitude: number;
};

export type Region = {
  id: number;
  slug: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
  contactPhone: string;
  supportPhone: string;
  deliveryOpenTime: string;
  deliveryCloseTime: string;
  deliveryIs24Hours: boolean;
  deliveryWorkingDays: number[];
  freeDeliveryThreshold: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  maximumOrderAmount: number;
  estimatedDeliveryMinutes: number;
  deliveryZone: DeliveryZonePoint[];
  nftRewardEveryOrders: number;
  nftRewardName: string;
  nftRewardImage: string;
  nftRewardDescription: string;
  nftRewardNetwork: string;
  nftContractAddress: string;
  nftMetadataUri: string;
  pickupLocations?: PickupLocation[];
};

export type Dashboard = {
  region: Region;
  menuRegionSlug: string;
  promotionRegionSlug: string;
  categories: Category[];
  promotions: Promotion[];
};

export type Analytics = {
  orders: number;
  revenue: number;
  average: number;
  products: Array<{ name: string; count: number; revenue: number }>;
};

export type Customer = {
  phone: string;
  customerName: string;
  ordersCount: number;
  completedOrders: number;
  revenue: number;
  lastOrderAt: string;
};

export type CoinWithdrawalStatus = "pending" | "submitted" | "withdrawn" | "failed";

export type CoinWithdrawal = {
  id: string;
  phone: string;
  regionSlug: string;
  amount: number;
  walletAddress: string;
  status: CoinWithdrawalStatus;
  txHash: string | null;
  error: string | null;
  createdAt: string;
};

export type NftWithdrawalStatus = "owned" | "pending" | "submitted" | "withdrawn" | "failed";

export type NftWithdrawal = {
  id: string;
  phone: string;
  regionSlug: string;
  rewardKey: string;
  orderId: string;
  milestoneOrderCount: number;
  name: string;
  image: string;
  description: string;
  network: string;
  contractAddress: string;
  metadataUri: string;
  tokenId: string | null;
  status: NftWithdrawalStatus;
  walletAddress: string | null;
  txHash: string | null;
  withdrawalError: string | null;
  withdrawalRequestedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
