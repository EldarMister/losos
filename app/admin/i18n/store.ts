import { messages } from "./messages";

export const ADMIN_LANGUAGE_KEY = "nakta-admin-language";
export const adminLanguages = ["ru", "ky", "uz", "en", "kk"] as const;
export type AdminLanguage = typeof adminLanguages[number];
export type LanguagePreference = AdminLanguage | "auto";
export const languageNames: Record<AdminLanguage, string> = { ru: "Русский", ky: "Кыргызча", uz: "O‘zbekcha", en: "English", kk: "Қазақша" };
let language: AdminLanguage = "ru";
let preference: LanguagePreference = "auto";
const listeners = new Set<() => void>();
const isLanguage = (value: unknown): value is AdminLanguage => adminLanguages.includes(value as AdminLanguage);
export function systemLanguage(languages: readonly string[]): AdminLanguage {
  for (const item of languages) { const base = item.toLowerCase().split(/[-_]/)[0]; if (isLanguage(base)) return base; }
  return "ru";
}
export function initializeAdminLanguage() {
  if (typeof window === "undefined") return;
  let saved: string | null = null;
  try { saved = localStorage.getItem(ADMIN_LANGUAGE_KEY); } catch { /* Preferences are optional. */ }
  preference = isLanguage(saved) ? saved : "auto";
  language = preference === "auto" ? systemLanguage(navigator.languages.length ? navigator.languages : [navigator.language]) : preference;
  listeners.forEach(listener => listener());
}
export function setAdminLanguage(next: LanguagePreference) {
  if (typeof window === "undefined") return;
  preference = next;
  language = next === "auto" ? systemLanguage(navigator.languages.length ? navigator.languages : [navigator.language]) : next;
  try { if (next === "auto") localStorage.removeItem(ADMIN_LANGUAGE_KEY); else localStorage.setItem(ADMIN_LANGUAGE_KEY, next); } catch { /* In-memory choice remains available. */ }
  listeners.forEach(listener => listener());
}
export const subscribeAdminLanguage = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const adminLanguage = () => typeof window === "undefined" ? "ru" : language;
export const adminLanguagePreference = () => preference;
export const adminLanguageSnapshot = () => `${preference}:${language}`;
export const adminLocale = () => ({ ru: "ru-RU", ky: "ky-KG", uz: "uz-UZ", en: "en-GB", kk: "kk-KZ" })[adminLanguage()];
export function translateAdmin(text: string, params: Record<string, unknown> = {}, locale: AdminLanguage = adminLanguage()): string {
  const key = text.trim();
  const translated = locale === "ru" ? key : messages[key]?.[locale] ?? key;
  const result = text.slice(0, text.indexOf(key)) + translated + text.slice(text.indexOf(key) + key.length);
  return result.replace(/\{(\d+|[a-zA-Z][\w]*)\}/g, (match, name: string) => Object.hasOwn(params, name) ? String(params[name] ?? "") : match);
}
