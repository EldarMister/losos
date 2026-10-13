"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
export function WorkspaceHeading({ title, description, action }: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    useAdminLanguage();
    return <div className="flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><h2 className="text-2xl font-semibold tracking-tight">{title}</h2>{description ? <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p> : null}</div>{action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}</div>;
}
export function WorkspaceStats({ items }: {
    items: Array<{
        label: string;
        value: ReactNode;
        hint?: string;
    }>;
}) {
    useAdminLanguage();
    return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map((item) => <Card key={item.label} className="min-w-0"><CardHeader><CardDescription>{item.label}</CardDescription><CardTitle className="text-2xl tabular-nums tracking-tight">{item.value}</CardTitle></CardHeader>{item.hint ? <CardContent className="text-xs text-muted-foreground">{item.hint}</CardContent> : null}</Card>)}</div>;
}
export function ListPagination({ total, page, pageSize = 25, loading, onPageChange }: {
    total: number;
    page: number;
    pageSize?: number;
    loading?: boolean;
    onPageChange: (page: number) => void;
}) {
    useAdminLanguage();
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return <div className="flex items-center justify-between gap-3 py-2 text-sm"><span className="text-muted-foreground">{total ? t("{0}\u2013{1} из {2}", { "0": page * pageSize + 1, "1": Math.min((page + 1) * pageSize, total), "2": total }) : t("Нет записей")}</span><div className="flex items-center gap-1"><Button type="button" size="icon" variant="outline" aria-label={t("Предыдущая страница")} title={t("Предыдущая страница")} disabled={loading || page === 0} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4"/></Button><span className="px-1 text-xs text-muted-foreground">{page + 1} / {pages}</span><Button type="button" size="icon" variant="outline" aria-label={t("Следующая страница")} title={t("Следующая страница")} disabled={loading || page + 1 >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4"/></Button></div></div>;
}
export function EditorDialog({ open, onClose, title, description, children, wide = false }: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    wide?: boolean;
}) {
    useAdminLanguage();
    return <Dialog open={open} onOpenChange={(next) => { if (!next)
        onClose(); }}><DialogContent showCloseButton={false} className={`flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"}`}><DialogHeader className="relative shrink-0 p-4 pr-14"><DialogTitle>{title}</DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}<Button type="button" variant="ghost" size="icon-sm" className="absolute right-2 top-2" aria-label={t("Закрыть форму")} onClick={onClose}><X className="size-4"/></Button></DialogHeader>{children}</DialogContent></Dialog>;
}
