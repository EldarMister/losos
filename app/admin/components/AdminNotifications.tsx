"use client";
import { translateAdmin as t } from "../i18n/store";
import { useAdminLanguage } from "../i18n/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellRing, Check, Download, Play, RefreshCw, Volume2, WifiOff, X } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Switch } from "../ui/switch";
import { claimOrderSound, orderEventCursor, parseSseFrame, type OrderNotice } from "../notifications/event-dedup";
import { DEFAULT_ORDER_SOUND_VOLUME, loadOrderSound, orderSoundVolume, playOrderSound, playRecordedOrderSound, type OrderSoundPlayback } from "../notifications/order-sound";
import { confirmAdminAction } from "../AdminConfirmationDialog";
import { confirmAdminNavigation, reloadAdminAfterConfirmation } from "../use-unsaved-changes";
import { readAdminSession } from "../admin-session";
import { activateAdminUpdate } from "../notifications/app-update";
import "../notifications/notifications.css";
type InstallEvent = Event & {
    prompt(): Promise<void>;
    userChoice: Promise<{
        outcome: string;
    }>;
};
type Props = {
    staffId: string;
    token: string;
    apiUrl: string;
    canViewOrders: boolean;
    onOrdersChanged?: () => void;
    onAccessRevoked: () => void;
    onOpenOrder?: (id: string) => void;
};
function registrationForAdmin() {
    return navigator.serviceWorker.getRegistration(new URL("/admin", location.origin).href);
}
/** Local delivery stops immediately, even when the server cannot be reached.
 * Successful server revocation also removes the session-bound subscription. */
