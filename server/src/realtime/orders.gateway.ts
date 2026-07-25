import { Logger } from "@nestjs/common";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { timingSafeEqual } from "node:crypto";
import type { Server, Socket } from "socket.io";
import type { Order } from "../orders/order.entity";

const adminRoom = "admin";
const trustedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://losos-omega.vercel.app",
  "https://mnogolososya-react-copy.azizbek1996.chatgpt.site",
];

/**
 * Sends a small, non-sensitive invalidation event to authorised admin tabs.
 * The tab then asks the normal guarded HTTP API for its current page of data.
 */
@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_ORIGIN ?? "").split(",").map((item) => item.trim()).filter(Boolean).concat(trustedOrigins),
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  handleConnection(client: Socket) {
    const expected = process.env.ADMIN_TOKEN ?? "";
    const supplied = String(client.handshake.auth?.token ?? "");
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);
    if (!expected || expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      client.disconnect(true);
      return;
    }
    client.join(adminRoom);
  }

  orderCreated(order: Pick<Order, "id" | "regionSlug" | "updatedAt">) {
    this.emit("created", order);
  }

  orderUpdated(order: Pick<Order, "id" | "regionSlug" | "updatedAt">) {
    this.emit("updated", order);
  }

  private emit(type: "created" | "updated", order: Pick<Order, "id" | "regionSlug" | "updatedAt">) {
    if (!this.server) {
      this.logger.warn("Socket server is not ready; order event was skipped");
      return;
    }
    this.server.to(adminRoom).emit("orders:changed", {
      type,
      id: order.id,
      regionSlug: order.regionSlug,
      updatedAt: order.updatedAt.toISOString(),
    });
  }
}
