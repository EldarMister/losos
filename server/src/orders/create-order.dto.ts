import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { DeliveryType, PaymentMethod } from "./order.enums";

const trim = ({ value }: { value: unknown }) => typeof value === "string" ? value.trim() : value;
const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.replace(/[\s()-]/g, "") : value;
const normalizePaymentMethod = ({ value }: { value: unknown }) =>
  value === "card_on_delivery" ? PaymentMethod.CARD : value;
const normalizeOptionalNumber = ({ value }: { value: unknown }) =>
  value === "" || value === null || value === undefined ? undefined : Number(value);

export class CreateOrderModifierDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  groupId!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  itemId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity = 1;
}

export class CreateOrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderModifierDto)
  modifiers: CreateOrderModifierDto[] = [];
}

export class CreateOrderDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9._:-]{7,119}$/)
  idempotencyKey?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  regionSlug = "bishkek";

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType = DeliveryType.DELIVERY;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName!: string;

  @Transform(normalizePhone)
  @Matches(/^\+(?:7\d{10}|996\d{9})$/, {
    message: "phone must be a KG or RU number in E.164 format",
  })
  phone!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address!: string;

  @IsOptional()
  @Transform(normalizeOptionalNumber)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Transform(normalizeOptionalNumber)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  apartment = "";

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  entrance = "";

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  floor = "";

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  intercom = "";

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  comment = "";

  @IsOptional()
  @Transform(normalizePaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod = PaymentMethod.CASH;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  utensilsCount = 1;

  @IsOptional()
  @IsBoolean()
  noUtensils = false;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