export async function disconnectAdminDevice(apiUrl: string, token: string) {
    const controller = new AbortController();
    // Stop SSE/audio before any network or browser subscription awaits.
    window.dispatchEvent(new Event("admin:logout"));
    if ("serviceWorker" in navigator)
        navigator.serviceWorker.controller?.postMessage({ type: "LOGOUT" });
    try {
        for (const key of Object.keys(sessionStorage))
            if (key.startsWith("nakta-admin-events-cursor"))
                sessionStorage.removeItem(key);
    }
    catch { /* Optional cursor storage must not prevent logout. */ }
    const stillLoggingOut = () => {
        if (controller.signal.aborted)
            return false;
        const currentToken = readAdminSession();
        return !currentToken || currentToken === token;
    };
    const jobs: Promise<unknown>[] = [fetch(`${apiUrl}/admin/push/subscriptions`, {
            method: "DELETE", headers: { authorization: `Bearer ${token}` }, keepalive: true, signal: controller.signal,
        }).catch(() => undefined)];
    if ("serviceWorker" in navigator)
        jobs.push(registrationForAdmin().then(async (registration) => {
            if (!stillLoggingOut())
                return;
            registration?.active?.postMessage({ type: "LOGOUT" });
            const subscription = await registration?.pushManager?.getSubscription();
            if (stillLoggingOut())
                await subscription?.unsubscribe();
        }).catch(() => undefined));
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([Promise.allSettled(jobs), new Promise<void>(resolve => { timeout = setTimeout(() => { controller.abort(); resolve(); }, 4000); })]);
    }
    finally {
        clearTimeout(timeout);
        controller.abort();
    }
}
export function AdminNotifications({ staffId, token, apiUrl, canViewOrders, onOrdersChanged, onAccessRevoked, onOpenOrder }: Props) {
    useAdminLanguage();
    const [connection, setConnection] = useState<"connecting" | "online" | "offline" | "stopped">("connecting");
    const [online, setOnline] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [soundReady, setSoundReady] = useState(false);
    const [volume, setVolume] = useState(DEFAULT_ORDER_SOUND_VOLUME);
    const [message, setMessage] = useState("");
    const [notice, setNotice] = useState<OrderNotice | null>(null);
    const [pushState, setPushState] = useState<"off" | "on" | "busy" | "unsupported">("off");
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
    const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
    const [installed, setInstalled] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const audio = useRef<AudioContext | null>(null);
    const soundPlayback = useRef<OrderSoundPlayback | null>(null);
    const soundSequence = useRef(0);
    const updateCleanup = useRef<(() => void) | null>(null);
    const [updating, setUpdating] = useState(false);
    const soundRef = useRef({ enabled: false, volume: DEFAULT_ORDER_SOUND_VOLUME });
    const callbacks = useRef({ onOrdersChanged, onAccessRevoked, onOpenOrder });
    const stopRef = useRef<(() => void) | null>(null);
    const noticeIds = useRef(new Set<string>());
    useEffect(() => { callbacks.current = { onOrdersChanged, onAccessRevoked, onOpenOrder }; }, [onOrdersChanged, onAccessRevoked, onOpenOrder]);
    useEffect(() => {
        if (!("serviceWorker" in navigator) || !canViewOrders || !token)
            return;
        const openOrder = async (event: MessageEvent) => {
            if (event.data?.type !== "OPEN_ADMIN_ORDER" || typeof event.data.url !== "string")
                return;
            let target: URL;
            try {
                target = new URL(event.data.url, window.location.origin);
            }
            catch {
                return;
            }
            const orderId = target.searchParams.get("order");
            if (target.origin !== window.location.origin || target.pathname !== "/admin" || target.searchParams.get("section") !== "orders" || !orderId)
                return;
            if (!await confirmAdminNavigation())
                return;
            if (callbacks.current.onOpenOrder)
                callbacks.current.onOpenOrder(orderId);
            else
                window.location.assign(target.href);
            setNotice(null);
        };
        navigator.serviceWorker.addEventListener("message", openOrder);
        return () => navigator.serviceWorker.removeEventListener("message", openOrder);
    }, [canViewOrders, token]);
    const getAudioContext = useCallback(() => {
        if (audio.current && audio.current.state !== "closed")
            return audio.current;
        const context = new AudioContext();
        audio.current = context;
        context.onstatechange = () => { if (audio.current === context)
            setSoundReady(context.state === "running"); };
        setSoundReady(context.state === "running");
        return context;
    }, []);
    const playTone = useCallback(async (testOnly = false) => {
        const context = audio.current;
        if (!context || context.state !== "running") {
            setSoundReady(false);
            return;
        }
        const sequence = ++soundSequence.current;
        soundPlayback.current?.stop();
        const recording = await loadOrderSound(context);
        // Muting, logout, permission changes or a newer event cancel a pending load.
        if (sequence !== soundSequence.current || context !== audio.current || context.state !== "running" || (!testOnly && !soundRef.current.enabled))
            return;
        soundPlayback.current = recording
            ? playRecordedOrderSound(context, recording, soundRef.current.volume)
            : playOrderSound(context, soundRef.current.volume);
    }, []);
    useEffect(() => {
        const key = `nakta-admin-sound:${staffId}`;
        const resumeSound = () => {
            if (!soundRef.current.enabled || !canViewOrders || !token || !navigator.locks)
                return;
            try {
                const context = getAudioContext();
                void context.resume().then(() => { if (audio.current === context)
                    setSoundReady(context.state === "running"); }).catch(() => undefined);
            }
            catch { /* Keep the preference; a later gesture can retry. */ }
        };
        const readSettings = () => {
            try {
                const settings = JSON.parse(localStorage.getItem(key) || "{}");
                const enabled = settings?.enabled === true;
                const nextVolume = orderSoundVolume(settings?.volume);
                soundRef.current = { enabled, volume: nextVolume };
                soundPlayback.current?.setVolume(nextVolume);
                setVolume(nextVolume);
                setSoundEnabled(enabled);
                if (!enabled) {
                    soundSequence.current++;
                    soundPlayback.current?.stop();
                }
                else
                    resumeSound();
            }
            catch { /* Browsers with blocked storage still show visual notices. */ }
        };
        readSettings();
        const change = (event: StorageEvent) => { if (event.key === key || event.key === null)
            readSettings(); };
        const logout = () => {
            soundSequence.current++;
            stopRef.current?.();
            soundRef.current.enabled = false;
            setSoundEnabled(false);
            setNotice(null);
            noticeIds.current.clear();
            soundPlayback.current?.stop();
            soundPlayback.current = null;
            if (audio.current)
                audio.current.onstatechange = null;
            void audio.current?.close();
            audio.current = null;
            setSoundReady(false);
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.controller?.postMessage({ type: "LOGOUT" });
                void registrationForAdmin().then(value => {
                    const currentToken = readAdminSession();
                    if (!currentToken || currentToken === token)
                        value?.active?.postMessage({ type: "LOGOUT" });
                }).catch(() => undefined);
            }
        };
        window.addEventListener("storage", change);
        window.addEventListener("admin:logout", logout);
        const gesture = (event: Event) => { if (event.isTrusted)
            resumeSound(); };
        document.addEventListener("click", gesture, true);
        document.addEventListener("keydown", gesture, true);
        return () => { window.removeEventListener("storage", change); window.removeEventListener("admin:logout", logout); document.removeEventListener("click", gesture, true); document.removeEventListener("keydown", gesture, true); logout(); };
    }, [canViewOrders, getAudioContext, staffId, token]);
    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        update();
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
    }, []);
    useEffect(() => {
        if (!registration || !canViewOrders || !token || !("PushManager" in window))
            return;
        let active = true;
        void registration.pushManager.getSubscription().then(async (subscription) => {
            if (!subscription || !active)
                return;
            // Refresh the device binding after a new login, using the existing browser
            // permission. No unsolicited permission prompt is shown.
            const response = await fetch(`${apiUrl}/admin/push/subscriptions`, {
                method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(subscription),
            });
            if (!active)
                return;
            setPushState(response.ok ? "on" : "off");
            registration.active?.postMessage({ type: response.ok ? "PUSH_ENABLED" : "PUSH_DISABLED" });
        }).catch(() => { if (active)
            setPushState("off"); });
        return () => { active = false; };
    }, [apiUrl, canViewOrders, registration, token]);
    useEffect(() => {
        let active = true;
        let cleanupUpdate = () => { };
        const beforeInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
        const afterInstall = () => { setInstalled(true); setInstallEvent(null); };
        queueMicrotask(() => { if (active)
            setInstalled(window.matchMedia("(display-mode: standalone)").matches); });
        window.addEventListener("beforeinstallprompt", beforeInstall);
        window.addEventListener("appinstalled", afterInstall);
        if (!("serviceWorker" in navigator) || !window.isSecureContext) {
            queueMicrotask(() => { if (active)
                setPushState("unsupported"); });
        }
        else {
            void navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin", updateViaCache: "none" }).then(async (current) => {
                if (!active)
                    return;
                setRegistration(current);
                setWaiting(current.waiting);
                const watched = new Map<ServiceWorker, () => void>();
                const updateFound = () => {
                    const worker = current.installing;
                    if (!worker || watched.has(worker))
                        return;
                    const stateChanged = () => {
                        if (active && worker.state === "installed" && current.active)
                            setWaiting(current.waiting || worker);
                    };
                    watched.set(worker, stateChanged);
                    worker.addEventListener("statechange", stateChanged);
                    stateChanged();
                };
                current.addEventListener("updatefound", updateFound);
                // register() can resolve after updatefound has already fired.
                updateFound();
                cleanupUpdate = () => {
                    current.removeEventListener("updatefound", updateFound);
                    for (const [worker, listener] of watched)
                        worker.removeEventListener("statechange", listener);
                };
                if (!("PushManager" in window) || !("Notification" in window))
                    setPushState("unsupported");
                else if (await current.pushManager.getSubscription())
                    setPushState("on");
                void current.update().catch(() => undefined);
            }).catch(() => { if (active)
                setMessage(t("Установка приложения недоступна в этом браузере. Продолжайте работу на сайте.")); });
        }
        return () => { active = false; cleanupUpdate(); updateCleanup.current?.(); window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", afterInstall); };
    }, []);
    useEffect(() => {
        if (!canViewOrders || !token) {
            queueMicrotask(() => { setConnection("stopped"); setNotice(null); });
            return;
        }
        let stopped = false;
        let controller: AbortController | null = null;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let retryDelay = 1000;
        const cursorKey = `nakta-admin-events-cursor:${staffId}`;
        // Session-only cursor: a new employee login begins with current orders.
        let cursor = sessionStorage.getItem(cursorKey) || "";
        const synchronize = () => {
            callbacks.current.onOrdersChanged?.();
            window.dispatchEvent(new Event("admin:orders-changed"));
        };
        const receive = async (raw: string) => {
            const event = parseSseFrame(raw);
            if (!event || stopped)
                return;
            const resumeCursor = orderEventCursor(event);
            if (resumeCursor) {
                cursor = resumeCursor;
                sessionStorage.setItem(cursorKey, cursor);
            }
            if (event.type === "access-revoked") {
                stopped = true;
                controller?.abort();
                setConnection("stopped");
                setNotice(null);
                callbacks.current.onAccessRevoked();
                return;
            }
            if (event.type === "sync") {
                synchronize();
                return;
            }
            if (event.type !== "order.created")
                return;
            const order = event.data as OrderNotice;
            if (!order?.id || !order.orderId)
                return;
            synchronize();
            if (noticeIds.current.has(order.id))
                return;
            noticeIds.current.add(order.id);
            if (noticeIds.current.size > 500)
                noticeIds.current.delete(noticeIds.current.values().next().value!);
            // Old reconnect events still refresh the list, but do not stack alerts.
            if (Date.now() - Date.parse(order.createdAt) < 120000)
                setNotice(order);
            if (soundRef.current.enabled && audio.current?.state === "running") {
                try {
                    if (await claimOrderSound(staffId, order, localStorage, navigator.locks))
                        void playTone();
                }
                catch {
                    setMessage(t("Браузер ограничил память уведомлений. Визуальные уведомления продолжают работать."));
                }
            }
        };
        const connect = async () => {
            if (stopped)
                return;
            retry = undefined;
            setConnection(navigator.onLine ? "connecting" : "offline");
            controller = new AbortController();
            try {
                const response = await fetch(`${apiUrl}/admin/events${cursor ? `?after=${encodeURIComponent(cursor)}` : ""}`, {
                    headers: { authorization: `Bearer ${token}`, accept: "text/event-stream" }, cache: "no-store", signal: controller.signal,
                });
                if (response.status === 401 || response.status === 403) {
                    stopped = true;
                    setConnection("stopped");
                    callbacks.current.onAccessRevoked();
                    return;
                }
                if (!response.ok || !response.body)
                    throw new Error(t("Не удалось подключиться"));
                if (stopped)
                    return;
                setConnection("online");
                retryDelay = 1000;
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                while (!stopped) {
                    const { value, done } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
                    let boundary: number;
                    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
                        const frame = buffer.slice(0, boundary);
                        buffer = buffer.slice(boundary + 2);
                        await receive(frame);
                    }
                }
                await reader.cancel().catch(() => undefined);
            }
            catch { /* Recover below; current data is visibly marked disconnected. */ }
            if (!stopped) {
                setConnection("offline");
                retry = setTimeout(connect, retryDelay);
                retryDelay = Math.min(retryDelay * 2, 30000);
            }
        };
        const reconnect = () => {
            if (stopped)
                return;
            if (retry) {
                clearTimeout(retry);
                retry = undefined;
                void connect();
            }
            else
                controller?.abort();
        };
        stopRef.current = () => { stopped = true; clearTimeout(retry); controller?.abort(); sessionStorage.removeItem(cursorKey); };
        window.addEventListener("online", reconnect);
        void connect();
        return () => { stopped = true; clearTimeout(retry); controller?.abort(); window.removeEventListener("online", reconnect); stopRef.current = null; };
    }, [apiUrl, canViewOrders, playTone, staffId, token]);
    const saveSound = (enabled: boolean, nextVolume = volume) => {
        soundRef.current = { enabled, volume: nextVolume };
        if (!enabled) {
            soundSequence.current++;
            soundPlayback.current?.stop();
        }
        else
            soundPlayback.current?.setVolume(nextVolume);
        setSoundEnabled(enabled);
        setVolume(nextVolume);
        try {
            localStorage.setItem(`nakta-admin-sound:${staffId}`, JSON.stringify({ enabled, volume: nextVolume }));
        }
        catch { /* optional preference storage */ }
    };
    const enableSound = async (testOnly = false) => {
        if (!canViewOrders)
            return;
        if (!navigator.locks) {
            setMessage(t("Браузер не поддерживает безопасный звук в нескольких вкладках. Используйте актуальный Chrome, Safari или Firefox."));
            return;
        }
        if (!testOnly)
            saveSound(true);
        const sequence = soundSequence.current;
        try {
            const context = getAudioContext();
            await context.resume();
            if (audio.current !== context || sequence !== soundSequence.current)
                return;
            if (context.state !== "running")
                throw new Error("blocked");
            await playTone(testOnly);
            if (audio.current === context && context.state === "running" && (testOnly || soundRef.current.enabled))
                setMessage(testOnly ? t("Проверочный сигнал воспроизведён") : t("Звук включён на этом устройстве"));
        }
        catch {
            if (sequence === soundSequence.current)
                setMessage(t("Браузер заблокировал воспроизведение. Разрешите звук в настройках сайта и нажмите \u00ABПроверить звук\u00BB."));
        }
    };
    const togglePush = async () => {
        if (!registration || pushState === "busy")
            return;
        setPushState("busy");
        setMessage("");
        try {
            const existing = await registration.pushManager.getSubscription();
            if (existing) {
                const response = await fetch(`${apiUrl}/admin/push/subscriptions`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
                if (!response.ok)
                    throw new Error(t("Не удалось отключить уведомления на сервере. Повторите попытку."));
                await existing.unsubscribe();
                registration.active?.postMessage({ type: "PUSH_DISABLED" });
                setPushState("off");
                return;
            }
            // The permission prompt is made in the explicit button handler.
            const permission = await Notification.requestPermission();
            if (permission !== "granted")
                throw new Error(t("Системные уведомления запрещены. Разрешите их в настройках сайта, если они нужны."));
            const response = await fetch(`${apiUrl}/admin/push/config`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
            if (!response.ok)
                throw new Error(t("Не удалось проверить доступ к уведомлениям"));
            const { publicKey } = await response.json() as {
                publicKey: string | null;
            };
            if (!publicKey)
                throw new Error(t("Системные уведомления ещё не настроены владельцем сервера."));
            const binary = atob(publicKey.replace(/-/g, "+").replace(/_/g, "/"));
            const applicationServerKey = Uint8Array.from(binary, char => char.charCodeAt(0));
            const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
            const saved = await fetch(`${apiUrl}/admin/push/subscriptions`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(subscription) });
            if (!saved.ok) {
                await subscription.unsubscribe();
                throw new Error(t("Не удалось сохранить подписку. Проверьте доступ и повторите попытку."));
            }
            registration.active?.postMessage({ type: "PUSH_ENABLED" });
            setPushState("on");
            setMessage(t("Системные уведомления включены на этом устройстве."));
        }
        catch (error) {
            setPushState((await registration.pushManager.getSubscription()) ? "on" : "off");
            setMessage(error instanceof Error ? error.message : t("Не удалось настроить уведомления"));
        }
    };
    const install = async () => {
        if (installEvent) {
            await installEvent.prompt();
            await installEvent.userChoice;
            setInstallEvent(null);
        }
        else
            setMessage(/iPhone|iPad|iPod/.test(navigator.userAgent)
                ? t("В Safari откройте \u00ABПоделиться\u00BB \u2192 \u00ABНа экран Домой\u00BB. Затем запускайте NAKTA с экрана Домой.") : t("Откройте меню браузера и выберите \u00ABУстановить приложение\u00BB или \u00ABДобавить на главный экран\u00BB, если этот пункт доступен."));
    };
    const applyUpdate = async () => {
        if (updating || !await confirmAdminNavigation() || !await confirmAdminAction(t("Обновить приложение? Сначала сохраните открытые формы. Страница будет перезагружена."), { destructive: false }))
            return;
        setUpdating(true);
        try {
            const current = await registrationForAdmin();
            updateCleanup.current = activateAdminUpdate(navigator.serviceWorker, current?.waiting ?? null, reloadAdminAfterConfirmation);
        }
        catch {
            reloadAdminAfterConfirmation();
        }
    };
    const connectionLabel = !online ? t("Нет соединения") : connection === "online" ? t("Заказы обновляются") : connection === "connecting" ? t("Подключаем обновления") : t("Обновления приостановлены");
    return <div className="admin-notifications">
    {(!online || canViewOrders && connection === "offline") && typeof document !== "undefined" && createPortal(<span className="admin-connection-warning" role="alert" title={t("Данные могут быть неактуальны. Восстанавливаем соединение.")}><WifiOff className="admin-notification-icon" aria-hidden="true"/>{t("Нет связи")}</span>, document.body)}
    <div className="admin-notifications-toolbar">
      {waiting && <Button type="button" variant="ghost" size="icon" className="admin-update-trigger" disabled={updating} onClick={applyUpdate} aria-label={updating ? t("Обновляем приложение") : t("Обновить приложение после сохранения")} title={updating ? t("Обновляем приложение") : t("Доступна новая версия")}><RefreshCw className={`admin-notification-icon ${updating ? "animate-spin" : ""}`} aria-hidden="true"/></Button>}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <span className="admin-notification-trigger-wrap">
          <DialogTrigger render={<Button type="button" variant="ghost" size="icon" className="admin-notification-trigger" aria-label={t("Уведомления и приложение")} title={t("Уведомления и приложение")}/>}><Bell className="admin-notification-icon" aria-hidden="true"/></DialogTrigger>
          {canViewOrders && <span className="admin-live-state" data-connected={online && connection === "online"} role="img" aria-label={connectionLabel} title={connectionLabel}/>}
        </span>
        <DialogContent className="admin-notification-settings" showCloseButton={false}>
          <DialogHeader><DialogTitle>{t("Уведомления")}</DialogTitle><DialogDescription className="sr-only">{t("Звук, системные уведомления и установка приложения")}</DialogDescription></DialogHeader>
          <DialogClose render={<Button type="button" variant="ghost" size="icon-sm" className="admin-notification-close" aria-label={t("Закрыть настройки уведомлений")}/>}><X className="admin-notification-icon" aria-hidden="true"/></DialogClose>
          {canViewOrders && <>
            <div className="admin-notification-group">
              <div className="admin-notification-row"><span className="admin-notification-label"><Volume2 className="admin-notification-icon" aria-hidden="true"/>{t("Звук заказов")}</span><div className="admin-notification-controls"><Button type="button" variant="ghost" size="icon-sm" aria-label={t("Проверить звук")} title={t("Проверить звук")} onClick={() => void enableSound(true)}><Play className="admin-notification-icon" aria-hidden="true"/></Button><Switch checked={soundEnabled} onCheckedChange={checked => checked ? void enableSound() : saveSound(false)} aria-label={soundEnabled ? t("Выключить звук") : t("Включить звук")}/></div></div>
              <label className="admin-volume"><span>{t("Громкость")}</span><input aria-label={t("Громкость уведомлений")} type="range" min="0" max="1" step="0.05" value={volume} onChange={event => saveSound(soundEnabled, Number(event.target.value))}/><span className="admin-volume-value">{Math.round(volume * 100)}%</span></label>
              {soundEnabled && !soundReady && <p className="admin-notification-hint">{t("Звук включён. Нажмите в панели, чтобы браузер разрешил воспроизведение.")}</p>}
            </div>
            <div className="admin-notification-group"><div className="admin-notification-row"><span className="admin-notification-label"><BellRing className="admin-notification-icon" aria-hidden="true"/>{t("Системные уведомления")}</span><Switch checked={pushState === "on"} onCheckedChange={() => void togglePush()} disabled={!registration || pushState === "busy" || pushState === "unsupported"} aria-busy={pushState === "busy"} aria-label={pushState === "on" ? t("Отключить системные уведомления") : t("Включить системные уведомления")}/></div>{pushState === "unsupported" && <p className="admin-notification-hint">{t("Недоступны в этом браузере")}</p>}</div>
          </>}
          {installed ? <p className="admin-notification-installed"><Check className="admin-notification-icon" aria-hidden="true"/>{t("Приложение установлено")}</p> : <Button type="button" variant="outline" onClick={() => void install()}><Download className="admin-notification-icon" aria-hidden="true"/>{installEvent ? t("Установить приложение") : t("Как установить приложение")}</Button>}
          {message && <p className="admin-notification-message" role="status">{message}</p>}
        </DialogContent>
      </Dialog>
    </div>
    {notice && canViewOrders && typeof document !== "undefined" && createPortal(<aside className="admin-new-order" role="status" aria-live="polite"><strong>{t("Новый заказ \u2116")}{notice.orderNumber}</strong><Button type="button" size="sm" onClick={async () => { if (!await confirmAdminNavigation())
        return; if (callbacks.current.onOpenOrder)
        callbacks.current.onOpenOrder(notice.orderId);
    else
        window.location.assign(`/admin?section=orders&order=${encodeURIComponent(notice.orderId)}`); setNotice(null); }}>{t("Открыть заказ")}</Button><Button type="button" variant="ghost" size="icon-sm" aria-label={t("Закрыть уведомление")} onClick={() => setNotice(null)}><X className="admin-notification-icon" aria-hidden="true"/></Button></aside>, document.body)}
  </div>;
}
