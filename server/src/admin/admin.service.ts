import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Category } from "../catalog/category.entity";
import {
  assertValidModifierGroups,
  ModifierCatalogValidationError,
} from "../catalog/modifier-validation";
import { Product } from "../catalog/product.entity";
import { Promotion } from "../catalog/promotion.entity";
import { Region } from "../catalog/region.entity";
import { PickupLocation } from "../catalog/pickup-location.entity";
import { Order } from "../orders/order.entity";
import { canTransitionOrderStatus, OrderStatus } from "../orders/order.enums";
import { PhoneAccount } from "../auth/phone-account.entity";
import { ListOrdersQueryDto } from "./admin-orders.dto";
import { PushNotificationsService } from "../notifications/push-notifications.service";
import { dispatchOrderStatusPush } from "./order-status-notifier";
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
} from "./admin.dto";

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
    private readonly pushNotifications: PushNotificationsService,
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
    const pickupLocations = await this.pickupLocations.find({
      where: { region: { id: region.id } },
      order: { sortOrder: "ASC", id: "ASC" },
    });
    return { region: { ...region, pickupLocations }, categories, promotions };
  }

  settings() {
    return this.regions.find({
      relations: { pickupLocations: true },
      order: { sortOrder: "ASC", id: "ASC" },
    });
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
      ...(query.from || query.to ? {
        createdAt: Between(
          query.from ? new Date(query.from) : new Date(0),
          query.to ? new Date(query.to) : new Date(),
        ),
      } : {}),
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
      (() => {
        const counts = this.orderRepository.createQueryBuilder("order")
        .select("order.status", "status")
        .addSelect("COUNT(*)", "count")
        .where(query.regionSlug ? "order.regionSlug = :regionSlug" : "1 = 1", { regionSlug: query.regionSlug })
        .groupBy("order.status");
        if (query.from) counts.andWhere("order.\"createdAt\" >= :from", { from: new Date(query.from) });
        if (query.to) counts.andWhere("order.\"createdAt\" <= :to", { to: new Date(query.to) });
        return counts.getRawMany<{ status: OrderStatus; count: string }>();
      })(),
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

  async updateOrderStatus(id: string, nextStatus: OrderStatus) {
    const saved = await this.orderRepository.manager.transaction(async (manager) => {
      const orders = manager.getRepository(Order);
      const order = await orders.findOne({ where: { id }, relations: { items: true } });
      if (!order) throw new NotFoundException("Order not found");
      if (!canTransitionOrderStatus(order.status, nextStatus)) {
        throw new BadRequestException(`Order cannot transition from ${order.status} to ${nextStatus}`);
      }
      order.status = nextStatus;
      const saved = await orders.save(order);
      if (nextStatus === OrderStatus.COMPLETED) {
        const naktaCoins = order.items.reduce((sum, item) => sum + item.naktaCoins, 0);
        if (naktaCoins > 0) {
          await manager.getRepository(PhoneAccount).increment({ phone: order.phone }, "naktaCoins", naktaCoins);
        }
      }
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
    this.validateOldPrice(dto.price, dto.oldPrice);
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

  private validateOldPrice(price: number, oldPrice: number | null | undefined) {
    if (oldPrice !== null && oldPrice !== undefined && oldPrice <= price) {
      throw new BadRequestException("Старая цена должна быть больше текущей цены");
    }
  }
}
