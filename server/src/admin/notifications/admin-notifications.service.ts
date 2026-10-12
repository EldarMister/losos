import { BadRequestException, ForbiddenException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Observable } from "rxjs";
import { DataSource } from "typeorm";
import webpush from "web-push";
import { AdminSecurityService } from "../admin-security.service";
import { hasPermission } from "../admin-permissions";
import { isAllowedPushEndpoint, validEventCursor } from "./admin-notification-policy";

type EventRow = { sequence: string; id: string; orderId: string; orderNumber: number; regionSlug: string; createdAt: Date };
type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };
type StreamMessage = { type: string; data: Record<string, unknown>; id?: string };

@Injectable()
export class AdminNotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdminNotificationsService.name);
  private pushTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(private readonly db: DataSource, private readonly security: AdminSecurityService) {}

  get publicKey(): string | null {
    return process.env.ADMIN_VAPID_PUBLIC_KEY && process.env.ADMIN_VAPID_PRIVATE_KEY && process.env.ADMIN_VAPID_SUBJECT
      ? process.env.ADMIN_VAPID_PUBLIC_KEY : null;
  }

  onModuleInit() {
    // A durable API process is required for SSE and push. Every replica can poll:
    // SKIP LOCKED below claims an event in one database transaction.
    const tick = async () => {
      if (this.stopped) return;
      try { if (this.publicKey) await this.deliverPendingPush(); }
      catch { this.logger.warn("Admin push delivery unavailable; will retry"); }
      if (!this.stopped) {
        this.pushTimer = setTimeout(tick, 3000);
        this.pushTimer.unref();
      }
    };
    void tick();
  }

  onModuleDestroy() { this.stopped = true; clearTimeout(this.pushTimer); }

  async authorize(token: string) {
    const staff = await this.security.authenticate(token);
    if (!hasPermission(staff, "orders.view")) throw new ForbiddenException("Нет доступа к уведомлениям о заказах");
    return staff;
  }

  stream(token: string, after?: string): Observable<StreamMessage> {
    return new Observable((subscriber) => {
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let cursor = validEventCursor(after);
      let initialized = false;
      const poll = async () => {
        try {
          await this.authorize(token);
          if (cancelled) return;
          if (!initialized) {
            const [latest] = await this.db.query(`SELECT COALESCE(MAX(sequence), 0)::text AS cursor FROM admin_order_events`);
            // A restored database or a changed API environment can have a lower
            // sequence than the browser saved. Resync now instead of silently
            // ignoring every new order until that stale cursor is reached.
            if (!cursor || BigInt(cursor) > BigInt(latest.cursor)) cursor = latest.cursor;
            // The client reloads the current list/counters on every connection.
            // No old orders are emitted during first login.
            subscriber.next({ type: "sync", id: cursor, data: { cursor } });
            initialized = true;
          }
          const rows: EventRow[] = await this.db.query(`SELECT * FROM admin_order_events
            WHERE sequence > $1 ORDER BY sequence LIMIT 100`, [cursor]);
          for (const event of rows) {
            await this.authorize(token);
            if (cancelled) return;
            cursor = event.sequence;
            subscriber.next({ type: "order.created", id: cursor, data: {
              id: event.id, orderId: event.orderId, orderNumber: event.orderNumber,
              regionSlug: event.regionSlug, createdAt: event.createdAt,
              // Reconnect is for synchronization, never a burst of old sounds.
              audible: new Date(event.createdAt).getTime() > Date.now() - 30_000,
            } });
          }
          // Nest generates transport IDs when id is omitted; that counter is
          // unrelated to outbox sequences and must never become a resume cursor.
          subscriber.next({ type: "heartbeat", id: cursor, data: { at: new Date().toISOString() } });
        } catch (error) {
          const status = error && typeof error === "object" && "getStatus" in error
            ? (error as { getStatus(): number }).getStatus() : 500;
          if (status === 401 || status === 403) {
            subscriber.next({ type: "access-revoked", data: { status } });
            subscriber.complete();
            return;
          }
          subscriber.error(new Error("Notification connection unavailable"));
          return;
        }
        if (!cancelled) timer = setTimeout(poll, 2000);
      };
      void poll();
      return () => { cancelled = true; clearTimeout(timer); };
    });
  }

  async subscribe(token: string, input: SubscriptionInput) {
    const staff = await this.authorize(token);
    if (!this.publicKey) throw new BadRequestException("Системные уведомления ещё не настроены владельцем сервера");
    if (!input || typeof input.endpoint !== "string" || input.endpoint.length > 4096 || !isAllowedPushEndpoint(input.endpoint)
      || !/^[A-Za-z0-9_-]{80,180}$/.test(input.keys?.p256dh ?? "") || !/^[A-Za-z0-9_-]{20,100}$/.test(input.keys?.auth ?? "")) {
      throw new BadRequestException("Некорректная подписка браузера");
    }
    const hash = createHash("sha256").update(input.endpoint).digest("hex");
    await this.db.query(`INSERT INTO admin_push_subscriptions
      ("staffId", "sessionId", "endpointHash", endpoint, p256dh, auth)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT ("endpointHash") DO UPDATE SET "staffId" = EXCLUDED."staffId",
        "sessionId" = EXCLUDED."sessionId", p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, "updatedAt" = now()`,
    [staff.id, staff.sessionId, hash, input.endpoint, input.keys.p256dh, input.keys.auth]);
    return { subscribed: true };
  }

  async unsubscribe(token: string) {
    const staff = await this.security.authenticate(token);
    await this.db.query(`DELETE FROM admin_push_subscriptions WHERE "sessionId" = $1`, [staff.sessionId]);
    return { subscribed: false };
  }

  private async deliverPendingPush() {
    await this.db.transaction(async (manager) => {
      // Expired notifications should never produce a burst after deployment.
      await manager.query(`UPDATE admin_order_events SET "pushProcessedAt" = now()
        WHERE "pushProcessedAt" IS NULL AND "createdAt" < now() - interval '2 minutes'`);
      const events: EventRow[] = await manager.query(`SELECT * FROM admin_order_events
        WHERE "pushProcessedAt" IS NULL ORDER BY sequence LIMIT 5 FOR UPDATE SKIP LOCKED`);
      for (const event of events) {
        const subscriptions: { id: string; staffId: string; sessionId: string; endpoint: string; p256dh: string; auth: string }[] = await manager.query(
          `SELECT p.* FROM admin_push_subscriptions p JOIN admin_sessions s ON s.id = p."sessionId"
          JOIN admin_staff u ON u.id = p."staffId" WHERE u.active = true AND s."expiresAt" > now()`);
        for (const subscription of subscriptions) {
          // Read again immediately before each send: blocked users, logged-out
          // sessions and permissions changed since subscription must be excluded.
          const [staff] = await manager.query(`SELECT u.* FROM admin_staff u JOIN admin_sessions s ON s."staffId" = u.id
            WHERE u.id = $1 AND u.active = true AND s.id = $2 AND s."expiresAt" > now()`, [subscription.staffId, subscription.sessionId]);
          if (!staff || !hasPermission(staff, "orders.view")) continue;
          try {
            await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
              JSON.stringify({ eventId: event.id, orderId: event.orderId, orderNumber: event.orderNumber, title: "Новый заказ · NAKTA", body: `Заказ №${event.orderNumber} ожидает обработки`, url: `/admin?section=orders&order=${encodeURIComponent(event.orderId)}` }),
              { TTL: 60, timeout: 5000, urgency: "high", vapidDetails: {
                publicKey: process.env.ADMIN_VAPID_PUBLIC_KEY!, privateKey: process.env.ADMIN_VAPID_PRIVATE_KEY!, subject: process.env.ADMIN_VAPID_SUBJECT!,
              } });
          } catch (error) {
            const code = (error as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) await manager.query(`DELETE FROM admin_push_subscriptions WHERE id = $1`, [subscription.id]);
            else this.logger.warn(`Push could not be delivered (${code ?? "network"}); SSE remains available`);
          }
        }
        await manager.query(`UPDATE admin_order_events SET "pushProcessedAt" = now() WHERE id = $1`, [event.id]);
      }
    });
  }
}
