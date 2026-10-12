export type OrderNotice = { id: string; orderId: string; orderNumber: number; createdAt: string; audible: boolean };
type StoragePort = Pick<Storage, "getItem" | "setItem">;
type LockPort = { request<T>(name: string, callback: () => T | Promise<T>): Promise<T> };

/** One atomic claim across all tabs. Without Web Locks we deliberately keep
 * visual notifications only, instead of risking simultaneous audio. */
export async function claimOrderSound(
  staffId: string, event: OrderNotice, storage: StoragePort, locks?: LockPort, now = Date.now(),
): Promise<boolean> {
  const age = now - Date.parse(event.createdAt);
  if (!event.audible || !event.id || !Number.isFinite(age) || age < -5000 || age > 30_000 || !locks) return false;
  return locks.request(`nakta-admin-sound:${staffId}`, () => {
    const key = `nakta-admin-sound-seen:${staffId}`;
    let seen: Record<string, number> = {};
    try { seen = JSON.parse(storage.getItem(key) || "{}"); } catch { /* start with an empty, bounded ledger */ }
    if (Object.hasOwn(seen, event.id)) return false;
    seen = Object.fromEntries(Object.entries(seen).filter(([, timestamp]) => now - timestamp < 86_400_000));
    seen[event.id] = now;
    storage.setItem(key, JSON.stringify(seen));
    return true;
  });
}

export function parseSseFrame(frame: string): { type: string; id?: string; data: unknown } | null {
  let type = "message";
  let id: string | undefined;
  const data: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) type = line.slice(6).trim();
    if (line.startsWith("id:")) id = line.slice(3).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!data.length) return null;
  try { return { type, id, data: JSON.parse(data.join("\n")) }; } catch { return null; }
}

/** Heartbeat/transport IDs are not database sequence cursors. */
export function orderEventCursor(event: { type: string; id?: string }): string | undefined {
  return (event.type === "sync" || event.type === "order.created") && event.id && /^\d{1,18}$/.test(event.id) ? event.id : undefined;
}
