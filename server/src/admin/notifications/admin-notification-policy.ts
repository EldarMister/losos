/** Only browser push services may be contacted. A staff-controlled URL must never
 * turn the notification sender into an arbitrary HTTP client. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
    return url.hostname === "fcm.googleapis.com"
      || url.hostname === "updates.push.services.mozilla.com"
      || url.hostname === "web.push.apple.com"
      || url.hostname.endsWith(".notify.windows.com");
  } catch { return false; }
}

export function validEventCursor(value?: string): string | undefined {
  return value && /^\d{1,18}$/.test(value) ? value : undefined;
}
