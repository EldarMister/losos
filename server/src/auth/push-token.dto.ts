import { Transform } from "class-transformer";
import { IsIn, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class RegisterPushTokenDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.replace(/[\s()-]/g, "") : value)
  @IsString()
  @Matches(/^\+(?:996\d{9}|7\d{10})$/)
  phone!: string;

  @IsUUID()
  deviceId!: string;

  @IsString()
  @MaxLength(255)
  @Matches(/^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/)
  expoPushToken!: string;

  @IsIn(["android", "ios"])
  platform!: "android" | "ios";
}
