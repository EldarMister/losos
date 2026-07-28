import { Transform } from "class-transformer";
import { IsString, Matches } from "class-validator";

const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.replace(/[\s()-]/g, "") : value;

export class RequestPhoneCodeDto {
  @Transform(normalizePhone)
  @Matches(/^\+(?:996\d{9}|7\d{10})$/, {
    message: "Введите телефон в формате +996 XXX XXX XXX",
  })
  phone!: string;
}

export class VerifyPhoneCodeDto extends RequestPhoneCodeDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: "Введите шестизначный код" })
  code!: string;
}
