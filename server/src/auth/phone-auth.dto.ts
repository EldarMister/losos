import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Max,
  Min,
  MinLength,
} from "class-validator";

const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.replace(/[\s()-]/g, "") : value;

export class RequestPhoneCodeDto {
  @Transform(normalizePhone)
  @Matches(/^\+996\d{9}$/, {
    message: "Введите телефон в формате +996 XXX XXX XXX",
  })
  phone!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  captchaToken!: string;
}

export class VerifyPhoneCodeDto {
  @Transform(normalizePhone)
  @Matches(/^\+996\d{9}$/, {
    message: "Введите телефон в формате +996 XXX XXX XXX",
  })
  phone!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: "Введите шестизначный код" })
  code!: string;
}

export class RegisterPushTokenDto {
  @Transform(normalizePhone)
  @Matches(/^\+996\d{9}$/)
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

export class WithdrawNftDto {
  @IsString()
  @MinLength(16)
  @MaxLength(200)
  @Matches(/^\S+$/, { message: "Адрес кошелька не должен содержать пробелы" })
  walletAddress!: string;
}

export class WithdrawNaktaCoinsDto extends WithdrawNftDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  amount!: number;
}
