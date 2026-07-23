import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Category } from "./category.entity";
import { Product } from "./product.entity";
import { Promotion } from "./promotion.entity";
import { Region } from "./region.entity";
import { seedCategories } from "./seed-data";

const defaultRegions = [
  { slug: "bishkek", name: "Бишкек", sortOrder: 0 },
  { slug: "osh", name: "Ош", sortOrder: 1 },
] as const;

const defaultPromotions = [
  {
    title: "Скидка студентам",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/b92972a55683d636714fea75d11469ce_resize_in_box_2048_2048.png",
    cta: "Подробнее",
  },
  {
    title: "Промокоды и подарки",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/c1a7cfbda01814519b617dda85ec062a_resize_in_box_2048_2048.jpg",
    cta: "Смотреть",
  },
  {
    title: "Удовольствие есть",
    image: "https://storage.yandexcloud.net/thapl-public/thapl-project172/img/shared/19fb66365769d651613e33c969235601_resize_in_box_2048_2048.jpg",
    cta: "",
  },
] as const;

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(Region) private readonly regionRepository: Repository<Region>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Promotion) private readonly promotionRepository: Repository<Promotion>,
  ) {}

  async onModuleInit() {
    for (const definition of defaultRegions) {
      let region = await this.regionRepository.findOne({ where: { slug: definition.slug } });
      if (!region) {
        region = await this.regionRepository.save(this.regionRepository.create(definition));
      }
      if (await this.categoryRepository.count({ where: { region: { id: region.id } } })) continue;

      for (const [categoryIndex, entry] of seedCategories.entries()) {
        const category = await this.categoryRepository.save(this.categoryRepository.create({
          slug: entry.slug,
          title: entry.title,
          sortOrder: categoryIndex,
          region,
        }));
        const products = entry.products.map((seed, productIndex) => {
          const { id: sourceId, ...product } = seed;
          return this.productRepository.create({
            ...product,
            sourceId,
            sortOrder: productIndex,
            available: true,
            composition: "",
            category,
          });
        });
        await this.productRepository.save(products);
      }

      const promotions = defaultPromotions.map((promotion, index) => this.promotionRepository.create({
        ...promotion,
        sortOrder: index,
        enabled: true,
        region,
      }));
      await this.promotionRepository.save(promotions);
    }
  }

  regions() {
    return this.regionRepository.find({
      where: { enabled: true },
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
