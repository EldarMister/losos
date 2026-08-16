import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
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

export class DeliveryZonePointDto {
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsLongitude()
  longitude!: number;
}

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
  @IsOptional() @IsString() @MaxLength(10) deliveryOpenTime = "11:30";
  @IsOptional() @IsString() @MaxLength(10) deliveryCloseTime = "22:30";
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() deliveryIs24Hours = false;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) freeDeliveryThreshold = 4900;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) deliveryFee = 99;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(600) estimatedDeliveryMinutes = 50;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) minimumOrderAmount = 900;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(POSTGRES_INTEGER_MAX) maximumOrderAmount = 30000;
  @IsOptional() @IsArray() @ArrayMinSize(3) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => DeliveryZonePointDto) deliveryZone?: DeliveryZonePointDto[];
  @IsOptional() @IsString() @MaxLength(120) footerCompanyName = "";
  @IsOptional() @IsString() @MaxLength(500) footerLegalInfo = "";
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10_000) nftRewardEveryOrders = 10;
  @IsOptional() @IsString() @MaxLength(160) nftRewardName = "NFT NAKTA";
  @IsOptional() @IsString() @MaxLength(2_000_000) nftRewardImage = "";
  @IsOptional() @IsString() @MaxLength(2_000) nftRewardDescription = "";
  @IsOptional() @IsIn(["polygon", "ethereum", "bsc", "solana", "ton"]) nftRewardNetwork = "polygon";
  @IsOptional() @IsString() @MaxLength(200) nftContractAddress = "";
  @IsOptional() @IsString() @MaxLength(2_000) nftMetadataUri = "";
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
  @IsOptional() @IsString() @MaxLength(10) deliveryOpenTime?: string;
  @IsOptional() @IsString() @MaxLength(10) deliveryCloseTime?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() deliveryIs24Hours?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) freeDeliveryThreshold?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) deliveryFee?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(600) estimatedDeliveryMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) minimumOrderAmount?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(POSTGRES_INTEGER_MAX) maximumOrderAmount?: number;
  @IsOptional() @IsArray() @ArrayMinSize(3) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => DeliveryZonePointDto) deliveryZone?: DeliveryZonePointDto[];
  @IsOptional() @IsString() @MaxLength(120) footerCompanyName?: string;
  @IsOptional() @IsString() @MaxLength(500) footerLegalInfo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10_000) nftRewardEveryOrders?: number;
  @IsOptional() @IsString() @MaxLength(160) nftRewardName?: string;
  @IsOptional() @IsString() @MaxLength(2_000_000) nftRewardImage?: string;
  @IsOptional() @IsString() @MaxLength(2_000) nftRewardDescription?: string;
  @IsOptional() @IsIn(["polygon", "ethereum", "bsc", "solana", "ton"]) nftRewardNetwork?: string;
  @IsOptional() @IsString() @MaxLength(200) nftContractAddress?: string;
  @IsOptional() @IsString() @MaxLength(2_000) nftMetadataUri?: string;
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(POSTGRES_INTEGER_MAX)
  oldPrice?: number | null;

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
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  naktaCoins = 0;

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
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(POSTGRES_INTEGER_MAX) oldPrice?: number | null;
  @IsOptional() @IsString() @IsNotEmpty() image?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() composition?: string;
  @IsOptional() @Transform(optionalBoolean) @IsBoolean() isNew?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000) naktaCoins?: number;
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

export class UpdateNftWithdrawalDto {
  @IsIn(["submitted", "withdrawn", "failed"])
  status!: "submitted" | "withdrawn" | "failed";

  @IsOptional() @IsString() @MaxLength(200) txHash?: string;
  @IsOptional() @IsString() @MaxLength(160) tokenId?: string;
  @IsOptional() @IsString() @MaxLength(1_000) error?: string;
}

export class UpdateNaktaCoinWithdrawalDto {
  @IsIn(["submitted", "withdrawn", "failed"])
  status!: "submitted" | "withdrawn" | "failed";

  @IsOptional() @IsString() @MaxLength(200) txHash?: string;
  @IsOptional() @IsString() @MaxLength(1_000) error?: string;
}
