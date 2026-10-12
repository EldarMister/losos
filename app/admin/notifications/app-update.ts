/** controllerchange is not guaranteed when a waiting worker became active in
 * another tab. Refresh the network-only admin HTML even in that case. */
export function activateAdminUpdate(events: Pick<EventTarget, "addEventListener" | "removeEventListener">, worker: Pick<ServiceWorker, "postMessage"> | null, reload: () => void, timeoutMs = 3000) {
  let finished = false;
  const cleanup = () => {
    clearTimeout(timer);
    events.removeEventListener("controllerchange", finish);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    reload();
  };
  const timer = setTimeout(finish, timeoutMs);
  events.addEventListener("controllerchange", finish);
  try {
    if (worker) worker.postMessage({ type: "ACTIVATE_UPDATE" });
    else finish();
  } catch { finish(); }
  return () => { finished = true; cleanup(); };
}
