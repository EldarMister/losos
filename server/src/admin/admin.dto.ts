import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";
import type { ProductModifierGroup } from "../catalog/product.entity";

const optionalBoolean = ({ value }: { value: unknown }) => value === true || value === "true";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  regionSlug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  regionSlug!: string;

  @Type(() => Number)
  @IsInt()
  categoryId!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  slug!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  image!: string;

  @IsOptional()
  @IsString()
  description = "";

  @IsOptional()
  @IsString()
  composition = "";

  @Transform(optionalBoolean)
  @IsBoolean()
  isNew = false;

  @IsOptional()
  @IsArray()
  modifierGroups: ProductModifierGroup[] = [];

  @Transform(optionalBoolean)
  @IsBoolean()
  available = true;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  weight = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  protein = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  fat = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  carbs = 0;
}

export class UpdateProductDto {
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(140) name?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) slug?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() @IsNotEmpty() image?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() composition?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() isNew?: boolean;
  @IsOptional() @IsArray() modifierGroups?: ProductModifierGroup[];
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() available?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) weight?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) calories?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) protein?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) fat?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) carbs?: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  regionSlug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  image!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cta = "";

  @IsOptional()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  ctaUrl = "";

  @Transform(optionalBoolean)
  @IsBoolean()
  enabled = true;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;
}

export class UpdatePromotionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() image?: string;
  @IsOptional() @IsString() @MaxLength(80) cta?: string;
  @IsOptional() @IsUrl({ protocols: ["http", "https"], require_protocol: true }) @MaxLength(500) ctaUrl?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}
