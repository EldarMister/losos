import { Transform } from "class-transformer";
import {
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.replace(/[\s()-]/g, "") : value;

class PhoneDto {
  @Transform(normalizePhone)
  @Matches(/^\+(?:996\d{9}|7\d{10})$/, {
    message: "Введите телефон в формате +996 XXX XXX XXX",
  })
  phone!: string;
}

export class RequestPhoneCodeDto extends PhoneDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  captchaToken!: string;
}

export class VerifyPhoneCodeDto extends PhoneDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: "Введите шестизначный код" })
  code!: string;
}

export class RequestWhatsappAuthDto extends PhoneDto {}

export class CheckWhatsappAuthDto {
  @IsUUID()
  challengeId!: string;

  @IsString()
  @Length(64, 64)
  pollToken!: string;
}

export class WithdrawNftDto {
  @IsString()
  @MinLength(16)
  @MaxLength(200)
  @Matches(/^\S+$/, { message: "Адрес кошелька не должен содержать пробелы" })
  walletAddress!: string;
}
