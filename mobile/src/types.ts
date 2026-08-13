export type DeliveryType = "delivery" | "pickup";

export type ModifierPriceScope = "per-product" | "per-line";

export type ModifierItem = {
  id: string;
  name: string;
  price: number;
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
  priceScope?: ModifierPriceScope;
  items: ModifierItem[];
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  description?: string;
  composition?: string;
  weight?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  isNew?: boolean;
  available?: boolean;
  naktaCoins?: number;
  modifierGroups?: ModifierGroup[];
};

export type Category = {
  id: number;
  slug: string;
  title: string;
  products: Product[];
};

export type Region = {
  id: number;
  slug: string;
  name: string;
  menuSourceRegionSlug?: string | null;
  promotionSourceRegionSlug?: string | null;
  contactPhone?: string;
  supportPhone?: string;
  supportUrl?: string;
  contactEmail?: string;
  contactAddress?: string;
  pickupAddress?: string;
  pickupYandexUrl?: string;
  pickupWorkingHours?: string;
  pickupLocations?: PickupLocation[];
  deliveryZone?: Array<{ latitude: number; longitude: number }>;
  deliveryOpenTime?: string;
  deliveryCloseTime?: string;
  deliveryIs24Hours?: boolean;
  deliveryWorkingDays?: number[];
  freeDeliveryThreshold?: number;
  deliveryFee?: number;
  estimatedDeliveryMinutes?: number;
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
};

export type PickupLocation = {
  id: number;
  title: string;
  address: string;
  workingHours: string;
  latitude?: number | null;
  longitude?: number | null;
  yandexUrl?: string;
  enabled: boolean;
  sortOrder: number;
};

export type Promotion = {
  id: number;
  title: string;
  image: string;
  cta?: string;
  ctaUrl?: string;
};

export type SelectedModifier = {
  groupId: string;
  groupTitle: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  priceScope: ModifierPriceScope;
};

export type ModifierSelection = Record<string, Record<string, number>>;

export type CartLine = {
  key: string;
  product: Product;
  quantity: number;
  modifiers: SelectedModifier[];
};

export type DeliveryLocation = {
  address: string;
  regionSlug?: string;
  latitude?: number;
  longitude?: number;
  pickupLocationId?: number;
  title?: string;
  workingHours?: string;
  yandexUrl?: string;
};

export type OrderPayload = {
  idempotencyKey: string;
  verificationToken: string;
  regionSlug: string;
  deliveryType: DeliveryType;
  customerName: string;
  phone: string;
  address: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  comment?: string;
  paymentMethod: "cash" | "card";
  utensilsCount: number;
  noUtensils: boolean;
  latitude?: number;
  longitude?: number;
  items: Array<{
    productId: number;
    quantity: number;
    modifiers: Array<{
      groupId: string;
      itemId: string;
      quantity: number;
    }>;
  }>;
};

export type CreatedOrder = {
  id: string;
  orderNumber?: number;
  total: number;
  status: string;
  posStatus?: string | null;
  posSyncStatus?: string;
  posProgress?: PosProgress;
};

export type PosProgress = {
  itemsTotal: number;
  itemsReady: number;
  itemsRejected: number;
};

export type AuthSession = {
  phone: string;
  verificationToken: string;
  expiresAt: number;
};

export type AuthMethods = {
  sms: boolean;
  whatsapp: boolean;
};

export type CodeRequest = {
  verified?: boolean;
  phone?: string;
  verificationToken?: string;
  expiresInSeconds: number;
  retryAfterSeconds?: number;
};

export type WhatsappRequest = {
  challengeId: string;
  pollToken: string;
  phone: string;
  whatsappUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  retryAfterSeconds: number;
};

export type ProfileOrder = {
  id: string;
  orderNumber?: number;
  total: number;
  status: "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";
  deliveryType: DeliveryType;
  createdAt: string;
  address?: string;
  naktaCoins?: number;
  earnedNaktaCoins?: number;
  posStatus?: string | null;
  posSyncStatus?: string;
  posProgress?: PosProgress;
};

export type NaktaCoinTransaction = {
  id: string;
  amount: number;
  createdAt?: string;
  description: string;
  orderId?: string;
};

export type ProfileData = {
  naktaCoins: number;
  currentOrders: ProfileOrder[];
  orderHistory: ProfileOrder[];
  naktaCoinHistory?: NaktaCoinTransaction[];
};

export type ProfileOrderDetail = ProfileOrder & {
  subtotal: number;
  address: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  utensilsCount: number;
  noUtensils: boolean;
  paymentMethod: "cash" | "card";
  externalOrderId?: string | null;
  posOrderNumber?: string | null;
  posStatus?: string | null;
  posSyncStatus?: string;
  posProgress?: PosProgress;
  items: Array<{
    productName: string;
    quantity: number;
    lineTotal: number;
    modifierSnapshots: Array<{ itemName: string; quantity: number }>;
    posStatus?: string | null;
    posReadyQuantity?: number;
    posRejectReason?: string | null;
  }>;
};
