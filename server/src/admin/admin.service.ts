import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
import { Order } from "../orders/order.entity";
import { canTransitionOrderStatus, OrderStatus } from "../orders/order.enums";
import { ListOrdersQueryDto } from "./admin-orders.dto";
import { OrdersGateway } from "../realtime/orders.gateway";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  CreateRegionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
  UpdateRegionDto,
} from "./admin.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Region) private readonly regions: Repository<Region>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Promotion) private readonly promotions: Repository<Promotion>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async dashboard(regionSlug: string) {
    const region = await this.requireRegion(regionSlug);
    const [categories, promotions] = await Promise.all([
      this.categories.find({
        where: { region: { id: region.id } },
        relations: { products: true },
        order: { sortOrder: "ASC", products: { sortOrder: "ASC", id: "ASC" } },
      }),
      this.promotions.find({
        where: { region: { id: region.id } },
        order: { sortOrder: "ASC", id: "ASC" },
      }),
    ]);
    return { region, categories, promotions };
  }

  settings() {
    return this.regions.find({ order: { sortOrder: "ASC", id: "ASC" } });
  }

  async createRegion(dto: CreateRegionDto) {
    const slug = dto.slug.trim().toLowerCase();
    const exists = await this.regions.findOne({ where: { slug } });
    if (exists) throw new BadRequestException("Город с таким адресом уже существует");
    return this.regions.save(this.regions.create({ ...dto, slug }));
  }

  async updateRegion(id: number, dto: UpdateRegionDto) {
    const region = await this.regions.findOne({ where: { id } });
    if (!region) throw new NotFoundException("Город не найден");
    Object.assign(region, dto);
    return this.regions.save(region);
  }

  async orders(query: ListOrdersQueryDto) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const where = {
      ...(query.regionSlug ? { regionSlug: query.regionSlug } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total, rawStatusCounts] = await Promise.all([
      this.orderRepository.find({
        where,
        relations: { items: true },
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      }),
      this.orderRepository.count({ where }),
      this.orderRepository.createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(*)", "count")
        .where(query.regionSlug ? "order.regionSlug = :regionSlug" : "1 = 1", { regionSlug: query.regionSlug })
        .groupBy("order.status")
        .getRawMany<{ status: OrderStatus; count: string }>(),
    ]);
    const statusCounts = Object.fromEntries(rawStatusCounts.map((item) => [item.status, Number(item.count)])) as Partial<Record<OrderStatus, number>>;
    return { items, total, limit, offset, statusCounts };
  }

  async statistics(regionSlug: string) {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const [summary, daily] = await Promise.all([
      this.orderRepository.createQueryBuilder("order")
        .select("COUNT(*)", "totalOrders")
        .addSelect("COALESCE(SUM(CASE WHEN order.status != :cancelled THEN order.total ELSE 0 END), 0)", "revenue")
        .addSelect("COUNT(*) FILTER (WHERE order.status = :completed)", "completedOrders")
        .addSelect("COUNT(*) FILTER (WHERE order.status NOT IN (:cancelled, :completed))", "activeOrders")
        .addSelect("COUNT(*) FILTER (WHERE order.status = :cancelled)", "cancelledOrders")
        .where("order.regionSlug = :regionSlug", { regionSlug })
        .setParameters({ cancelled: OrderStatus.CANCELLED, completed: OrderStatus.COMPLETED })
        .getRawOne<{ totalOrders: string; revenue: string; completedOrders: string; activeOrders: string; cancelledOrders: string }>(),
      this.orderRepository.createQueryBuilder("order")
        .select("DATE(order.\"createdAt\")", "date")
        .addSelect("COUNT(*)", "orders")
        .addSelect("COALESCE(SUM(CASE WHEN order.status != :cancelled THEN order.total ELSE 0 END), 0)", "revenue")
        .where("order.regionSlug = :regionSlug", { regionSlug })
        .andWhere("order.\"createdAt\" >= :since", { since })
        .setParameter("cancelled", OrderStatus.CANCELLED)
        .groupBy("DATE(order.\"createdAt\")")
        .orderBy("DATE(order.\"createdAt\")", "ASC")
        .getRawMany<{ date: string; orders: string; revenue: string }>(),
    ]);
    const totalOrders = Number(summary?.totalOrders || 0);
    const revenue = Number(summary?.revenue || 0);
    return {
      totalOrders,
      revenue,
      averageOrder: totalOrders ? Math.round(revenue / totalOrders) : 0,
      completedOrders: Number(summary?.completedOrders || 0),
      activeOrders: Number(summary?.activeOrders || 0),
      cancelledOrders: Number(summary?.cancelledOrders || 0),
      days: daily.map((item) => ({ date: item.date, orders: Number(item.orders), revenue: Number(item.revenue) })),
    };
  }

  async order(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async updateOrderStatus(id: string, nextStatus: OrderStatus) {
    const order = await this.order(id);
    if (!canTransitionOrderStatus(order.status, nextStatus)) {
      throw new BadRequestException(`Order cannot transition from ${order.status} to ${nextStatus}`);
    }
    if (order.status === nextStatus) return order;
    order.status = nextStatus;
    const updated = await this.orderRepository.save(order);
    this.ordersGateway.orderUpdated(updated);
    return updated;
  }

  async createCategory(dto: CreateCategoryDto) {
    const region = await this.requireRegion(dto.regionSlug);
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
    const region = await this.requireRegion(dto.regionSlug);
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
    const region = await this.requireRegion(dto.regionSlug);
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
    const region = await this.regions.findOne({ where: { slug, enabled: true } });
    if (!region) throw new NotFoundException("Region not found");
    return region;
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
}
