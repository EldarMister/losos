import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { Category } from "./category.entity";
import { Product } from "./product.entity";
import { PickupLocation } from "./pickup-location.entity";
import { Promotion } from "./promotion.entity";
import { Region } from "./region.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Region, Category, Product, Promotion, PickupLocation])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
