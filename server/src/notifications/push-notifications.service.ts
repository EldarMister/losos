import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DevicePushToken } from "../auth/device-push-token.entity";
import { OrderStatus } from "../orders/order.enums";

type ExpoPushTicket = {
  status?: "ok" | "error";
  details?: { error?: string };
};

export type RewardWithdrawalPushInput = {
  withdrawalId: string;
  asset: "coin" | "nft";
  status: "submitted" | "withdrawn" | "failed";
  amount?: number;
  name?: string;
  reason?: string | null;
};

const statusCopy: Record<OrderStatus, { title: string; body: string }> = {
  [OrderStatus.NEW]: {
    title: "Заказ принят",
    body: "Мы получили заказ и скоро подтвердим его.",
  },
  [OrderStatus.CONFIRMED]: {
    title: "Заказ подтверждён",
    body: "Кухня уже видит ваш заказ.",
  },
  [OrderStatus.PREPARING]: {
    title: "Начали готовить",
    body: "Ваш заказ готовится.",
  },
  [OrderStatus.READY]: {
    title: "Заказ готов",
    body: "Можно забирать заказ или ждать курьера.",
  },
  [OrderStatus.DELIVERING]: {
    title: "Заказ в пути",
    body: "Курьер уже направляется к вам.",
  },
  [OrderStatus.COMPLETED]: {
    title: "Приятного аппетита!",
    body: "Заказ завершён. Спасибо, что выбрали Накта суши.",
  },
  [OrderStatus.CANCELLED]: {
    title: "Заказ отменён",
    body: "Откройте приложение, чтобы посмотреть детали.",
  },
};

@Injectable()
export class PushNotificationsService {
  constructor(
    @InjectRepository(DevicePushToken)
    private readonly tokens: Repository<DevicePushToken>,
  ) {}

  async register(input: {
    phone: string;
    deviceId: string;
    expoPushToken: string;
    platform: "android" | "ios";
  }) {
    const byDevice = await this.tokens.findOneBy({ deviceId: input.deviceId });
    const byToken = byDevice
      ? null
      : await this.tokens.findOneBy({ expoPushToken: input.expoPushToken });
    const entity = byDevice ?? byToken ?? this.tokens.create();
    Object.assign(entity, input, {
      enabled: true,
      lastSeenAt: new Date(),
    });
    return this.tokens.save(entity);
  }

  async remove(phone: string, deviceId: string) {
    await this.tokens.delete({ phone, deviceId });
    return { removed: true };
  }

  async sendOrderStatus(
    phone: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const copy = statusCopy[status];
    return this.send(phone, {
      sound: "default",
      title: copy.title,
      body: copy.body,
      data: {
        orderId,
        status,
        url: `naktasushi://orders/${orderId}`,
      },
      channelId: "orders",
    });
  }

  async sendRewardWithdrawalStatus(phone: string, input: RewardWithdrawalPushInput) {
    const asset = input.asset === "coin"
      ? `${input.amount ?? ""} NAKTA Coin`.trim()
      : input.name?.trim() || "NFT";
    const copy = input.status === "submitted"
      ? { title: "Вывод одобрен", body: `${asset}: перевод отправлен на ваш кошелёк.` }
      : input.status === "withdrawn"
        ? { title: "Вывод выполнен", body: `${asset} успешно выведен на ваш кошелёк.` }
        : {
          title: "Вывод отменён",
          body: `${asset} возвращён в ваш баланс.${input.reason?.trim() ? ` Причина: ${input.reason.trim()}` : ""}`,
        };

    return this.send(phone, {
      sound: "default",
      title: copy.title,
      body: copy.body,
      data: {
        type: "reward-withdrawal",
        withdrawalId: input.withdrawalId,
        asset: input.asset,
        status: input.status,
        url: "naktasushi://profile/balance",
      },
      channelId: "orders",
    });
  }

  private async send(
    phone: string,
    content: {
      sound: string;
      title: string;
      body: string;
      data: Record<string, string>;
      channelId: string;
    },
  ) {
    const devices = await this.tokens.find({
      where: { phone, enabled: true },
      order: { updatedAt: "DESC" },
    });
    if (!devices.length) return;

    const messages = devices.map((device) => ({
      to: device.expoPushToken,
      ...content,
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error("Expo push request failed", { status: response.status });
        return;
      }
      const body = await response.json() as { data?: ExpoPushTicket[] };
      const invalidIds = devices
        .filter((_, index) => body.data?.[index]?.details?.error === "DeviceNotRegistered")
        .map((device) => device.id);
      if (invalidIds.length) {
        await this.tokens.delete(invalidIds);
      }
    } catch (error) {
      console.error("Expo push delivery failed", error);
    }
  }
}
