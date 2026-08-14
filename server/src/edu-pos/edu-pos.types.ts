export type EduPosOrderItemPayload = {
  dishId: string;
  variantId?: string;
  quantity: number;
  weightGrams?: number;
  comment?: string;
};
export type EduPosCreateOrderPayload = {
  externalOrderId: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  comment?: string;
  items: EduPosOrderItemPayload[];
};

export type EduPosOrderItem = {
  dishId: string;
  variantId: string | null;
  name: string;
  quantity: number;
  readyQuantity: number;
  status: string;
  rejectReason: string | null;
};

export type EduPosOrder = {
  id: string;
  externalOrderId: string;
  orderNumber: string;
  status: string;
  completed: boolean;
  progress: {
    itemsTotal: number;
    itemsReady: number;
    itemsRejected: number;
  };
  items: EduPosOrderItem[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type EduPosMenuVariant = {
  id: string;
  price: number | null;
  originalPrice: number | null;
  isAvailable: boolean;
};

export type EduPosMenuDish = {
  id: string;
  name: string;
  price: number | null;
  originalPrice: number | null;
  isAvailable: boolean;
  soldByWeight: boolean;
  variants: EduPosMenuVariant[];
};

export type EduPosMenuExportModifierItem = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  maxQuantity: number | null;
};

export type EduPosMenuExportModifierGroup = {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  required: boolean;
  minSelections: number;
  maxSelections: number | null;
  priceScope: "per-product" | "per-line";
  items: EduPosMenuExportModifierItem[];
};

export type EduPosMenuExportProduct = {
  id: string;
  sourceId: number;
  slug: string;
  name: string;
  description: string;
  composition: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  available: boolean;
  soldByWeight: boolean;
  weightGrams: number | null;
  sortOrder: number;
  modifiers: EduPosMenuExportModifierGroup[];
};

export type EduPosMenuExportCategory = {
  id: string;
  sourceId: number;
  slug: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  products: EduPosMenuExportProduct[];
};

export type EduPosMenuExportPayload = {
  source: "nakta-sushi";
  regionSlug: string;
  menuSourceRegionSlug: string;
  exportedAt: string;
  categories: EduPosMenuExportCategory[];
};
