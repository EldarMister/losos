"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
type Confirmation = {
    message: string;
    title: string;
    destructive: boolean;
    resolve: (confirmed: boolean) => void;
};
let pending: Confirmation | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => pending;
const getServerSnapshot = () => null;
/** A second click or incoming notification must not queue another destructive action. */
export function confirmAdminAction(message: string, options: {
    title?: string;
    destructive?: boolean;
} = {}): Promise<boolean> {
    if (typeof window === "undefined" || pending || !listeners.size)
        return Promise.resolve(false);
    return new Promise(resolve => {
        pending = { message, title: options.title || t("Подтвердить действие?"), destructive: options.destructive ?? true, resolve };
        notify();
    });
}
function settle(confirmed: boolean) {
    const current = pending;
    pending = null;
    notify();
    current?.resolve(confirmed);
}
export function AdminConfirmationDialog() {
    useAdminLanguage();
    const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const cancel = useRef<HTMLButtonElement>(null);
    useEffect(() => { if (current)
        cancel.current?.focus(); }, [current]);
    useEffect(() => {
        const dismiss = () => settle(false);
        window.addEventListener("admin:logout", dismiss);
        return () => { window.removeEventListener("admin:logout", dismiss); dismiss(); };
    }, []);
    return <Dialog open={Boolean(current)} onOpenChange={open => { if (!open)
        settle(false); }}>
    <DialogContent role="alertdialog" showCloseButton={false} initialFocus={cancel} overlayClassName="z-[100]" className="z-[110] sm:max-w-md">
      <DialogHeader><DialogTitle>{current?.title}</DialogTitle><DialogDescription className="whitespace-pre-line break-words">{current?.message}</DialogDescription></DialogHeader>
      <DialogFooter><Button ref={cancel} type="button" variant="outline" onClick={() => settle(false)}>{t("Нет")}</Button><Button type="button" variant={current?.destructive ? "destructive" : "default"} onClick={() => settle(true)}>{t("Да")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
