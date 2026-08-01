import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { isDeepStrictEqual } from "node:util";
import { ILike, Repository } from "typeorm";
import { Category } from "./category.entity";
import { Product } from "./product.entity";
import { Promotion } from "./promotion.entity";
import { Region } from "./region.entity";
import { seedCategories, type SeedProduct } from "./seed-data";

const defaultRegions = [
  { slug: "bishkek", name: "Бишкек", sortOrder: 0 },
  { slug: "osh", name: "Ош", sortOrder: 1 },
] as const;

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

const promotionAliases = new Map<string, string>([
  ["Промокоды и подарки", "Telegram: промокоды и мемы"],
  ["Удовольствие есть", "Накта суши — удовольствие есть"],
  ["Много лосося — удовольствие есть", "Накта суши — удовольствие есть"],
]);

const promotionArtifacts = new Set(["memories/test", "test", "тест"]);

function normalizePromotionTitle(title: string) {
  return title.trim().toLocaleLowerCase("ru-RU");
}

function seedProductNeedsUpdate(product: Product, seed: SeedProduct) {
  return (
    product.slug !== seed.slug
    || product.name !== seed.name
    || product.price !== seed.price
    || product.image !== seed.image
    || product.description !== seed.description
    || product.composition !== seed.composition
    || Math.abs(product.weight - seed.weight) > 0.001
    || product.calories !== seed.calories
    || product.protein !== seed.protein
    || product.fat !== seed.fat
    || product.carbs !== seed.carbs
    || product.isNew !== seed.isNew
    || product.available !== seed.available
    || product.sortOrder !== seed.sortOrder
    || !isDeepStrictEqual(product.modifierGroups ?? [], seed.modifierGroups)
  );
}

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
      // Serializes canonical seed reconciliation across concurrently starting instances.
      await manager.query(`SELECT pg_advisory_xact_lock($1)`, [729_172]);
      const regions = manager.getRepository(Region);
      const categories = manager.getRepository(Category);
      const products = manager.getRepository(Product);
      const promotions = manager.getRepository(Promotion);

      for (const definition of defaultRegions) {
        let region = await regions.findOne({ where: { slug: definition.slug } });
        if (!region) region = await regions.save(regions.create(definition));

        const existingCategories = await categories.find({
          where: { region: { id: region.id } },
          relations: { products: true },
        });
        const categoriesBySlug = new Map(existingCategories.map((category) => [category.slug, category]));
        const seedCategoriesBySlug = new Map(seedCategories.map((category) => [category.slug, category]));

        for (const category of existingCategories) {
          const canonicalSourceIds = new Set(
            seedCategoriesBySlug.get(category.slug)?.products.map((product) => product.sourceId)
              ?? [],
          );
          const staleSeededProducts = category.products.filter((product) =>
            product.sourceId !== null && !canonicalSourceIds.has(product.sourceId));
          if (!staleSeededProducts.length) continue;
          const staleIds = new Set(staleSeededProducts.map((product) => product.id));
          category.products = category.products.filter((product) => !staleIds.has(product.id));
          await products.remove(staleSeededProducts);
        }

        for (const entry of seedCategories) {
          let category = categoriesBySlug.get(entry.slug);
          if (!category) {
            category = await categories.save(categories.create({
              slug: entry.slug,
              title: entry.title,
              sortOrder: entry.sortOrder,
              region,
            }));
            category.products = [];
            categoriesBySlug.set(category.slug, category);
          } else if (
            category.title !== entry.title
            || category.sortOrder !== entry.sortOrder
          ) {
            category.title = entry.title;
            category.sortOrder = entry.sortOrder;
            category = await categories.save(category);
            categoriesBySlug.set(category.slug, category);
          }

          const seededProductsBySourceId = new Map(
            category.products
              .filter((product) => product.sourceId !== null)
              .map((product) => [product.sourceId, product]),
          );
          const productsToSave: Product[] = [];
          for (const seed of entry.products) {
            const existing = seededProductsBySourceId.get(seed.sourceId);
            if (!existing) {
              productsToSave.push(products.create({ ...seed, category }));
              continue;
            }
            if (!seedProductNeedsUpdate(existing, seed)) continue;
            Object.assign(existing, seed);
            productsToSave.push(existing);
          }
          if (productsToSave.length) {
            const savedProducts = await products.save(productsToSave);
            for (const savedProduct of savedProducts) {
              if (!category.products.some((product) => product.id === savedProduct.id)) {
                category.products.push(savedProduct);
              }
            }
          }
        }

        const existingPromotions = await promotions.find({
          where: { region: { id: region.id } },
        });
        const artifacts = existingPromotions.filter((promotion) =>
          promotionArtifacts.has(normalizePromotionTitle(promotion.title)));
        if (artifacts.length) await promotions.remove(artifacts);

        const activePromotions = existingPromotions.filter((promotion) =>
          !promotionArtifacts.has(normalizePromotionTitle(promotion.title)));
        const promotionsToSave: Promotion[] = [];
        const duplicatePromotionsToRemove: Promotion[] = [];
        for (const [sortOrder, definition] of defaultPromotions.entries()) {
          const aliases = [...promotionAliases.entries()]
            .filter(([, canonicalTitle]) => canonicalTitle === definition.title)
            .map(([alias]) => alias);
          const candidates = activePromotions.filter((promotion) =>
            promotion.title === definition.title || aliases.includes(promotion.title));
          const promotion = candidates.find((candidate) =>
            candidate.title === definition.title)
            ?? candidates[0]
            ?? promotions.create({ ...definition, region });

          Object.assign(promotion, definition, {
            enabled: true,
            sortOrder,
            region,
          });
          promotionsToSave.push(promotion);
          duplicatePromotionsToRemove.push(...candidates.filter((candidate) =>
            candidate !== promotion));
        }
        if (promotionsToSave.length) await promotions.save(promotionsToSave);
        if (duplicatePromotionsToRemove.length) {
          await promotions.remove(duplicatePromotionsToRemove);
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
    await this.requireRegion(regionSlug);
    return this.categoryRepository.find({
      where: { region: { slug: regionSlug } },
      relations: { products: true },
      order: { sortOrder: "ASC", products: { sortOrder: "ASC", id: "ASC" } },
    });
  }

  async promotions(regionSlug = "bishkek") {
    await this.requireRegion(regionSlug);
    return this.promotionRepository.find({
      where: { region: { slug: regionSlug }, enabled: true },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  async products(filters: { search?: string; category?: string; region?: string }) {
    const regionSlug = filters.region || "bishkek";
    await this.requireRegion(regionSlug);
    return this.productRepository.find({
      where: {
        ...(filters.search ? { name: ILike(`%${filters.search}%`) } : {}),
        category: {
          ...(filters.category ? { slug: filters.category } : {}),
          region: { slug: regionSlug },
        },
      },
      relations: { category: { region: true } },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  async product(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: { region: true } },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async requireRegion(slug: string) {
    const region = await this.regionRepository.findOne({ where: { slug, enabled: true } });
    if (!region) throw new NotFoundException("Region not found");
    return region;
  }
}
