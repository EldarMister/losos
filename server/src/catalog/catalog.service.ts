import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Category } from "./category.entity";
import { Product } from "./product.entity";
import { Promotion } from "./promotion.entity";
import { Region } from "./region.entity";
import { regionContentSourceSlug, type RegionContentSourceField } from "./region-content-source";
import { seedCategories } from "./seed-data";

const defaultRegions: Array<{
  slug: string;
  name: string;
  sortOrder: number;
  menuSourceRegionSlug?: string;
  promotionSourceRegionSlug?: string;
  deliveryZone?: Array<{ latitude: number; longitude: number }>;
}> = [
  { slug: "bishkek", name: "Бишкек", sortOrder: 0 },
  { slug: "osh", name: "Ош", sortOrder: 1 },
  {
    slug: "otuz-adyr",
    name: "Отуз-Адыр",
    sortOrder: 2,
    menuSourceRegionSlug: "osh",
    promotionSourceRegionSlug: "osh",
    deliveryZone: [
      { latitude: 40.64, longitude: 72.92 },
      { latitude: 40.645, longitude: 72.98 },
      { latitude: 40.625, longitude: 73.02 },
      { latitude: 40.59, longitude: 73.02 },
      { latitude: 40.565, longitude: 72.99 },
      { latitude: 40.565, longitude: 72.94 },
      { latitude: 40.585, longitude: 72.91 },
      { latitude: 40.62, longitude: 72.91 },
    ],
  },
];

const defaultPromotions = [
  {
    title: "Скидка студентам",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/b92972a55683d636714fea75d11469ce_resize_in_box_2048_2048.png",
    cta: "Заполнить форму",
    ctaUrl: "",
  },
  {
    title: "Telegram: промокоды и мемы",
    image: "/reference-telegram-story.png",
    cta: "Узнать подробнее",
    ctaUrl: "/support",
  },
  {
    title: "Накта суши — удовольствие есть",
    image: "/og-social-v2.png",
    cta: "",
    ctaUrl: "",
  },
  {
    title: "Всё вкусное — детям!",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/2720f66e5f628289ea1c761222a24eb4_resize_in_box_2048_2048.jpg",
    cta: "Кавабанга!",
    ctaUrl: "",
  },
  {
    title: "Кешбэк до 100%",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/e258569da4e992205d8f3ae006d151eb_resize_in_box_2048_2048.jpg",
    cta: "",
    ctaUrl: "",
  },
  {
    title: "Мноооооого палочки?",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/1ebd0558c6daa570f029071ce7bb1648_resize_in_box_2048_2048.jpg",
    cta: "Хорошо",
    ctaUrl: "",
  },
  {
    title: "Помогаем котикам вместе",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/7c7596a0dba0e9fff9f96d6e65df547d_resize_in_box_2048_2048.jpg",
    cta: "Мяу!",
    ctaUrl: "",
  },
] as const;

const publicProduct = (product: Product) => ({
  ...product,
  available: product.available && product.posAvailable,
});

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(Region) private readonly regionRepository: Repository<Region>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Promotion) private readonly promotionRepository: Repository<Promotion>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_CATALOG_ON_STARTUP === "false") return;

    await this.regionRepository.manager.transaction(async (manager) => {
      // Seed data bootstraps only a clean database. Existing catalog content is
      // owned by the admin panel and must never be rewritten on application startup.
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [729_172]);
      const regions = manager.getRepository(Region);
      const categories = manager.getRepository(Category);
      const products = manager.getRepository(Product);
      const promotions = manager.getRepository(Promotion);

      for (const definition of defaultRegions) {
        let region = await regions.findOne({ where: { slug: definition.slug } });
        if (region) continue;

        region = await regions.save(regions.create(definition));
        if (!definition.menuSourceRegionSlug) {
          for (const entry of seedCategories) {
            const category = await categories.save(categories.create({
              slug: entry.slug,
              title: entry.title,
              sortOrder: entry.sortOrder,
              region,
            }));
            await products.save(entry.products.map((product) => products.create({
              ...product,
              category,
            })));
          }
        }
        if (!definition.promotionSourceRegionSlug) {
          await promotions.save(defaultPromotions.map((promotion, sortOrder) => promotions.create({
            ...promotion,
            enabled: true,
            sortOrder,
            region,
          })));
        }
      }
    });
  }

  regions() {
    return this.regionRepository.find({
      where: { enabled: true },
      relations: { pickupLocations: true },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  async categories(regionSlug = "bishkek") {
    const region = await this.requireRegion(regionSlug);
    const source = await this.contentSource(region, "menuSourceRegionSlug");
    const categories = await this.categoryRepository.find({
      where: { region: { id: source.id } },
      relations: { products: true },
      order: { sortOrder: "ASC", products: { sortOrder: "ASC", id: "ASC" } },
    });
    return categories.map((category) => ({
      ...category,
      products: category.products.map(publicProduct),
    }));
  }

  async promotions(regionSlug = "bishkek") {
    const region = await this.requireRegion(regionSlug);
    const source = await this.contentSource(region, "promotionSourceRegionSlug");
    return this.promotionRepository.find({
      where: { region: { id: source.id }, enabled: true },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  async products(filters: { search?: string; category?: string; region?: string }) {
    const regionSlug = filters.region || "bishkek";
    const region = await this.requireRegion(regionSlug);
    const source = await this.contentSource(region, "menuSourceRegionSlug");
    const products = await this.productRepository.find({
      where: {
        ...(filters.search ? { name: ILike(`%${filters.search}%`) } : {}),
        category: {
          ...(filters.category ? { slug: filters.category } : {}),
          region: { id: source.id },
        },
      },
      relations: { category: { region: true } },
      order: { sortOrder: "ASC", id: "ASC" },
    });
    return products.map(publicProduct);
  }

  async product(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: { region: true } },
    });
    if (!product) throw new NotFoundException("Product not found");
    return publicProduct(product);
  }

  async requireRegion(slug: string) {
    const region = await this.regionRepository.findOne({ where: { slug, enabled: true } });
    if (!region) throw new NotFoundException("Region not found");
    return region;
  }

  private async contentSource(
    region: Region,
    field: RegionContentSourceField,
  ) {
    const sourceSlug = regionContentSourceSlug(region, field);
    if (sourceSlug === region.slug) return region;
    const source = await this.regionRepository.findOne({ where: { slug: sourceSlug } });
    if (!source) throw new NotFoundException("Content source region not found");
    return source;
  }
}
