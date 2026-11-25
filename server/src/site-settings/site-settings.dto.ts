import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from "class-validator";

const trim = ({ value }: { value: unknown }) => typeof value === "string" ? value.trim() : value;
export class SiteContactsDto {
  @Transform(trim) @IsString() @MaxLength(40) @Matches(/^\+?[0-9][0-9 ()-]{5,38}[0-9]$/) phone!: string;
  @Transform(trim) @IsString() @MaxLength(160) @IsEmail() email!: string;
  @Transform(trim) @IsString() @MaxLength(240) address!: string;
  @Transform(({ value }) => typeof value === "string" ? value.trim().replace(/^@/, "") : value)
  @IsString() @MaxLength(30) @ValidateIf((_, value) => value !== "") @Matches(/^[a-zA-Z0-9_][a-zA-Z0-9_.]*$/) instagram!: string;
}
export class UpdateSiteContactsDto {
  @IsString() @MaxLength(100) @Matches(/^[a-z0-9][a-z0-9-]*$/) target!: string;
  @IsOptional() @IsBoolean() useGlobal?: boolean;
  @IsOptional() @ValidateNested() @Type(() => SiteContactsDto) contacts?: SiteContactsDto;
}
