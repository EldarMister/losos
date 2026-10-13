import { messages } from "./messages";
import { adminLanguage, translateAdmin as t } from "./store";

export function adminErrorMessage(message: string, status: number) {
  const key = message.trim();
  if (adminLanguage() === "ru") return key || t("Не удалось выполнить запрос");
  if (messages[key]) return t(key);
  if (messages[key.replace(/\.$/, "")]) return t(key.replace(/\.$/, ""));
  if (status === 401) return t("Сеанс завершён. Войдите снова.");
  if (status === 403) return t("Недостаточно прав для этого действия");
  if (status >= 500) return t("Ошибка сервера. Повторите попытку позже.");
  return t("Сервер отклонил запрос. Проверьте данные и повторите попытку.");
}
