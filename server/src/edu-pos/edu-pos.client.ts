import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  EduPosCreateOrderPayload,
  EduPosMenuExportPayload,
  EduPosOrder,
  EduPosOrderItem,
} from "./edu-pos.types";

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord => (
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {}
);
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const finite = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const withoutSecret = (message: string, secret: string) => secret
  ? message.split(secret).join("[redacted]")
  : message;

export class EduPosApiError extends Error {
  constructor(
    readonly status: number | null,
    message: string,
    readonly responseBody: unknown = null,
  ) {
    super(message);
    this.name = "EduPosApiError";
  }

  get retryable() {
    return this.status === null || this.status === 429 || (this.status >= 500 && this.status <= 599);
  }
}

@Injectable()
export class EduPosClient {
  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.baseUrl() && this.apiKey());
  }

  async menu(): Promise<unknown> {
    return this.request("/menu", { method: "GET" });
  }

  async stopList(): Promise<unknown> {
    return this.request("/stop-list", { method: "GET" });
  }

  async exportMenu(payload: EduPosMenuExportPayload): Promise<unknown> {
    const configuredPath = this.config.get<string>("EDU_POS_MENU_EXPORT_PATH")?.trim();
    const path = configuredPath || "/menu";
    if (!path.startsWith("/") || path.includes("..")) {
      throw new EduPosApiError(null, "EDU_POS_MENU_EXPORT_PATH must be an absolute API path");
    }
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, Math.max(
      10_000,
      Number(this.config.get("EDU_POS_MENU_EXPORT_TIMEOUT_MS")) || 60_000,
    ));
  }

  async createOrder(payload: EduPosCreateOrderPayload): Promise<EduPosOrder> {
    return this.normalizeOrder(await this.request("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }));
  }

  async order(externalOrderId: string): Promise<EduPosOrder> {
    return this.normalizeOrder(await this.request(`/orders/${encodeURIComponent(externalOrderId)}`, {
      method: "GET",
    }));
  }

  private baseUrl() {
    return this.config.get<string>("EDU_POS_URL")?.replace(/\/+$/, "") ?? "";
  }

  private apiKey() {
    return this.config.get<string>("EDU_POS_API_KEY")?.trim() ?? "";
  }

  private async request(path: string, init: RequestInit, timeoutOverrideMs?: number) {
    const baseUrl = this.baseUrl();
    const apiKey = this.apiKey();
    if (!baseUrl || !apiKey) {
      throw new EduPosApiError(null, "EDU POS integration is not configured");
    }

    const controller = new AbortController();
    const timeoutMs = timeoutOverrideMs
      ?? Math.max(1_000, Number(this.config.get("EDU_POS_TIMEOUT_MS")) || 10_000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
      const responseText = await response.text();
      let body: unknown = null;
      if (responseText) {
        try {
          body = JSON.parse(responseText);
        } catch {
          body = responseText.slice(0, 1_000);
        }
      }
      if (!response.ok) {
        const responseRecord = record(body);
        const responseMessages = Array.isArray(responseRecord.message)
          ? responseRecord.message.filter((entry): entry is string => typeof entry === "string").join(", ")
          : text(responseRecord.message);
        const message = responseMessages || text(responseRecord.error)
          || `EDU POS request failed with status ${response.status}`;
        throw new EduPosApiError(response.status, withoutSecret(message, apiKey), body);
      }
      return body;
    } catch (error) {
      if (error instanceof EduPosApiError) throw error;
      const message = error instanceof Error && error.name === "AbortError"
        ? "EDU POS request timed out"
        : "EDU POS is temporarily unavailable";
      throw new EduPosApiError(null, message);
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeOrder(value: unknown): EduPosOrder {
    const body = record(value);
    const progress = record(body.progress);
    const items = Array.isArray(body.items) ? body.items.map((entry): EduPosOrderItem => {
      const item = record(entry);
      return {
        dishId: text(item.dishId),
        variantId: text(item.variantId) || null,
        name: text(item.name),
        quantity: Math.max(0, Math.trunc(finite(item.quantity))),
        readyQuantity: Math.max(0, Math.trunc(finite(item.readyQuantity))),
        status: text(item.status, "new"),
        rejectReason: text(item.rejectReason) || null,
      };
    }) : [];
    const result: EduPosOrder = {
      id: text(body.id),
      externalOrderId: text(body.externalOrderId),
      orderNumber: text(body.orderNumber),
      status: text(body.status),
      completed: body.completed === true,
      progress: {
        itemsTotal: Math.max(0, Math.trunc(finite(progress.itemsTotal, items.reduce((sum, item) => sum + item.quantity, 0)))),
        itemsReady: Math.max(0, Math.trunc(finite(progress.itemsReady, items.reduce((sum, item) => sum + item.readyQuantity, 0)))),
        itemsRejected: Math.max(0, Math.trunc(finite(progress.itemsRejected, items.filter((item) => item.status === "rejected").reduce((sum, item) => sum + item.quantity, 0)))),
      },
      items,
      createdAt: text(body.createdAt) || null,
      updatedAt: text(body.updatedAt) || null,
    };
    if (!result.id || !result.externalOrderId || !result.status) {
      throw new EduPosApiError(null, "EDU POS returned an invalid order response");
    }
    return result;
  }
}
