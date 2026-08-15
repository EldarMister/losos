import type {
  AuthMethods,
  AuthSession,
  Category,
  CodeRequest,
  CreatedOrder,
  OrderPayload,
  ProfileData,
  AccountNft,
  ProfileOrderDetail,
  Product,
  Promotion,
  Region,
  WhatsappRequest,
} from "./types";
import { Platform } from "react-native";

const developmentApiUrl = Platform.OS === "web" && __DEV__ && typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}:4000/api`
  : "https://losos-production.up.railway.app/api";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  developmentApiUrl
).replace(/\/$/, "");

export const WEB_URL = (
  process.env.EXPO_PUBLIC_WEB_URL ||
  "https://naktasushi.com"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function resolveImageUrl(source: string) {
  if (/^(?:https?:\/\/|data:|file:)/i.test(source)) return source;
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
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const errorBody = body && typeof body === "object"
        ? body as { message?: unknown; retryAfterSeconds?: unknown }
        : null;
      const message = Array.isArray(errorBody?.message)
        ? errorBody.message.filter((item): item is string => typeof item === "string").join(", ")
        : typeof errorBody?.message === "string" ? errorBody.message : "";
      const retryAfterSeconds = typeof errorBody?.retryAfterSeconds === "number"
        ? errorBody.retryAfterSeconds
        : undefined;
      throw new ApiError(
        message || `Сервер вернул ошибку ${response.status}`,
        response.status,
        retryAfterSeconds,
      );
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
  geocoderUrl?: string;
};

let cachedMapsConfig: MapsConfig | null = null;

export const mapsApi = {
  async config() {
    const buildMapsApiKey =
      process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY?.trim() || "";
    const buildSuggestApiKey =
      process.env.EXPO_PUBLIC_YANDEX_SUGGEST_API_KEY?.trim()
      || buildMapsApiKey;
    const mapsHost = Platform.OS === "web" && __DEV__ && typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : WEB_URL;
    const buildConfig: MapsConfig = {
      mapsApiKey: buildMapsApiKey,
      suggestApiKey: buildSuggestApiKey,
      geocoderUrl: `${mapsHost}/api/geocode`,
    };
    if (cachedMapsConfig) return cachedMapsConfig;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${mapsHost}/api/maps-config`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return buildConfig;
      }
      const body = await response.json() as Partial<MapsConfig>;
      const mapsApiKey = body.mapsApiKey?.trim() || "";
      const suggestApiKey = body.suggestApiKey?.trim() || mapsApiKey;
      const config = {
        mapsApiKey,
        suggestApiKey,
        geocoderUrl: `${mapsHost}/api/geocode`,
      };
      if (mapsApiKey) cachedMapsConfig = config;
      return mapsApiKey ? config : buildConfig;
    } catch {
      return buildConfig;
    } finally {
      clearTimeout(timeout);
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

const sessionHeaders = (session: AuthSession) => ({
  Authorization: `Bearer ${session.verificationToken}`,
});

export const authApi = {
  methods() {
    return request<AuthMethods>("/auth/methods");
  },
  requestCode(phone: string, captchaToken: string) {
    return request<CodeRequest>("/auth/request-code", {
      method: "POST",
      body: JSON.stringify({ phone, captchaToken }),
    });
  },
  verifyCode(phone: string, code: string) {
    return request<{ phone: string; verificationToken: string; expiresInSeconds: number }>(
      "/auth/verify-code",
      {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      },
    );
  },
  requestWhatsapp(phone: string) {
    return request<WhatsappRequest>("/auth/whatsapp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  whatsappStatus(challengeId: string, pollToken: string) {
    return request<
      | { status: "pending"; expiresAt: string }
      | { status: "expired" }
      | { status: "verified"; phone: string; verificationToken: string; expiresInSeconds: number }
    >("/auth/whatsapp/status", {
      method: "POST",
      body: JSON.stringify({ challengeId, pollToken }),
    });
  },
  profile(session: AuthSession) {
    return request<ProfileData>(
      `/auth/profile?phone=${encodeURIComponent(session.phone)}`,
      { headers: sessionHeaders(session) },
    );
  },
  order(session: AuthSession, orderId: string) {
    return request<ProfileOrderDetail>(
      `/auth/orders/${encodeURIComponent(orderId)}?phone=${encodeURIComponent(session.phone)}`,
      { headers: sessionHeaders(session) },
    );
  },
  cancelOrder(session: AuthSession, orderId: string) {
    return request<{ id: string; status: "cancelled" }>(
      `/auth/orders/${encodeURIComponent(orderId)}/cancel?phone=${encodeURIComponent(session.phone)}`,
      {
        method: "POST",
        headers: sessionHeaders(session),
      },
    );
  },
  deleteAccount(session: AuthSession) {
    return request<{ deleted: boolean }>(
      `/auth/account?phone=${encodeURIComponent(session.phone)}`,
      {
        method: "DELETE",
        headers: sessionHeaders(session),
      },
    );
  },
  withdrawNft(session: AuthSession, nftId: string, walletAddress: string) {
    return request<AccountNft>(
      `/auth/nfts/${encodeURIComponent(nftId)}/withdraw?phone=${encodeURIComponent(session.phone)}`,
      {
        method: "POST",
        headers: sessionHeaders(session),
        body: JSON.stringify({ walletAddress }),
      },
    );
  },
  registerPushToken(
    session: AuthSession,
    input: {
      deviceId: string;
      expoPushToken: string;
      platform: "android" | "ios";
    },
  ) {
    return request<{ deviceId: string; registered: boolean }>("/auth/push-tokens", {
      method: "POST",
      headers: sessionHeaders(session),
      body: JSON.stringify({ ...input, phone: session.phone }),
    });
  },
  removePushToken(session: AuthSession, deviceId: string) {
    return request<{ removed: boolean }>(
      `/auth/push-tokens/${encodeURIComponent(deviceId)}?phone=${encodeURIComponent(session.phone)}`,
      {
        method: "DELETE",
        headers: sessionHeaders(session),
      },
    );
  },
};
