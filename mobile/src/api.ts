import type {
  Category,
  CreatedOrder,
  OrderPayload,
  Product,
  Promotion,
  Region,
} from "./types";
import { Platform } from "react-native";

const developmentApiUrl = Platform.OS === "web" && __DEV__ && typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:4000/api`
  : Platform.OS === "android" && __DEV__
    ? "http://10.0.2.2:4000/api"
    : "https://losos-production.up.railway.app/api";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  developmentApiUrl
).replace(/\/$/, "");

export const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL ||
  "https://losos-omega.vercel.app"
).replace(/\/$/, "");

export function resolveImageUrl(source: string) {
  if (/^https?:\/\//i.test(source)) return source;
  return `${WEB_URL}/${source.replace(/^\/+/, "")}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const message = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message;
      throw new Error(message || `Сервер вернул ошибку ${response.status}`);
    }
    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Сервер долго не отвечает. Попробуйте ещё раз.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const catalogApi = {
  categories(regionSlug: string) {
    return request<Category[]>(
      `/categories?region=${encodeURIComponent(regionSlug)}`,
    );
  },
  products(regionSlug: string, search: string) {
    return request<Product[]>(
      `/products?region=${encodeURIComponent(regionSlug)}&search=${encodeURIComponent(search)}`,
    );
  },
  promotions(regionSlug: string) {
    return request<Promotion[]>(
      `/promotions?region=${encodeURIComponent(regionSlug)}`,
    );
  },
  regions() {
    return request<Region[]>("/regions");
  },
};

export type MapsConfig = {
  mapsApiKey: string;
  suggestApiKey: string;
};

export const mapsApi = {
  async config() {
    const mapsHost = Platform.OS === "web" && __DEV__ && typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : WEB_URL;
    try {
      const response = await fetch(`${mapsHost}/api/maps-config`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return { mapsApiKey: "", suggestApiKey: "" };
      }
      const body = await response.json() as Partial<MapsConfig>;
      const mapsApiKey = body.mapsApiKey?.trim() || "";
      const suggestApiKey = body.suggestApiKey?.trim() || mapsApiKey;
      return { mapsApiKey, suggestApiKey };
    } catch {
      return { mapsApiKey: "", suggestApiKey: "" };
    }
  },
};

export const ordersApi = {
  create(payload: OrderPayload) {
    return request<CreatedOrder>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
