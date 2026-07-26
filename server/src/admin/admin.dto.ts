import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { POSTGRES_INTEGER_MAX } from "../common/numeric-limits";

const optionalBoolean = ({ value }: { value: unknown }) => value === true || value === "true";

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional() @Transform(optionalBoolean) @IsBoolean() enabled = true;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder = 0;
  @IsOptional() @IsString() @MaxLength(40) contactPhone = "";
  @IsOptional() @IsString() @MaxLength(160) contactEmail = "";
  @IsOptional() @IsString() @MaxLength(240) contactAddress = "";
  @IsOptional() @IsString() @MaxLength(240) pickupAddress = "";
  @IsOptional() @IsString() @MaxLength(500) pickupYandexUrl = "";
  @IsOptional() @IsString() @MaxLength(120) pickupWorkingHours = "";
  @IsOptional() @IsString() @MaxLength(120) footerCompanyName = "";
  @IsOptional() @IsString() @MaxLength(500) footerLegalInfo = "";
}

export class UpdateRegionDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) name?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(40) contactPhone?: string;
  @IsOptional() @IsString() @MaxLength(160) contactEmail?: string;
  @IsOptional() @IsString() @MaxLength(240) contactAddress?: string;
  @IsOptional() @IsString() @MaxLength(240) pickupAddress?: string;
  @IsOptional() @IsString() @MaxLength(500) pickupYandexUrl?: string;
  @IsOptional() @IsString() @MaxLength(120) pickupWorkingHours?: string;
  @IsOptional() @IsString() @MaxLength(120) footerCompanyName?: string;
  @IsOptional() @IsString() @MaxLength(500) footerLegalInfo?: string;
}

export class ProductModifierItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INTEGER_MAX)
  price!: number;

  @IsString()
  @MaxLength(2_000_000)
  image = "";

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  enabled = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  maxQuantity?: number;
}

export class ProductModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @IsIn(["single", "multiple"])
  selectionType!: "single" | "multiple";

  @IsOptional()
  @IsIn(["rows", "cards"])
  presentation?: "rows" | "cards";

  @Transform(optionalBoolean)
  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  minSelections?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  maxSelections?: number;

  @IsOptional()
  @IsIn(["per-product", "per-line"])
  priceScope?: "per-product" | "per-line";

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductModifierItemDto)
  items!: ProductModifierItemDto[];
}

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
  @Max(POSTGRES_INTEGER_MAX)
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
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductModifierGroupDto)
  modifierGroups: ProductModifierGroupDto[] = [];

  @Transform(optionalBoolean)
  @IsBoolean()
  available = true;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INTEGER_MAX)
  price?: number;
  @IsOptional() @IsString() @IsNotEmpty() image?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() composition?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() isNew?: boolean;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductModifierGroupDto)
  modifierGroups?: ProductModifierGroupDto[];
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() available?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) weight?: number;
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

  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== "")
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
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== "")
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(500)
  ctaUrl?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() enabled?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sortOrder?: number;
}
