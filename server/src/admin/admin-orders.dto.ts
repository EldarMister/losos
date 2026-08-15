import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { OrderStatus } from "../orders/order.enums";

export const ADMIN_ANALYTICS_PERIODS = ["today", "week", "month", "all"] as const;
export type AdminAnalyticsPeriod = typeof ADMIN_ANALYTICS_PERIODS[number];

export class AdminAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region = "bishkek";

  @IsOptional()
  @IsIn(ADMIN_ANALYTICS_PERIODS)
  period: AdminAnalyticsPeriod = "week";
}

export class AdminCustomersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region = "bishkek";

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search = "";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

export const ADMIN_NFT_WITHDRAWAL_STATUSES = [
  "owned",
  "pending",
  "submitted",
  "withdrawn",
  "failed",
] as const;
export type AdminNftWithdrawalStatus = typeof ADMIN_NFT_WITHDRAWAL_STATUSES[number];

export class AdminNftWithdrawalsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsIn(ADMIN_NFT_WITHDRAWAL_STATUSES)
  status?: AdminNftWithdrawalStatus;
}

export class ListOrdersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  regionSlug?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
