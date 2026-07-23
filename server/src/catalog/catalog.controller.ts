import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("regions")
  regions() {
    return this.catalog.regions();
  }

  @Get("categories")
  categories(@Query("region") region?: string) {
    return this.catalog.categories(region);
  }

  @Get("promotions")
  promotions(@Query("region") region?: string) {
    return this.catalog.promotions(region);
  }

  @Get("products")
  products(@Query("search") search?: string, @Query("category") category?: string, @Query("region") region?: string) {
    return this.catalog.products({ search, category, region });
  }

  @Get("products/:id")
  product(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.product(id);
  }
}
