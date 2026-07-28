import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { Order } from "./order.entity";

@Injectable()
export class EduPosIntegrationService {
  private readonly logger = new Logger(EduPosIntegrationService.name);

  async forward(order: Order) {
    const apiUrl = process.env.EDU_POS_API_URL?.replace(/\/$/, "");
    const secret = process.env.EDU_POS_INTEGRATION_SECRET;
    if (!apiUrl && !secret) return;
    if (!apiUrl || !secret) {
      throw new ServiceUnavailableException("EDU POS integration is not fully configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${apiUrl}/integrations/naktasushi/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Integration-Secret": secret,
        },
        signal: controller.signal,
        body: JSON.stringify({
          externalId: order.id,
          externalNumber: order.id.slice(0, 8).toUpperCase(),
          regionSlug: order.regionSlug,
          deliveryType: order.deliveryType,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          latitude: order.latitude,
          longitude: order.longitude,
          apartment: order.apartment,
          entrance: order.entrance,
          floor: order.floor,
          intercom: order.intercom,
          comment: order.comment,
          paymentMethod: order.paymentMethod,
          utensilsCount: order.noUtensils ? 0 : order.utensilsCount,
          subtotal: order.subtotal,
          total: order.total,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            modifiers: item.modifierSnapshots.map((modifier) => ({
              groupTitle: modifier.groupTitle,
              itemName: modifier.itemName,
              quantity: modifier.quantity,
            })),
          })),
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        this.logger.error(
          `EDU POS rejected order ${order.id}: ${response.status} ${responseText.slice(0, 300)}`,
        );
        throw new ServiceUnavailableException("Не удалось передать заказ на кухню");
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(`Failed to forward order ${order.id} to EDU POS`, error);
      throw new ServiceUnavailableException("Не удалось передать заказ на кухню");
    } finally {
      clearTimeout(timeout);
    }
  }
}
