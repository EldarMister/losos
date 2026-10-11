export const CATALOG_UPDATED_EVENT = "losos:catalog-updated";
export const CATALOG_UPDATE_STORAGE_KEY = "losos.catalog-update.v1";

export function notifyCatalogUpdated() {
  window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
  try {
    window.localStorage.setItem(CATALOG_UPDATE_STORAGE_KEY, `${Date.now()}-${Math.random()}`);
  } catch {
    // Other tabs will still refresh the catalog when they regain focus.
  }
}
