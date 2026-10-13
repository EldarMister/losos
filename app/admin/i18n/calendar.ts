import { enGB, kk, ru, uz } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AdminLanguage } from "./store";

const kyMonths = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const kyDays = ["жекшемби", "дүйшөмбү", "шейшемби", "шаршемби", "бейшемби", "жума", "ишемби"];
const kyShortDays = ["Жш", "Дш", "Шш", "Шр", "Бш", "Жм", "Иш"];
const ky: Locale = { ...ru, code: "ky-KG", localize: { ...ru.localize,
  month: (index, options) => options?.width === "narrow" ? kyMonths[index].slice(0, 1) : options?.width === "abbreviated" ? kyMonths[index].slice(0, 3) : kyMonths[index],
  day: (index, options) => options?.width === "wide" ? kyDays[index] : options?.width === "narrow" ? kyShortDays[index].slice(0, 1) : kyShortDays[index],
} };
export const adminCalendarLocale = (language: AdminLanguage): Locale => ({ ru, ky, uz, en: enGB, kk })[language];
