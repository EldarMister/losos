import { IsBoolean, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { STAFF_ROLES, type PermissionOverrides, type StaffRole } from "./admin-permissions";

export class StaffLoginDto {
  @IsString() @MinLength(3) @MaxLength(100) login!: string;
  @IsString() @MinLength(1) @MaxLength(256) password!: string;
}
export class StaffBootstrapDto {
  @IsString() @MaxLength(1024) bootstrapToken!: string;
  @IsString() @Matches(/^[a-zA-Z0-9._@+-]{3,100}$/) login!: string;
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @MinLength(12) @MaxLength(256) password!: string;
}
export class CreateStaffDto {
  @IsString() @Matches(/^[a-zA-Z0-9._@+-]{3,100}$/) login!: string;
  @IsString() @IsNotEmpty() @MaxLength(140) name!: string;
  @IsString() @MinLength(12) @MaxLength(256) password!: string;
  @IsOptional() @IsIn(STAFF_ROLES) role?: StaffRole;
  @IsOptional() @IsObject() permissions?: PermissionOverrides;
}
export class UpdateStaffDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(140) name?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @MinLength(12) @MaxLength(256) password?: string;
}
export class UpdateStaffAccessDto {
  @IsOptional() @IsIn(STAFF_ROLES) role?: StaffRole;
  @IsOptional() @IsObject() permissions?: PermissionOverrides;
}
export class UpdateOwnPasswordDto {
  @IsString() @MaxLength(256) currentPassword!: string;
  @IsString() @MinLength(12) @MaxLength(256) password!: string;
}
export class UpdateCustomerProfileDto {
  @IsString() @MaxLength(140) name!: string;
  @IsString() @MaxLength(2000) notes!: string;
}
