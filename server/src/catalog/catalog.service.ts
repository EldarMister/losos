import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Category } from "./category.entity";
import { Product } from "./product.entity";
import { seedCategories } from "./seed-data";

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    if (await this.categoryRepository.count()) return;
    for (const [sortOrder, entry] of seedCategories.entries()) {
      const category = await this.categoryRepository.save(this.categoryRepository.create({ slug: entry.slug, title: entry.title, sortOrder }));
      await this.productRepository.save(entry.products.map((product) => this.productRepository.create({ ...product, category })));
    }
  }

  categories() {
    return this.categoryRepository.find({ relations: { products: true }, order: { sortOrder: "ASC", products: { id: "ASC" } } });
  }

  products(filters: { search?: string; category?: string }) {
    return this.productRepository.find({
      where: {
        ...(filters.search ? { name: ILike(`%${filters.search}%`) } : {}),
        ...(filters.category ? { category: { slug: filters.category } } : {}),
      },
      relations: { category: true },
      order: { id: "ASC" },
    });
  }

  async product(id: number) {
    const product = await this.productRepository.findOne({ where: { id }, relations: { category: true } });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }
}
