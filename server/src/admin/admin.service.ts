import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../catalog/category.entity";
import {
  assertValidModifierGroups,
  ModifierCatalogValidationError,
} from "../catalog/modifier-validation";
import { Product } from "../catalog/product.entity";
import { Promotion } from "../catalog/promotion.entity";
import { Region } from "../catalog/region.entity";
import { regionContentSourceSlug, type RegionContentSourceField } from "../catalog/region-content-source";
import { PickupLocation } from "../catalog/pickup-location.entity";
import { resolvePickupMapLink } from "../catalog/pickup-map-link";
import { OrderItem } from "../orders/order-item.entity";
import { Order } from "../orders/order.entity";
import { canTransitionOrderStatus, OrderStatus } from "../orders/order.enums";
import { normalizeOrderKitItems } from "../orders/order-kit";
import { PhoneAccount } from "../auth/phone-account.entity";
import { AccountNft } from "../rewards/account-nft.entity";
import { NaktaCoinTransaction } from "../rewards/nakta-coin-transaction.entity";
import { NaktaCoinWithdrawal } from "../rewards/nakta-coin-withdrawal.entity";
import { calculateOrderRewards, isNftMilestone } from "../rewards/reward-calculation";
import {
  type AdminAnalyticsPeriod,
  type AdminNftWithdrawalStatus,
  ListOrdersQueryDto,
  UpdateOrderKitDto,
} from "./admin-orders.dto";
import { PushNotificationsService } from "../notifications/push-notifications.service";
import { dispatchOrderStatusPush } from "./order-status-notifier";
import { EduPosService } from "../edu-pos/edu-pos.service";
import { shouldSubmitOrderToEduPosAfterAdminTransition } from "../edu-pos/edu-pos.policy";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  CreateRegionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
  UpdateRegionDto,
  CreatePickupLocationDto,
  UpdatePickupLocationDto,
  UpdateNftWithdrawalDto,
  UpdateNaktaCoinWithdrawalDto,
} from "./admin.dto";

