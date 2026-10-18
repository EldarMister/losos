"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Languages } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ADMIN_LANGUAGE_KEY, adminLanguagePreference, adminLanguageSnapshot, adminLanguages, initializeAdminLanguage, languageNames, setAdminLanguage, subscribeAdminLanguage, translateAdmin as t, type AdminLanguage } from "./store";

export function useAdminLanguage() { return useSyncExternalStore(subscribeAdminLanguage, adminLanguageSnapshot, () => "auto:ru").split(":")[1] as AdminLanguage; }
export function useInitializeAdminLanguage() {
  useEffect(() => {
    initializeAdminLanguage();
    const storage = (event: StorageEvent) => { if (event.key === ADMIN_LANGUAGE_KEY || event.key === null) initializeAdminLanguage(); };
    const system = () => { if (adminLanguagePreference() === "auto") initializeAdminLanguage(); };
    window.addEventListener("storage", storage); window.addEventListener("languagechange", system);
    return () => { window.removeEventListener("storage", storage); window.removeEventListener("languagechange", system); };
  }, []);
}
export function AdminLanguageMenu() {
  const locale = useAdminLanguage();
  return <DropdownMenu><DropdownMenuTrigger render={<Button type="button" variant="outline" size="icon" aria-label={t("Язык панели")} title={t("Язык панели")} />}><Languages className="size-4" aria-hidden="true" /></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-44"><DropdownMenuGroup><DropdownMenuLabel>{t("Язык панели")}</DropdownMenuLabel></DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuGroup>{adminLanguages.map(item => <DropdownMenuItem key={item} lang={item} onClick={() => setAdminLanguage(item)} aria-current={adminLanguagePreference() === item ? "true" : undefined} className={locale === item ? "bg-accent font-medium" : undefined}>{languageNames[item]}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent>
  </DropdownMenu>;
}
