"use client";

import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

export function WorkspaceHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}</div>;
}

export function WorkspaceStats({ items }: { items: Array<{ label: string; value: ReactNode; hint?: string }> }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map((item) => <Card key={item.label} className="min-w-0"><CardHeader><CardDescription>{item.label}</CardDescription><CardTitle className="text-2xl tabular-nums tracking-tight">{item.value}</CardTitle></CardHeader>{item.hint ? <CardContent className="text-xs text-muted-foreground">{item.hint}</CardContent> : null}</Card>)}</div>;
}

export function ListPagination({ total, page, pageSize = 25, loading, onPageChange }: { total: number; page: number; pageSize?: number; loading?: boolean; onPageChange: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">{total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} из ${total}` : "Нет записей"}</span><div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={loading || page === 0} onClick={() => onPageChange(page - 1)}>Назад</Button><span className="px-2 text-xs text-muted-foreground">{page + 1} / {pages}</span><Button type="button" variant="outline" disabled={loading || page + 1 >= pages} onClick={() => onPageChange(page + 1)}>Далее</Button></div></div>;
}

export function EditorDialog({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}><DialogContent showCloseButton={false} className={`flex max-h-[94dvh] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"}`}><header className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5"><div><DialogTitle className="text-lg">{title}</DialogTitle>{description ? <DialogDescription className="mt-1">{description}</DialogDescription> : null}</div><Button type="button" variant="ghost" size="icon" aria-label="Закрыть форму" onClick={onClose}>×</Button></header>{children}</DialogContent></Dialog>;
}
