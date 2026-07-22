import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  categories() {
    return this.catalog.categories();
  }

  @Get("products")
  products(@Query("search") search?: string, @Query("category") category?: string) {
    return this.catalog.products({ search, category });
  }

  @Get("products/:id")
  product(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.product(id);
  }
}
