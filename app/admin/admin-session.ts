export const ADMIN_SESSION_KEY = "nakta-admin-session";
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Stores = { persistent: Store | null; temporary: Store | null };
const validToken = (value: string | null): value is string => !!value && /^[a-f0-9]{64}$/.test(value);

function browserStores(): Stores {
  let persistent: Store | null = null;
  let temporary: Store | null = null;
  try { persistent = window.localStorage; } catch { /* Browser may block storage. */ }
  try { temporary = window.sessionStorage; } catch { /* In-memory login still works. */ }
  return { persistent, temporary };
}
function read(store: Store | null) {
  try { return store?.getItem(ADMIN_SESSION_KEY) ?? null; } catch { return null; }
}

export function saveAdminSession(token: string, stores = browserStores()) {
  try {
    if (stores.persistent) {
      stores.persistent.setItem(ADMIN_SESSION_KEY, token);
      try { stores.temporary?.removeItem(ADMIN_SESSION_KEY); } catch { /* Optional legacy cleanup. */ }
      return;
    }
  } catch { /* Fall back to tab storage when persistence is blocked. */ }
  try { stores.temporary?.setItem(ADMIN_SESSION_KEY, token); } catch { /* Current in-memory session remains usable. */ }
}

export function readAdminSession(stores = browserStores()): string {
  const saved = read(stores.persistent);
  if (validToken(saved)) return saved;
  const legacy = read(stores.temporary);
  if (!validToken(legacy)) return "";
  saveAdminSession(legacy, stores);
  return legacy;
}

// A late 401/logout from an old tab must not erase a newer login on the device.
export function clearAdminSession(expectedToken?: string, stores = browserStores()) {
  for (const store of [stores.persistent, stores.temporary]) {
    try {
      if (expectedToken === undefined || read(store) === expectedToken) store?.removeItem(ADMIN_SESSION_KEY);
    } catch { /* Clearing React state still logs this tab out. */ }
  }
}
