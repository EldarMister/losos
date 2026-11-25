export type SiteContacts = { phone: string; email: string; address: string; instagram: string };
export type SiteContactSettings = { global: SiteContacts; overrides: Record<string, SiteContacts> };
export const DEFAULT_SITE_CONTACTS: SiteContacts = {
  phone: "0505614614", email: "naktasushi@gmail.com", address: "Ош, ул. Алиева, 104", instagram: "naktasushi_osh",
};
export const SITE_OPERATOR_NAME = "ИП Мусаев Жаныбек Кочкорбаевич";
export const SITE_OPERATOR_ADDRESS = "Ошская область, Кара-Суйский район, с. Отуз-Адыр, ул. Токтогула, дом 4";
export function contactPhoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.length === 10 && digits.startsWith("0") ? `+996${digits.slice(1)}` : phone.trim().startsWith("+") ? `+${digits}` : digits}`;
}
export function instagramHref(username: string) { return `https://www.instagram.com/${encodeURIComponent(username)}/`; }
export function readSiteContacts(value: unknown): SiteContacts | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (!["phone", "email", "address", "instagram"].every(key => typeof data[key] === "string")) return null;
  if (!/^\+?[0-9][0-9 ()-]{5,38}[0-9]$/.test(data.phone as string) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string) || !/^[a-zA-Z0-9_][a-zA-Z0-9_.]*$|^$/.test(data.instagram as string)) return null;
  return { phone: data.phone as string, email: data.email as string, address: data.address as string, instagram: data.instagram as string };
}
