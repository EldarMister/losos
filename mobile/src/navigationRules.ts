import type { AuthSession } from "./types";

export function canStartCheckout(session: AuthSession | null, cartCount: number) {
  return Boolean(session && session.expiresAt > Date.now() && cartCount > 0);
}

export function createOrderIdempotencyKey(now = Date.now(), random = Math.random()) {
  return `mobile-${now}-${random.toString(36).slice(2, 10)}`;
}
