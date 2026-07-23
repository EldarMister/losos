import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../catalog/category.entity";
import { Product } from "../catalog/product.entity";
import { Promotion } from "../catalog/promotion.entity";
import { Region } from "../catalog/region.entity";
import {
  CreateCategoryDto,
  CreateProductDto,
  CreatePromotionDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdatePromotionDto,
} from "./admin.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Region) private readonly regions: Repository<Region>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Promotion) private readonly promotions: Repository<Promotion>,
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
    const region = await this.requireRegion(dto.regionSlug);
    const category = await this.requireCategory(dto.categoryId);
    if (category.region.id !== region.id) throw new BadRequestException("Category belongs to another region");
    const { regionSlug: _regionSlug, categoryId: _categoryId, ...data } = dto;
    return this.products.save(this.products.create({
      ...data,
      sourceId: null,
      badge: data.badge?.trim() || null,
      category,
    }));
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
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
    if ("badge" in data) product.badge = data.badge?.trim() || null;
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
}
