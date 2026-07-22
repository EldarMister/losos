import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsPhoneNumber, Min, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  customerName!: string;

  @IsPhoneNumber("RU")
  phone!: string;

  @IsNotEmpty()
  address!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
