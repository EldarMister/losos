import { WEB_URL } from "./api";
import type { Region } from "./types";

export function supportUrl(region: Region | null | undefined) {
  const phone = region?.contactPhone?.trim();
  if (!phone) return region?.slug
    ? `${WEB_URL}/support?region=${encodeURIComponent(region.slug)}`
    : `${WEB_URL}/support`;
  const normalized = phone.replace(/[^+\d]/g, "");
  return normalized ? `tel:${normalized}` : `${WEB_URL}/support`;
}