export type AdminStatisticsData = {
  orders: number;
  revenue: number;
  average: number;
  products: Array<{ name: string; count: number; revenue: number }>;
  payments: Array<{ name: string; amount: number }>;
  peaks: Array<{ label: string; amount: number }>;
  statuses: Array<{ name: string; count: number }>;
  chart: Array<{ label: string; amount: number }>;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Region) private readonly regions: Repository<Region>,
    @InjectRepository(PickupLocation)
    private readonly pickupLocations: Repository<PickupLocation>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Promotion) private readonly promotions: Repository<Promotion>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(AccountNft) private readonly nftRepository: Repository<AccountNft>,
    @InjectRepository(NaktaCoinTransaction)
    private readonly coinTransactionRepository: Repository<NaktaCoinTransaction>,
    @InjectRepository(NaktaCoinWithdrawal)
    private readonly coinWithdrawalRepository: Repository<NaktaCoinWithdrawal>,
    private readonly pushNotifications: PushNotificationsService,
    private readonly eduPos: EduPosService,
    private readonly config: ConfigService,
  ) {}

  async dashboard(regionSlug: string) {
    const region = await this.requireRegion(regionSlug);
    const menuRegion = await this.contentSource(region, "menuSourceRegionSlug");
    const promotionRegion = await this.contentSource(region, "promotionSourceRegionSlug");
    const [categories, promotions] = await Promise.all([
      this.categories.find({
        where: { region: { id: menuRegion.id } },
        relations: { products: true },
        order: { sortOrder: "ASC", products: { sortOrder: "ASC", id: "ASC" } },
      }),
      this.promotions.find({
        where: { region: { id: promotionRegion.id } },
        order: { sortOrder: "ASC", id: "ASC" },
      }),
    ]);
    const pickupLocations = await this.pickupLocations.find({
      where: { region: { id: region.id } },
      order: { sortOrder: "ASC", id: "ASC" },
    });
    return {
      region: { ...region, pickupLocations },
      menuRegionSlug: menuRegion.slug,
      promotionRegionSlug: promotionRegion.slug,
      categories,
      promotions,
    };
  }

  settings() {
    return this.regions.find({
      relations: { pickupLocations: true },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  async analytics(
    regionSlug: string,
    period: AdminAnalyticsPeriod,
  ): Promise<AdminStatisticsData> {
    await this.requireRegion(regionSlug);
    const [row] = await this.orderRepository.query(`
      WITH parameters AS (
        SELECT
          $1::varchar AS "regionSlug",
          $2::varchar AS "period",
          timezone('Asia/Bishkek', CURRENT_TIMESTAMP) AS "nowLocal"
      ),
      bounds AS (
        SELECT
          parameters.*,
          CASE parameters."period"
            WHEN 'today' THEN date_trunc('day', parameters."nowLocal")
            WHEN 'week' THEN date_trunc('day', parameters."nowLocal") - interval '6 days'
            WHEN 'month' THEN date_trunc('day', parameters."nowLocal") - interval '29 days'
            ELSE '-infinity'::timestamp
          END AS "startLocal",
          CASE parameters."period"
            WHEN 'all' THEN date_trunc('month', parameters."nowLocal") + interval '1 month'
            ELSE date_trunc('day', parameters."nowLocal") + interval '1 day'
          END AS "endLocal"
        FROM parameters
      ),
      scoped_orders AS (
        SELECT
          orders.*,
          COALESCE(
            orders."completedAt" AT TIME ZONE 'Asia/Bishkek',
            (orders."updatedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bishkek',
            (orders."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Bishkek'
          ) AS "eventLocal"
        FROM "orders" orders
        CROSS JOIN bounds
        WHERE orders."regionSlug" = bounds."regionSlug"
      ),
      period_orders AS (
        SELECT scoped_orders.*
        FROM scoped_orders
        CROSS JOIN bounds
        WHERE scoped_orders."eventLocal" >= bounds."startLocal"
          AND scoped_orders."eventLocal" < bounds."endLocal"
      ),
      completed_orders AS (
        SELECT *
        FROM period_orders
        WHERE "status" = 'completed'
      ),
      metrics AS (
        SELECT
          COUNT(*)::int AS "orders",
          COALESCE(SUM("total"), 0)::numeric AS "revenue",
          COALESCE(AVG("total"), 0)::numeric AS "average"
        FROM completed_orders
      ),
      product_aggregates AS (
        SELECT
          items."productName" AS "name",
          SUM(items."quantity")::int AS "count",
          SUM(items."lineTotal")::numeric AS "revenue"
        FROM completed_orders orders
        INNER JOIN "order_items" items ON items."orderId" = orders."id"
        GROUP BY items."productName"
      ),
      product_rows AS (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object('name', "name", 'count', "count", 'revenue', "revenue")
          ORDER BY "revenue" DESC, "count" DESC, "name" ASC
        ), '[]'::jsonb) AS "value"
        FROM product_aggregates
      ),
      payment_aggregates AS (
        SELECT
          CASE "paymentMethod"
            WHEN 'cash' THEN 'Наличные'
            WHEN 'card' THEN 'Картой'
            WHEN 'online' THEN 'Онлайн'
            ELSE "paymentMethod"
          END AS "name",
          SUM("total")::numeric AS "amount"
        FROM completed_orders
        GROUP BY "paymentMethod"
      ),
      payment_rows AS (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object('name', "name", 'amount', "amount")
          ORDER BY "amount" DESC, "name" ASC
        ), '[]'::jsonb) AS "value"
        FROM payment_aggregates
      ),
      peak_aggregates AS (
        SELECT
          EXTRACT(HOUR FROM "eventLocal")::int AS "hour",
          SUM("total")::numeric AS "amount"
        FROM completed_orders
        GROUP BY EXTRACT(HOUR FROM "eventLocal")
      ),
      peak_rows AS (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'label', lpad("hour"::text, 2, '0') || ':00 – '
              || lpad((("hour" + 1) % 24)::text, 2, '0') || ':00',
            'amount', "amount"
          )
          ORDER BY "amount" DESC, "hour" ASC
        ), '[]'::jsonb) AS "value"
        FROM peak_aggregates
      ),
      status_aggregates AS (
        SELECT
          "status",
          CASE "status"
            WHEN 'new' THEN 'Новый'
            WHEN 'confirmed' THEN 'Подтверждён'
            WHEN 'preparing' THEN 'Готовится'
            WHEN 'ready' THEN 'Готов'
            WHEN 'delivering' THEN 'В пути'
            WHEN 'completed' THEN 'Завершён'
            WHEN 'cancelled' THEN 'Отменён'
            ELSE "status"
          END AS "name",
          COUNT(*)::int AS "count"
        FROM period_orders
        GROUP BY "status"
      ),
      status_rows AS (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object('name', "name", 'count', "count")
          ORDER BY "count" DESC, "status" ASC
        ), '[]'::jsonb) AS "value"
        FROM status_aggregates
      ),
      all_chart_start AS (
        SELECT COALESCE(
          MIN(date_trunc('month', completed_orders."eventLocal")),
          (SELECT date_trunc('month', bounds."nowLocal") FROM bounds)
        ) AS "value"
        FROM completed_orders
      ),
      chart_buckets AS (
        SELECT
          bucket AS "startLocal",
          interval '4 hours' AS "bucketSize",
          to_char(bucket, 'HH24:MI') AS "label"
        FROM bounds
        CROSS JOIN LATERAL generate_series(
          date_trunc('day', bounds."nowLocal"),
          date_trunc('day', bounds."nowLocal") + interval '20 hours',
          interval '4 hours'
        ) bucket
        WHERE bounds."period" = 'today'

        UNION ALL

        SELECT
          bucket,
          interval '1 day',
          to_char(bucket, 'YYYY-MM-DD')
        FROM bounds
        CROSS JOIN LATERAL generate_series(
          bounds."startLocal",
          bounds."endLocal" - interval '1 day',
          interval '1 day'
        ) bucket
        WHERE bounds."period" IN ('week', 'month')

        UNION ALL

        SELECT
          bucket,
          interval '1 month',
          to_char(bucket, 'YYYY-MM-DD')
        FROM bounds
        CROSS JOIN all_chart_start
        CROSS JOIN LATERAL generate_series(
          all_chart_start."value",
          date_trunc('month', bounds."nowLocal"),
          interval '1 month'
        ) bucket
        WHERE bounds."period" = 'all'
      ),
      chart_aggregates AS (
        SELECT
          chart_buckets."startLocal",
          chart_buckets."label",
          COALESCE(SUM(completed_orders."total"), 0)::numeric AS "amount"
        FROM chart_buckets
        LEFT JOIN completed_orders
          ON completed_orders."eventLocal" >= chart_buckets."startLocal"
          AND completed_orders."eventLocal" < chart_buckets."startLocal" + chart_buckets."bucketSize"
        GROUP BY chart_buckets."startLocal", chart_buckets."label"
      ),
      chart_rows AS (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object('label', "label", 'amount', "amount")
          ORDER BY "startLocal" ASC
        ), '[]'::jsonb) AS "value"
        FROM chart_aggregates
      )
      SELECT jsonb_build_object(
        'orders', metrics."orders",
        'revenue', metrics."revenue",
        'average', metrics."average",
        'products', product_rows."value",
        'payments', payment_rows."value",
        'peaks', peak_rows."value",
        'statuses', status_rows."value",
        'chart', chart_rows."value"
      ) AS "data"
      FROM metrics
      CROSS JOIN product_rows
      CROSS JOIN payment_rows
      CROSS JOIN peak_rows
      CROSS JOIN status_rows
      CROSS JOIN chart_rows
    `, [regionSlug, period]) as Array<{ data: AdminStatisticsData | string }>;

    const data = typeof row?.data === "string" ? JSON.parse(row.data) as AdminStatisticsData : row?.data;
    return {
      orders: Number(data?.orders || 0),
      revenue: Number(data?.revenue || 0),
      average: Number(data?.average || 0),
      products: (data?.products || []).map((item) => ({
        name: String(item.name),
        count: Number(item.count),
        revenue: Number(item.revenue),
      })),
      payments: (data?.payments || []).map((item) => ({
        name: String(item.name),
        amount: Number(item.amount),
      })),
      peaks: (data?.peaks || []).map((item) => ({
        label: String(item.label),
        amount: Number(item.amount),
      })),
      statuses: (data?.statuses || []).map((item) => ({
        name: String(item.name),
        count: Number(item.count),
      })),
      chart: (data?.chart || []).map((item) => ({
        label: String(item.label),
        amount: Number(item.amount),
      })),
    };
  }

  async loyaltyOverview(regionSlug: string) {
    const region = await this.requireRegion(regionSlug);
    const menuRegion = await this.contentSource(region, "menuSourceRegionSlug");
    const [productMetrics, coinMetrics, nftCounts] = await Promise.all([
      this.products.createQueryBuilder("product")
        .innerJoin("product.category", "category")
        .select("COUNT(*) FILTER (WHERE product.\"naktaCoins\" > 0)", "rewardedProducts")
        .addSelect("COALESCE(SUM(product.\"naktaCoins\"), 0)", "coinsPerFullMenu")
        .where("category.\"regionId\" = :regionId", { regionId: menuRegion.id })
        .getRawOne<{ rewardedProducts: string; coinsPerFullMenu: string }>(),
      this.coinTransactionRepository.createQueryBuilder("coin_transaction")
        .select("COALESCE(SUM(coin_transaction.amount), 0)", "issuedCoins")
        .addSelect("COUNT(*)", "transactions")
        .where('coin_transaction."regionSlug" = :regionSlug', { regionSlug })
        .getRawOne<{ issuedCoins: string; transactions: string }>(),
      this.nftRepository.createQueryBuilder("nft")
        .select("nft.status", "status")
        .addSelect("COUNT(*)", "count")
        .where("nft.\"regionSlug\" = :regionSlug", { regionSlug })
        .groupBy("nft.status")
        .getRawMany<{ status: AdminNftWithdrawalStatus; count: string }>(),
    ]);
    const statuses = Object.fromEntries(
      nftCounts.map((entry) => [entry.status, Number(entry.count)]),
    ) as Partial<Record<AdminNftWithdrawalStatus, number>>;
    return {
      program: {
        enabled: region.nftRewardEveryOrders > 0,
        everyOrders: region.nftRewardEveryOrders,
        name: region.nftRewardName,
        image: region.nftRewardImage,
        description: region.nftRewardDescription,
        network: region.nftRewardNetwork,
        contractAddress: region.nftContractAddress,
        metadataUri: region.nftMetadataUri,
      },
      metrics: {
        rewardedProducts: Number(productMetrics?.rewardedProducts || 0),
        coinsPerFullMenu: Number(productMetrics?.coinsPerFullMenu || 0),
        issuedCoins: Number(coinMetrics?.issuedCoins || 0),
        coinTransactions: Number(coinMetrics?.transactions || 0),
        nftsTotal: Object.values(statuses).reduce((sum, count) => sum + (count ?? 0), 0),
        nftStatuses: statuses,
      },
      transferProviderConfigured: Boolean(
        this.config.get<string>("NFT_TRANSFER_WEBHOOK_URL")?.trim(),
      ),
    };
  }

  async customers(regionSlug: string, search: string, requestedLimit: number, requestedOffset: number) {
    await this.requireRegion(regionSlug);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;
    const offset = Number.isInteger(requestedOffset) ? Math.max(requestedOffset, 0) : 0;
    const pattern = `%${search.trim()}%`;
    const rows = await this.orderRepository.query(`
      WITH matched_phones AS (
        SELECT DISTINCT matched."phone"
        FROM "orders" matched
        WHERE matched."regionSlug" = $1
          AND ($2 = '%%' OR matched."phone" ILIKE $2 OR matched."customerName" ILIKE $2)
      )
      SELECT
        orders."phone",
        (array_agg(orders."customerName" ORDER BY orders."createdAt" DESC))[1] AS "customerName",
        COUNT(*)::bigint AS "ordersCount",
        COUNT(*) FILTER (WHERE orders."status" = $5)::bigint AS "completedOrders",
        COALESCE(SUM(orders."total") FILTER (WHERE orders."status" = $5), 0)::bigint AS "revenue",
        MAX(orders."createdAt") AS "lastOrderAt",
        COALESCE(account."naktaCoins", 0)::int AS "naktaCoins",
        COALESCE(nfts."nftCount", 0)::bigint AS "nftCount",
        COALESCE(nfts."pendingCount", 0)::bigint AS "pendingNftCount"
      FROM "orders" orders
      INNER JOIN matched_phones ON matched_phones."phone" = orders."phone"
      LEFT JOIN "phone_accounts" account ON account."phone" = orders."phone"
      LEFT JOIN (
        SELECT "phone", COUNT(*)::bigint AS "nftCount",
          COUNT(*) FILTER (WHERE "status" IN ('pending', 'submitted'))::bigint AS "pendingCount"
        FROM "account_nfts"
        WHERE "regionSlug" = $1
        GROUP BY "phone"
      ) nfts ON nfts."phone" = orders."phone"
      WHERE orders."regionSlug" = $1
      GROUP BY orders."phone", account."naktaCoins", nfts."nftCount", nfts."pendingCount"
      ORDER BY MAX(orders."createdAt") DESC
      LIMIT $3 OFFSET $4
    `, [regionSlug, pattern, limit, offset, OrderStatus.COMPLETED]) as Array<Record<string, unknown>>;
    const [{ total = 0 } = {}] = await this.orderRepository.query(`
      SELECT COUNT(DISTINCT orders."phone")::int AS "total"
      FROM "orders" orders
      WHERE orders."regionSlug" = $1
        AND ($2 = '%%' OR orders."phone" ILIKE $2 OR orders."customerName" ILIKE $2)
    `, [regionSlug, pattern]) as Array<{ total: number }>;
    const items = rows.map((row) => ({
      ...row,
      ordersCount: Number(row.ordersCount),
      completedOrders: Number(row.completedOrders),
      revenue: Number(row.revenue),
      naktaCoins: Number(row.naktaCoins),
      nftCount: Number(row.nftCount),
      pendingNftCount: Number(row.pendingNftCount),
    }));
    return { items, total: Number(total), limit, offset };
  }

  nftWithdrawals(regionSlug?: string, status?: AdminNftWithdrawalStatus) {
    const query = this.nftRepository.createQueryBuilder("nft");
    if (regionSlug) query.andWhere('nft."regionSlug" = :regionSlug', { regionSlug });
    if (status) query.andWhere("nft.status = :status", { status });
    return query
      .orderBy(`CASE nft.status
        WHEN 'pending' THEN 0
        WHEN 'failed' THEN 1
        WHEN 'submitted' THEN 2
        WHEN 'owned' THEN 3
        ELSE 4
      END`, "ASC")
      .addOrderBy('nft."withdrawalRequestedAt"', "DESC", "NULLS LAST")
      .addOrderBy('nft."createdAt"', "DESC")
      .take(200)
      .getMany();
  }

  async updateNftWithdrawal(id: string, dto: UpdateNftWithdrawalDto) {
    return this.nftRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(AccountNft);
      const nft = await repository.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!nft) throw new NotFoundException("NFT не найден");
      if (nft.status === "owned") {
        throw new ConflictException("Клиент ещё не запрашивал вывод этого NFT");
      }
      if (nft.status === "withdrawn") {
        throw new ConflictException("Вывод уже завершён");
      }
      if (dto.status !== "failed" && !nft.walletAddress) {
        throw new BadRequestException("У заявки не указан кошелёк клиента");
      }
      const nextTxHash = dto.txHash !== undefined
        ? dto.txHash.trim() || null
        : nft.txHash;
      if (dto.status !== "failed" && !nextTxHash) {
        throw new BadRequestException("Для отправленного NFT нужен хеш транзакции");
      }
      nft.status = dto.status;
      nft.txHash = nextTxHash;
      if (dto.tokenId !== undefined) nft.tokenId = dto.tokenId.trim() || null;
      nft.withdrawalError = dto.status === "failed"
        ? dto.error?.trim() || "Транзакция отклонена обработчиком"
        : null;
      nft.withdrawnAt = dto.status === "withdrawn" ? new Date() : null;
      return repository.save(nft);
    });
  }

  coinWithdrawals(regionSlug?: string, status?: string) {
    const supported = new Set(["pending", "submitted", "withdrawn", "failed"]);
    const query = this.coinWithdrawalRepository.createQueryBuilder("withdrawal");
    if (regionSlug) {
      query.andWhere('withdrawal."regionSlug" = :regionSlug', { regionSlug });
    }
    if (status && supported.has(status)) {
      query.andWhere("withdrawal.status = :status", { status });
    }
    return query
      .orderBy(`CASE withdrawal.status
        WHEN 'pending' THEN 0
        WHEN 'failed' THEN 1
        WHEN 'submitted' THEN 2
        ELSE 3
      END`, "ASC")
      .addOrderBy('withdrawal."createdAt"', "DESC")
      .take(200)
      .getMany();
  }

  async updateCoinWithdrawal(id: string, dto: UpdateNaktaCoinWithdrawalDto) {
    return this.coinWithdrawalRepository.manager.transaction(async (manager) => {
      const withdrawalRepository = manager.getRepository(NaktaCoinWithdrawal);
      const withdrawal = await withdrawalRepository.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!withdrawal) throw new NotFoundException("Заявка на вывод не найдена");
      if (["withdrawn", "failed"].includes(withdrawal.status)) {
        throw new ConflictException("Заявка уже завершена");
      }
      const nextTxHash = dto.txHash !== undefined
        ? dto.txHash.trim() || null
        : withdrawal.txHash;
      if (dto.status !== "failed" && !nextTxHash) {
        throw new BadRequestException("Для отправки NAKTA Coin нужен хеш транзакции");
      }

      withdrawal.status = dto.status;
      withdrawal.txHash = nextTxHash;
      withdrawal.error = dto.status === "failed"
        ? dto.error?.trim() || "Заявка на вывод отклонена"
        : null;
      withdrawal.processedAt = ["withdrawn", "failed"].includes(dto.status)
        ? new Date()
        : null;

      if (dto.status === "failed") {
        const accountRepository = manager.getRepository(PhoneAccount);
        const account = await accountRepository.findOne({
          where: { phone: withdrawal.phone },
          lock: { mode: "pessimistic_write" },
        });
        if (!account) throw new NotFoundException("Аккаунт не найден");
        account.naktaCoins += withdrawal.amount;
        await accountRepository.save(account);
        await manager.getRepository(NaktaCoinTransaction).save({
          phone: withdrawal.phone,
          regionSlug: withdrawal.regionSlug,
          orderId: randomUUID(),
          amount: withdrawal.amount,
          description: "Возврат NAKTA Coin после отмены вывода",
        });
      }

      return withdrawalRepository.save(withdrawal);
    });
  }

  async createRegion(dto: CreateRegionDto) {
    const slug = dto.slug.trim().toLowerCase();
    const exists = await this.regions.findOne({ where: { slug } });
    if (exists) throw new BadRequestException("Город с таким адресом уже существует");
    const sources = await this.validateContentSources(slug, dto);
    return this.regions.save(this.regions.create({ ...dto, ...sources, slug }));
  }

  async updateRegion(id: number, dto: UpdateRegionDto) {
    const region = await this.regions.findOne({ where: { id } });
    if (!region) throw new NotFoundException("Город не найден");
    const sources = await this.validateContentSources(region.slug, dto);
    Object.assign(region, dto, sources);
    return this.regions.save(region);
  }

  async orders(query: ListOrdersQueryDto) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const applySharedFilters = <T extends ReturnType<Repository<Order>["createQueryBuilder"]>>(builder: T) => {
      if (query.regionSlug) builder.andWhere("admin_order.regionSlug = :regionSlug", { regionSlug: query.regionSlug });
      if (query.from) builder.andWhere('admin_order."createdAt" >= :from', { from: new Date(query.from) });
      if (query.to) builder.andWhere('admin_order."createdAt" <= :to', { to: new Date(query.to) });
      if (query.search?.trim()) {
        builder.andWhere(`(
          CAST(admin_order."orderNumber" AS text) ILIKE :search
          OR admin_order."id"::text ILIKE :search
          OR admin_order."customerName" ILIKE :search
          OR admin_order."phone" ILIKE :search
          OR admin_order."address" ILIKE :search
        )`, { search: `%${query.search.trim()}%` });
      }
      return builder;
    };
    const list = applySharedFilters(
      this.orderRepository.createQueryBuilder("admin_order").leftJoinAndSelect("admin_order.items", "items"),
    );
    if (query.status) list.andWhere("admin_order.status = :status", { status: query.status });
    const counts = applySharedFilters(this.orderRepository.createQueryBuilder("admin_order"))
      .select("admin_order.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("admin_order.status");
    const [[items, total], rawStatusCounts] = await Promise.all([
      list.orderBy("admin_order.createdAt", "DESC").take(limit).skip(offset).getManyAndCount(),
      counts.getRawMany<{ status: OrderStatus; count: string }>(),
    ]);
    const statusCounts = Object.fromEntries(rawStatusCounts.map((item) => [item.status, Number(item.count)])) as Partial<Record<OrderStatus, number>>;
    return { items, total, limit, offset, statusCounts };
  }

  async order(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateOrderKit(id: string, dto: UpdateOrderKitDto) {
    const order = await this.order(id);
    if ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException("Комплектацию завершённого или отменённого заказа изменить нельзя");
    }
    order.noUtensils = dto.noUtensils;
    order.utensilsCount = dto.noUtensils ? 0 : dto.utensilsCount;
    order.kitItems = normalizeOrderKitItems(dto.kitItems);
    return this.orderRepository.save(order);
  }

  async updateOrderStatus(id: string, nextStatus: OrderStatus) {
    const current = await this.order(id);
    if (shouldSubmitOrderToEduPosAfterAdminTransition(current.status, nextStatus)) {
      const confirmed = await this.eduPos.confirmOrder(current);
      dispatchOrderStatusPush(this.pushNotifications, confirmed);
      return confirmed;
    }

    const saved = await this.orderRepository.manager.transaction(async (manager) => {
      const orders = manager.getRepository(Order);
      const order = await orders.findOne({
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!order) throw new NotFoundException("Order not found");
      const items = await manager.getRepository(OrderItem).find({
        where: { order: { id } },
      });
      if (!canTransitionOrderStatus(order.status, nextStatus)) {
        throw new BadRequestException(`Order cannot transition from ${order.status} to ${nextStatus}`);
      }
      if (order.status === nextStatus) return order;
      if (nextStatus === OrderStatus.COMPLETED) {
        await manager.query(
          "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
          [`order-rewards:${order.phone}:${order.regionSlug}`],
        );
      }
      order.status = nextStatus;
      if (nextStatus === OrderStatus.COMPLETED) order.completedAt = new Date();
      const saved = await orders.save(order);
      if (nextStatus === OrderStatus.COMPLETED) {
        await manager.createQueryBuilder()
          .insert()
          .into(PhoneAccount)
          .values({ phone: order.phone, naktaCoins: 0 })
          .orIgnore()
          .execute();

        const rewards = calculateOrderRewards(items);
        if (rewards.naktaCoins > 0) {
          const inserted = await manager.createQueryBuilder()
            .insert()
            .into(NaktaCoinTransaction)
            .values({
              phone: order.phone,
              regionSlug: order.regionSlug,
              orderId: order.id,
              amount: rewards.naktaCoins,
              description: `Заказ №${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`,
            })
            .orIgnore()
            .returning(["id"])
            .execute();
          if (inserted.identifiers.length > 0) {
            await manager.increment(PhoneAccount, { phone: order.phone }, "naktaCoins", rewards.naktaCoins);
          }
        }

        const program = await manager.getRepository(Region).findOne({
          where: { slug: order.regionSlug },
        });
        const completedOrders = await orders.count({
          where: {
            phone: order.phone,
            regionSlug: order.regionSlug,
            status: OrderStatus.COMPLETED,
          },
        });
        if (
          program
          && program.nftRewardName.trim()
          && isNftMilestone(completedOrders, program.nftRewardEveryOrders)
        ) {
          await manager.createQueryBuilder()
            .insert()
            .into(AccountNft)
            .values({
              phone: order.phone,
              regionSlug: order.regionSlug,
              rewardKey: `milestone:${order.id}`,
              orderId: order.id,
              milestoneOrderCount: completedOrders,
              name: program.nftRewardName,
              image: program.nftRewardImage,
              description: program.nftRewardDescription,
              network: program.nftRewardNetwork,
              contractAddress: program.nftContractAddress,
              metadataUri: program.nftMetadataUri,
              tokenId: null,
              status: "owned",
              walletAddress: null,
              txHash: null,
              withdrawalError: null,
              withdrawalRequestedAt: null,
              withdrawnAt: null,
            })
            .orIgnore()
            .execute();
        }
      }
      saved.items = items;
      return saved;
    });
    dispatchOrderStatusPush(this.pushNotifications, saved);
    return saved;
  }

  async createPickupLocation(dto: CreatePickupLocationDto) {
    const region = await this.regions.findOneBy({ id: dto.regionId });
    if (!region) throw new NotFoundException("Город не найден");
    const location = this.pickupLocations.create({
      ...dto,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      region,
    });
    return this.pickupLocations.save(location);
  }

  async resolvePickupMapLink(yandexUrl: string) {
    try {
      return await resolvePickupMapLink(yandexUrl);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Не удалось определить координаты",
      );
    }
  }

  async updatePickupLocation(id: number, dto: UpdatePickupLocationDto) {
    const location = await this.pickupLocations.findOneBy({ id });
    if (!location) throw new NotFoundException("Кухня самовывоза не найдена");
    Object.assign(location, dto);
    return this.pickupLocations.save(location);
  }

  async deletePickupLocation(id: number) {
    const location = await this.pickupLocations.findOneBy({ id });
    if (!location) throw new NotFoundException("Кухня самовывоза не найдена");
    await this.pickupLocations.remove(location);
    return { deleted: true };
  }

  async createCategory(dto: CreateCategoryDto) {
    const requestedRegion = await this.requireRegion(dto.regionSlug);
    const region = await this.contentSource(requestedRegion, "menuSourceRegionSlug");
    const exists = await this.categories.findOne({ where: { region: { id: region.id }, slug: dto.slug } });
    if (exists) throw new BadRequestException("Category slug already exists in this region");
    return this.categories.save(this.categories.create({ ...dto, region }));
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.requireCategory(id);
    Object.assign(category, dto);
    return this.categories.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.requireCategory(id);
    await this.categories.remove(category);
    return { deleted: true };
  }

  async createProduct(dto: CreateProductDto) {
    this.validateModifierGroups(dto.modifierGroups);
    this.validateOldPrice(dto.price, dto.oldPrice);
    const requestedRegion = await this.requireRegion(dto.regionSlug);
    const region = await this.contentSource(requestedRegion, "menuSourceRegionSlug");
    const category = await this.requireCategory(dto.categoryId);
    if (category.region.id !== region.id) throw new BadRequestException("Category belongs to another region");
    const { regionSlug: _regionSlug, categoryId: _categoryId, ...data } = dto;
    return this.products.save(this.products.create({
      ...data,
      sourceId: null,
      category,
    }));
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    if (dto.modifierGroups !== undefined) this.validateModifierGroups(dto.modifierGroups);
    const product = await this.requireProduct(id);
    const { categoryId, ...data } = dto;
    this.validateOldPrice(
      data.price ?? product.price,
      Object.prototype.hasOwnProperty.call(data, "oldPrice") ? data.oldPrice : product.oldPrice,
    );
    if (categoryId !== undefined) {
      const category = await this.requireCategory(categoryId);
      if (category.region.id !== product.category.region.id) {
        throw new BadRequestException("Product cannot be moved to another region");
      }
      product.category = category;
    }
    Object.assign(product, data);
    return this.products.save(product);
  }

  async deleteProduct(id: number) {
    const product = await this.requireProduct(id);
    await this.products.remove(product);
    return { deleted: true };
  }

  async createPromotion(dto: CreatePromotionDto) {
    const requestedRegion = await this.requireRegion(dto.regionSlug);
    const region = await this.contentSource(requestedRegion, "promotionSourceRegionSlug");
    const { regionSlug: _regionSlug, ...data } = dto;
    return this.promotions.save(this.promotions.create({ ...data, region }));
  }

  async updatePromotion(id: number, dto: UpdatePromotionDto) {
    const promotion = await this.requirePromotion(id);
    Object.assign(promotion, dto);
    return this.promotions.save(promotion);
  }

  async deletePromotion(id: number) {
    const promotion = await this.requirePromotion(id);
    await this.promotions.remove(promotion);
    return { deleted: true };
  }

  private async requireRegion(slug: string) {
    const region = await this.regions.findOne({ where: { slug } });
    if (!region) throw new NotFoundException("Region not found");
    return region;
  }

  private async contentSource(
    region: Region,
    field: RegionContentSourceField,
  ) {
    const sourceSlug = regionContentSourceSlug(region, field);
    if (sourceSlug === region.slug) return region;
    const source = await this.regions.findOne({ where: { slug: sourceSlug } });
    if (!source) throw new BadRequestException("Выбранный источник контента не найден");
    return source;
  }

  private async validateContentSources(
    regionSlug: string,
    dto: Pick<CreateRegionDto | UpdateRegionDto, "menuSourceRegionSlug" | "promotionSourceRegionSlug">,
  ) {
    const entries = [
      ["menuSourceRegionSlug", dto.menuSourceRegionSlug],
      ["promotionSourceRegionSlug", dto.promotionSourceRegionSlug],
    ] as const;
    const result: Partial<Pick<Region, "menuSourceRegionSlug" | "promotionSourceRegionSlug">> = {};
    for (const [field, value] of entries) {
      if (value === undefined) continue;
      const sourceSlug = value.trim().toLowerCase();
      if (!sourceSlug || sourceSlug === regionSlug) {
        result[field] = null;
        continue;
      }
      const source = await this.regions.findOne({ where: { slug: sourceSlug } });
      if (!source) throw new BadRequestException("Выбранный источник контента не найден");
      result[field] = source.slug;
    }
    return result;
  }

  private async requireCategory(id: number) {
    const category = await this.categories.findOne({ where: { id }, relations: { region: true } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  private async requireProduct(id: number) {
    const product = await this.products.findOne({
      where: { id },
      relations: { category: { region: true } },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  private async requirePromotion(id: number) {
    const promotion = await this.promotions.findOne({ where: { id }, relations: { region: true } });
    if (!promotion) throw new NotFoundException("Promotion not found");
    return promotion;
  }

  private validateModifierGroups(groups: CreateProductDto["modifierGroups"]) {
    try {
      assertValidModifierGroups(groups);
    } catch (error) {
      if (error instanceof ModifierCatalogValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private validateOldPrice(price: number, oldPrice: number | null | undefined) {
    if (oldPrice !== null && oldPrice !== undefined && oldPrice <= price) {
      throw new BadRequestException("Старая цена должна быть больше текущей цены");
    }
  }
}
