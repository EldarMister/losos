import "server-only";
import { DEFAULT_SITE_CONTACTS, readSiteContacts } from "./site-settings";
export async function getSiteContacts(region?: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "https://losos-production.up.railway.app/api")).replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/site-settings${region ? `?region=${encodeURIComponent(region)}` : ""}`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.ok) return readSiteContacts(await response.json()) ?? { ...DEFAULT_SITE_CONTACTS };
  } catch { /* Contacts remain available if the API is temporarily unreachable. */ }
  return { ...DEFAULT_SITE_CONTACTS };
}
