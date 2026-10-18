"use client";
import { useEffect, useSyncExternalStore } from "react";
import { followsSystemLanguage, getSiteLanguage, initializeSiteLanguage, SITE_LANGUAGE_KEY, subscribeSiteLanguage } from "./store";

export function useSiteLanguage() { return useSyncExternalStore(subscribeSiteLanguage, getSiteLanguage, () => "ru" as const); }
export function useInitializeSiteLanguage() {
  useEffect(() => {
    initializeSiteLanguage();
    const storage = (event: StorageEvent) => { if (event.key === SITE_LANGUAGE_KEY || event.key === null) initializeSiteLanguage(); };
    const system = () => { if (followsSystemLanguage()) initializeSiteLanguage(); };
    window.addEventListener("storage", storage); window.addEventListener("languagechange", system);
    return () => { window.removeEventListener("storage", storage); window.removeEventListener("languagechange", system); };
  }, []);
}
