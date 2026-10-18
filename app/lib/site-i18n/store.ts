import { messages } from "./messages";

export type SiteLanguage = "ru" | "ky" | "en" | "uz" | "kk";
export const SITE_LANGUAGE_KEY = "nakta.language.v1";
export const siteLanguages: Array<{ code: SiteLanguage; label: string; locale: string }> = [
  { code: "ru", label: "Русский", locale: "ru-RU" },
  { code: "ky", label: "Кыргызча", locale: "ky-KG" },
  { code: "en", label: "English", locale: "en-GB" },
  { code: "uz", label: "O‘zbekcha", locale: "uz-UZ" },
  { code: "kk", label: "Қазақша", locale: "kk-KZ" },
];
let language: SiteLanguage = "ru";
let manual = false;
const listeners = new Set<() => void>();
const valid = (value: unknown): value is SiteLanguage => siteLanguages.some(item => item.code === value);
export function resolveSiteLanguage(preferences: readonly string[]): SiteLanguage {
  for (const preference of preferences) { const base = preference.toLowerCase().split(/[-_]/)[0]; if (valid(base)) return base; }
  return "en";
}
export function initializeSiteLanguage() {
  if (typeof window === "undefined") return;
  let saved: string | null = null;
  try { saved = localStorage.getItem(SITE_LANGUAGE_KEY); } catch { /* In-memory selection remains available. */ }
  manual = valid(saved);
  language = valid(saved) ? saved : resolveSiteLanguage(navigator.languages.length ? navigator.languages : [navigator.language]);
  listeners.forEach(listener => listener());
}
export function setSiteLanguage(next: SiteLanguage) {
  if (typeof window === "undefined" || !valid(next)) return;
  manual = true; language = next;
  try { localStorage.setItem(SITE_LANGUAGE_KEY, next); } catch { /* Keep the current page usable. */ }
  listeners.forEach(listener => listener());
}
export const followsSystemLanguage = () => !manual;
export const getSiteLanguage = (): SiteLanguage => typeof window === "undefined" ? "ru" : language;
export const siteLocale = () => siteLanguages.find(item => item.code === getSiteLanguage())!.locale;
export const subscribeSiteLanguage = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const normalize = (text: string) => text.trim().replace(/[ \t]+/g, " ");
const dictionary = new Map(Object.entries(messages).map(([key, value]) => [normalize(key), value]));
export function translateSite(text: string, params: Record<string, unknown> = {}, selected: SiteLanguage = getSiteLanguage()): string {
  const value = dictionary.get(normalize(text))?.[selected] ?? text.trim();
  const translated = value.replace(/\{(\d+)\}/g, (placeholder, key: string) => Object.hasOwn(params, key) ? String(params[key] ?? "") : placeholder);
  return `${text.match(/^\s*/)?.[0] ?? ""}${translated}${text.match(/\s*$/)?.[0] ?? ""}`;
}
