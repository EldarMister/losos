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
  itemId: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
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
  image: string;
  description: string;
  available: boolean;
  sortOrder: number;
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
  address: string;
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
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedDeliveryMinutes: number;
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

export type AdminRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
