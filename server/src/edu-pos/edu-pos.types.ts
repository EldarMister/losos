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
