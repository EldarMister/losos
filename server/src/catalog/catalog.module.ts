import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
import { Category } from "./category.entity";
import { Product } from "./product.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product])],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
