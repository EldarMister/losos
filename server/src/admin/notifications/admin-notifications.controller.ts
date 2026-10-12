import { Body, Controller, Delete, Get, Header, Headers, Post, Query, Sse } from "@nestjs/common";
import { AdminNotificationsService } from "./admin-notifications.service";

function bearer(value?: string) { return value?.startsWith("Bearer ") ? value.slice(7) : ""; }

// Authentication and fresh permissions are checked explicitly by the service,
// including during the lifetime of an established streaming response.
@Controller("admin")
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  @Sse("events")
  @Header("Cache-Control", "no-store")
  @Header("X-Accel-Buffering", "no")
  async events(@Headers("authorization") authorization: string, @Query("after") after?: string) {
    const token = bearer(authorization);
    await this.notifications.authorize(token);
    return this.notifications.stream(token, after);
  }

  @Get("push/config")
  @Header("Cache-Control", "no-store")
  async config(@Headers("authorization") authorization: string) {
    await this.notifications.authorize(bearer(authorization));
    return { publicKey: this.notifications.publicKey };
  }

  @Post("push/subscriptions")
  subscribe(@Headers("authorization") authorization: string, @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.notifications.subscribe(bearer(authorization), body);
  }

  @Delete("push/subscriptions")
  unsubscribe(@Headers("authorization") authorization: string) {
    return this.notifications.unsubscribe(bearer(authorization));
  }
}
