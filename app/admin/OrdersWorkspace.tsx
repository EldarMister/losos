"use client";
import { translateAdmin as t, adminLocale } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { confirmAdminAction } from "./AdminConfirmationDialog";
import { ChevronRight, MapPin, Phone, RefreshCw, Search } from "lucide-react";
import { Button } from "./ui/button";
import { AdminSelect } from "./AdminSelect";
import { AdminPeriodControl } from "./AdminPeriodControl";
import { presetPeriod } from "./admin-period";
import { DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import type { AdminOrder, AdminRequest, OrderKitItem, OrdersResponse, OrderStatus, } from "./admin-types";
type OrdersWorkspaceProps = {
    region: string;
    request: AdminRequest;
    onNotice: (message: string, tone?: "success" | "error") => void;
};
const statusLabels: Record<OrderStatus, string> = {
    get new() {
        return t("Новый");
    },
    get confirmed() {
        return t("Принят");
    },
    get preparing() {
        return t("Готовится");
    },
    get ready() {
        return t("Готов");
    },
    get delivering() {
        return t("В пути");
    },
    get completed() {
        return t("Завершён");
    },
    get cancelled() {
        return t("Отменён");
    },
};
const statusStyles: Record<OrderStatus, string> = {
    new: "border-primary/20 bg-primary/5 text-primary",
    confirmed: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    preparing: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    delivering: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    completed: "border-border bg-muted text-foreground",
    cancelled: "border-destructive/20 bg-destructive/10 text-destructive",
};
const filterOptions: Array<{
    value: "all" | OrderStatus;
    label: string;
}> = [
    { value: "all", get label() {
            return t("Все");
        } },
    { value: "new", get label() {
            return t("Новые");
        } },
    { value: "confirmed", get label() {
            return t("Принятые");
        } },
    { value: "preparing", get label() {
            return t("Готовятся");
        } },
    { value: "ready", get label() {
            return t("Готовы");
        } },
    { value: "delivering", get label() {
            return t("В пути");
        } },
    { value: "completed", get label() {
            return t("Завершённые");
        } },
    { value: "cancelled", get label() {
            return t("Отменённые");
        } },
];
function formatMoney(value: number) {
    return t("{0} сом", { "0": Math.round(value).toLocaleString(adminLocale()) });
}
function formatDate(value: string) {
    return new Intl.DateTimeFormat(adminLocale(), {
        timeZone: "Asia/Bishkek",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}
function orderNumber(order: AdminOrder) {
    return order.orderNumber ? `№${order.orderNumber}` : t("Без номера");
}
function deliveryLabel(order: AdminOrder) {
    return order.deliveryType === "pickup" ? t("Самовывоз") : t("Доставка");
}
function paymentLabel(method: AdminOrder["paymentMethod"]) {
    if (method === "cash")
        return t("Наличными");
    if (method === "online")
        return t("Онлайн");
    return t("Картой");
}
function primaryTransition(order: AdminOrder): {
    status: OrderStatus;
    label: string;
} | null {
    switch (order.status) {
        case "new":
            return { status: "confirmed", label: t("Принять заказ") };
        case "confirmed":
            return { status: "preparing", label: t("Начать готовить") };
        case "preparing":
            return { status: "ready", label: t("Отметить готовым") };
        case "ready":
            return order.deliveryType === "delivery"
                ? { status: "delivering", label: t("Передать курьеру") }
                : { status: "completed", label: t("Выдать заказ") };
        case "delivering":
            return { status: "completed", label: t("Завершить заказ") };
        default:
            return null;
    }
}
function StatusBadge({ status }: {
    status: OrderStatus;
}) {
    useAdminLanguage();
    return (<span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>);
}
type KitDraft = {
    orderId: string;
    expectedUpdatedAt?: string;
    noUtensils: boolean;
    utensilsCount: number;
    kitItems: OrderKitItem[];
    maxQuantities: Record<string, number>;
};
function EmptyOrders({ filtered }: {
    filtered: boolean;
}) {
    useAdminLanguage();
    return (<div className="grid min-h-64 place-items-center px-6 py-12 text-center">
      <div>
        <p className="text-base font-semibold text-foreground">{filtered ? t("Заказы не найдены") : t("Новых заказов пока нет")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {filtered ? t("Измените фильтр или поисковый запрос.") : t("Новые заказы появятся здесь автоматически.")}
        </p>
      </div>
    </div>);
}
export default function OrdersWorkspace({ region, request, onNotice }: OrdersWorkspaceProps) {
    useAdminLanguage();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<OrdersResponse["statusCounts"]>({});
    const [filter, setFilter] = useState<"all" | OrderStatus>("new");
    const [searchDraft, setSearchDraft] = useState("");
    const [search, setSearch] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [kitDraft, setKitDraft, closeKitEditor] = useDraftEditor<KitDraft>();
    const { can } = useAdminAccess();
    const [page, setPage] = useState(0);
    const [period, setPeriod] = useState(() => presetPeriod("all"));
    const { from, to } = period;
    const [detailTab, setDetailTab] = useState("summary");
    const [detailLoading, setDetailLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionOrderId, setActionOrderId] = useState<string | null>(null);
    const [kitSaving, setKitSaving] = useState(false);
    const [error, setError] = useState("");
    const requestSequence = useRef(0);
    const detailSequence = useRef(0);
    const notificationOpened = useRef(false);
    const loadOrders = useCallback(async (quiet = false) => {
        const sequence = ++requestSequence.current;
        if (!quiet)
            setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams({ regionSlug: region, limit: "25", offset: String(page * 25) });
            if (filter !== "all")
                query.set("status", filter);
            if (search)
                query.set("search", search);
            if (from)
                query.set("from", new Date(`${from}T00:00:00+06:00`).toISOString());
            if (to)
                query.set("to", new Date(`${to}T23:59:59.999+06:00`).toISOString());
            const result = await request<OrdersResponse>(`/admin/orders?${query}`);
            if (sequence !== requestSequence.current)
                return;
            setOrders(result.items);
            setTotal(result.total);
            setCounts(result.statusCounts);
            setSelectedOrder((current) => current
                ? { ...current, ...result.items.find((item) => item.id === current.id) }
                : null);
        }
        catch (loadError) {
            if (sequence !== requestSequence.current)
                return;
            setError(loadError instanceof Error ? loadError.message : t("Не удалось загрузить заказы"));
        }
        finally {
            if (sequence === requestSequence.current)
                setLoading(false);
        }
    }, [filter, region, request, search, page, from, to]);
    useEffect(() => {
        const initialTimer = window.setTimeout(() => void loadOrders(), 0);
        const timer = window.setInterval(() => void loadOrders(true), 20000);
        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(timer);
        };
    }, [loadOrders]);
    useEffect(() => {
        const refresh = () => void loadOrders(true);
        const open = async (event: Event) => {
            const id = (event as CustomEvent<{
                id?: string;
            }>).detail?.id;
            if (!id || kitSaving || actionOrderId || !await closeKitEditor())
                return;
            const sequence = ++detailSequence.current;
            void request<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`).then((order) => {
                if (sequence !== detailSequence.current)
                    return;
                setSelectedOrder(order);
                setDetailTab("summary");
            }).catch((error: unknown) => {
                if (sequence === detailSequence.current)
                    onNotice(error instanceof Error ? error.message : t("Не удалось открыть заказ"), "error");
            });
        };
        if (!notificationOpened.current) {
            const id = new URLSearchParams(window.location.search).get("order");
            if (id) {
                notificationOpened.current = true;
                open(new CustomEvent("admin:open-order", { detail: { id } }));
            }
        }
        window.addEventListener("admin:orders-changed", refresh);
        window.addEventListener("admin:open-order", open);
        return () => { window.removeEventListener("admin:orders-changed", refresh); window.removeEventListener("admin:open-order", open); };
    }, [loadOrders, request, onNotice, closeKitEditor, kitSaving, actionOrderId]);
    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        setPage(0);
        setSearch(searchDraft.trim());
    };
    useEffect(() => {
        if (searchDraft.trim() === search)
            return;
        const timer = window.setTimeout(() => { setPage(0); setSearch(searchDraft.trim()); }, 300);
        return () => window.clearTimeout(timer);
    }, [searchDraft, search]);
    const updateStatus = async (order: AdminOrder, status: OrderStatus) => {
        if (actionOrderId || !can("orders.status"))
            return;
        if (status === "cancelled" && !await confirmAdminAction(t("Отменить заказ {0}? Вернуть его в работу будет нельзя.", { "0": orderNumber(order) })))
            return;
        setActionOrderId(order.id);
        try {
            const updated = await request<AdminOrder>(`/admin/orders/${order.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status, expectedStatus: order.status, expectedUpdatedAt: order.updatedAt }),
            });
            setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
            setSelectedOrder((current) => current?.id === updated.id ? updated : current);
            onNotice(`${orderNumber(updated)} — ${statusLabels[updated.status]}`, "success");
            await loadOrders(true);
        }
        catch (updateError) {
            onNotice(updateError instanceof Error ? updateError.message : t("Не удалось изменить статус заказа"), "error");
            await loadOrders(true);
        }
        finally {
            setActionOrderId(null);
        }
    };
    const openOrder = async (order: AdminOrder) => {
        if (kitSaving || actionOrderId || !await closeKitEditor())
            return;
        const sequence = ++detailSequence.current;
        setSelectedOrder(order);
        setDetailTab("summary");
        setDetailLoading(true);
        try {
            const full = await request<AdminOrder>(`/admin/orders/${encodeURIComponent(order.id)}`);
            if (sequence !== detailSequence.current)
                return;
            setSelectedOrder((current) => current?.id === full.id ? full : current);
        }
        catch (error) {
            onNotice(error instanceof Error ? error.message : t("Не удалось загрузить подробности заказа"), "error");
        }
        finally {
            if (sequence === detailSequence.current)
                setDetailLoading(false);
        }
    };
    const openKitEditor = (order: AdminOrder) => {
        if (detailLoading || !can("orders.edit") || order.status === "completed" || order.status === "cancelled")
            return;
        detailSequence.current += 1;
        const includedItems = order.includedKitItems ?? order.kitItems ?? [];
        setKitDraft({
            orderId: order.id,
            expectedUpdatedAt: order.updatedAt,
            noUtensils: order.noUtensils,
            utensilsCount: Math.max(1, order.utensilsCount || 1),
            kitItems: includedItems.map((item) => ({ ...item, quantity: order.kitItems?.find((selected) => selected.id === item.id)?.quantity ?? 0 })),
            maxQuantities: Object.fromEntries(includedItems.map((item) => [item.id, item.quantity])),
        });
    };
    const changeKitQuantity = (id: string, delta: number) => {
        setKitDraft((current) => current ? {
            ...current,
            kitItems: current.kitItems.map((item) => item.id === id
                ? { ...item, quantity: Math.min(current.maxQuantities[id] ?? 0, Math.max(0, item.quantity + delta)) }
                : item),
        } : current);
    };
    const saveKit = async () => {
        if (!selectedOrder || !kitDraft || kitDraft.orderId !== selectedOrder.id || kitSaving || !can("orders.edit"))
            return;
        setKitSaving(true);
        try {
            const updated = await request<AdminOrder>(`/admin/orders/${kitDraft.orderId}/kit`, {
                method: "PATCH",
                body: JSON.stringify({
                    expectedUpdatedAt: kitDraft.expectedUpdatedAt,
                    noUtensils: kitDraft.noUtensils,
                    utensilsCount: kitDraft.noUtensils ? 0 : kitDraft.utensilsCount,
                    kitItems: kitDraft.kitItems.map(({ id, quantity }) => ({ id, quantity })),
                }),
            });
            setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
            setSelectedOrder(updated);
            setKitDraft(null);
            onNotice(t("{0} \u2014 комплектация сохранена", { "0": orderNumber(updated) }), "success");
        }
        catch (saveError) {
            onNotice(saveError instanceof Error ? saveError.message : t("Не удалось сохранить комплектацию"), "error");
        }
        finally {
            setKitSaving(false);
        }
    };
    return (<div className="space-y-6">
      <WorkspaceHeading title={t("Заказы")} action={<Button variant="outline" size="icon" aria-label={t("Обновить заказы")} title={t("Обновить заказы")} disabled={loading} onClick={() => void loadOrders()}><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"}/></Button>}/>
      <div className="flex flex-col gap-4" aria-label={t("Фильтры заказов")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <form className="min-w-0 flex-1 lg:max-w-sm" onSubmit={submitSearch}>
            <Label className="relative block"><span className="sr-only">{t("Найти заказ")}</span><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input type="search" className="pl-9" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder={t("Номер, имя или телефон")}/></Label>
          </form>
          <div className="min-w-0 lg:max-w-xl">
            <AdminPeriodControl value={period} onChange={next => { setPeriod(next); setPage(0); }}/>
          </div>
          {from || to || search ? <Button variant="ghost" className="self-start lg:self-end" onClick={() => { setPeriod(presetPeriod("all")); setSearch(""); setSearchDraft(""); setPage(0); }}>{t("Сбросить")}</Button> : null}
        </div>
        <div className="xl:hidden"><AdminSelect aria-label={t("Статус заказа")} value={filter} options={filterOptions.map((option) => ({ value: option.value, label: `${option.label} · ${option.value === "all" ? Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0) : counts[option.value] ?? 0}` }))} onValueChange={(value) => { setFilter(value as typeof filter); setPage(0); }}/></div>
        <Tabs value={filter} onValueChange={(value) => { setFilter(value as typeof filter); setPage(0); }} className="hidden xl:flex">
          <TabsList aria-label={t("Статус заказа")} className="w-max">
            {filterOptions.map((option) => {
            const count = option.value === "all" ? Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0) : counts[option.value] ?? 0;
            return <TabsTrigger key={option.value} value={option.value}>{option.label}<span className="text-xs tabular-nums text-muted-foreground">{count}</span></TabsTrigger>;
        })}
          </TabsList>
        </Tabs>
      </div>

      {loading ? <span className="sr-only" role="status">{t("Обновляем заказы\u2026")}</span> : null}

      {error ? (<div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <strong className="block font-semibold">{t("Не удалось показать заказы")}</strong>
          <span className="mt-1 block">{error}</span>
          <Button variant="ghost" type="button" className="mt-3 font-semibold underline" onClick={() => void loadOrders()}>{t("Повторить загрузку")}</Button>
        </div>) : null}

      {!error ? (<div className="overflow-hidden rounded-md border" aria-label={t("Список заказов")}>
          {orders.length === 0 && !loading ? <EmptyOrders filtered={Boolean(search) || filter !== "new"}/> : null}

          {orders.length > 0 ? (<div className="hidden overflow-x-auto md:block">
              <Table className="w-full min-w-[920px] border-collapse text-left">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">{t("Заказ")}</TableHead>
                    <TableHead className="px-4">{t("Клиент")}</TableHead>
                    <TableHead className="px-4">{t("Получение")}</TableHead>
                    <TableHead className="px-4">{t("Сумма")}</TableHead>
                    <TableHead className="px-4">{t("Статус")}</TableHead>
                    <TableHead className="px-4 text-right">{t("Действие")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {orders.map((order) => {
                    const transition = primaryTransition(order);
                    return (<TableRow key={order.id} className="group">
                        <TableCell className="px-4 py-3 align-middle">
                          <Button variant="ghost" type="button" className="admin-order-link text-left hover:underline" onClick={() => void openOrder(order)}>
                            <strong className="block text-sm font-semibold text-foreground">{orderNumber(order)}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-middle">
                          <strong className="block max-w-52 truncate text-sm font-medium text-foreground">{order.customerName || t("Без имени")}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">{order.phone}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-middle">
                          <span className="block text-sm text-foreground">{deliveryLabel(order)}</span>
                          <span className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">{order.address || t("Адрес не указан")}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-middle text-sm font-semibold text-foreground">{formatMoney(order.total)}</TableCell>
                        <TableCell className="px-4 py-3 align-middle"><StatusBadge status={order.status}/></TableCell>
                        <TableCell className="px-4 py-3 align-middle">
                          <div className="flex justify-end gap-2">
                            {transition && can("orders.status") ? (<Button variant="default" type="button" disabled={actionOrderId === order.id} onClick={() => void updateStatus(order, transition.status)}>
                                {actionOrderId === order.id ? t("Сохраняем\u2026") : transition.label}
                              </Button>) : null}
                          </div>
                        </TableCell>
                      </TableRow>);
                })}
                </TableBody>
              </Table>
            </div>) : null}

          {orders.length > 0 ? (<div className="divide-y divide-border md:hidden">
              {orders.map((order) => {
                    const transition = primaryTransition(order);
                    return (<article key={order.id} className="p-4">
                    <Button variant="ghost" type="button" className="admin-order-summary w-full text-left" onClick={() => void openOrder(order)}>
                      <span className="flex w-full min-w-0 items-start justify-between gap-3">
                        <span className="min-w-0">
                          <strong className="block text-base font-semibold text-foreground">{orderNumber(order)}</strong>
                          <small className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)}</small>
                        </span>
                        <span className="flex shrink-0 items-center gap-2"><StatusBadge status={order.status}/><ChevronRight className="size-4 text-muted-foreground" aria-hidden="true"/></span>
                      </span>
                      <span className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                        <span className="min-w-0">
                          <small className="block text-xs text-muted-foreground">{t("Клиент")}</small>
                          <strong className="mt-1 block break-words font-medium text-foreground">{order.customerName || t("Без имени")}</strong>
                        </span>
                        <span>
                          <small className="block text-xs text-muted-foreground">{t("Сумма")}</small>
                          <strong className="mt-1 block font-semibold text-foreground">{formatMoney(order.total)}</strong>
                        </span>
                      </span>
                      <span className="mt-3 block min-w-0 break-words border-t border-border pt-3 text-sm text-muted-foreground">
                        {deliveryLabel(order)} · {order.address || t("Адрес не указан")}
                      </span>
                    </Button>
                    <div className="mt-4 grid gap-2">
                      {transition && can("orders.status") ? (<Button variant="default" type="button" disabled={actionOrderId === order.id} onClick={() => void updateStatus(order, transition.status)}>
                          {actionOrderId === order.id ? t("Сохраняем\u2026") : transition.label}
                        </Button>) : null}
                    </div>
                  </article>);
                })}
            </div>) : null}
        </div>) : null}

      <ListPagination total={total} page={page} loading={loading} onPageChange={setPage}/>

      <EditorDialog open={Boolean(selectedOrder) && !kitDraft} onClose={async () => { if (!kitSaving && await closeKitEditor()) {
        detailSequence.current += 1;
        setSelectedOrder(null);
        setDetailTab("summary");
        setDetailLoading(false);
    } }} title={selectedOrder ? t("Заказ {0}", { "0": orderNumber(selectedOrder) }) : t("Заказ")} description={detailLoading ? t("Загружаем актуальные сведения\u2026") : selectedOrder ? t("Создан {0}", { "0": formatDate(selectedOrder.createdAt) }) : undefined} wide>
        {selectedOrder ? <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><Tabs value={detailTab} onValueChange={setDetailTab}><TabsList><TabsTrigger value="summary">{t("Состав и клиент")}</TabsTrigger><TabsTrigger value="kit">{t("Комплектация")}</TabsTrigger><TabsTrigger value="history">{t("История")}</TabsTrigger></TabsList></Tabs><StatusBadge status={selectedOrder.status}/></div>
            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
              <div className="grid gap-6">
                <Card className={detailTab === "summary" ? "gap-0 p-4" : "hidden"} aria-labelledby="customer-title">
                  <h3 id="customer-title" className="text-sm font-semibold text-foreground">{t("Клиент и получение")}</h3>
                  <div className="mt-3 rounded-xl border border-border p-4 text-sm">
                    <strong className="block text-base text-foreground">{selectedOrder.customerName || t("Без имени")}</strong>
                    <a className="mt-3 flex items-center gap-2 text-primary" href={`tel:${selectedOrder.phone}`}>
                      <Phone className="size-4 shrink-0" aria-hidden="true"/>
                      <span>{t("Позвонить:")}{selectedOrder.phone}</span>
                    </a>
                    <div className="mt-3 flex items-start gap-2 text-foreground">
                      <MapPin className="size-4 shrink-0 mt-0.5" aria-hidden="true"/>
                      <span>
                        <strong className="block font-medium">{deliveryLabel(selectedOrder)}</strong>
                        <span className="mt-1 block text-muted-foreground">{selectedOrder.address || t("Адрес не указан")}</span>
                        {selectedOrder.deliveryType === "delivery" ? (<small className="mt-1 block text-muted-foreground">
                            {[
                    selectedOrder.apartment && t("кв. {0}", { "0": selectedOrder.apartment }),
                    selectedOrder.entrance && t("подъезд {0}", { "0": selectedOrder.entrance }),
                    selectedOrder.floor && t("этаж {0}", { "0": selectedOrder.floor }),
                    selectedOrder.intercom && t("домофон {0}", { "0": selectedOrder.intercom }),
                ].filter(Boolean).join(" · ") || t("Без дополнительных деталей")}
                          </small>) : null}
                      </span>
                    </div>
                    {selectedOrder.comment ? (<div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                        <strong className="block text-xs font-semibold uppercase tracking-wide">{t("Комментарий клиента")}</strong>
                        <p className="mt-1">{selectedOrder.comment}</p>
                      </div>) : null}
                  </div>
                </Card>

                <Card className={detailTab === "summary" ? "gap-0 p-4" : "hidden"} aria-labelledby="items-title">
                  <h3 id="items-title" className="text-sm font-semibold text-foreground">{t("Состав заказа")}</h3>
                  <div className="mt-3 divide-y divide-border rounded-xl border border-border">
                    {selectedOrder.items.map((item) => (<div key={item.id} className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <strong className="block text-sm font-medium text-foreground">{item.quantity} × {item.productName}</strong>
                          {item.modifierSnapshots?.length ? (<ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {item.modifierSnapshots.map((modifier) => (<li key={`${item.id}-${modifier.itemId}`}>{modifier.itemName}{modifier.quantity > 1 ? ` × ${modifier.quantity}` : ""}</li>))}
                            </ul>) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-foreground">{formatMoney(item.lineTotal)}</span>
                      </div>))}
                    <div className="grid gap-2 bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between gap-4 text-muted-foreground"><span>{t("Оплата")}</span><span>{paymentLabel(selectedOrder.paymentMethod)}</span></div>
                      <div className="flex justify-between gap-4 text-muted-foreground"><span>{t("Приборы")}</span><span>{selectedOrder.noUtensils ? t("Не нужны") : t("{0} шт.", { "0": selectedOrder.utensilsCount })}</span></div>
                      <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold text-foreground"><span>{t("Итого")}</span><span>{formatMoney(selectedOrder.total)}</span></div>
                    </div>
                  </div>
                </Card>

                <Card className={detailTab === "kit" ? "gap-0 p-4" : "hidden"} aria-labelledby="kit-title">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="kit-title" className="text-sm font-semibold text-foreground">{t("Комплектация")}</h3>
                    {can("orders.edit") && !(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (<Button variant="outline" type="button" onClick={() => openKitEditor(selectedOrder)}>{t("Изменить комплектацию")}</Button>) : null}
                  </div>
                  <div className="mt-3 rounded-xl border border-border p-4 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">{t("Приборы")}</span><strong className="font-medium text-foreground">{selectedOrder.noUtensils ? t("Не нужны") : t("{0} персон", { "0": selectedOrder.utensilsCount })}</strong></div>
                    <div className="mt-3 grid gap-2 border-t border-border pt-3">
                      {(selectedOrder.kitItems ?? []).map((kitItem) => (<div key={kitItem.id} className="flex justify-between gap-4 text-foreground"><span>{kitItem.name}</span><strong className="font-medium">{kitItem.quantity}{t("шт.")}</strong></div>))}
                      {!selectedOrder.kitItems?.length ? <p className="text-muted-foreground">{t("Дополнительная комплектация не указана.")}</p> : null}
                    </div>
                  </div>
                </Card>

                {detailTab === "history" ? <Card className="p-5"><h3 className="font-semibold">{t("История обработки")}</h3><ol className="space-y-4 border-l border-border pl-5"><li className="text-sm"><strong className="block">{t("Заказ создан")}</strong><span className="text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span></li>{((selectedOrder as AdminOrder & {
            statusHistory?: Array<{
                id: string;
                status: OrderStatus;
                createdAt: string;
                actorName?: string;
            }>;
        }).statusHistory ?? []).map((entry) => <li key={entry.id} className="text-sm"><strong className="block">{statusLabels[entry.status]}</strong><span className="text-muted-foreground">{formatDate(entry.createdAt)}{entry.actorName ? ` · ${entry.actorName}` : ""}</span></li>)}</ol><p className="text-xs text-muted-foreground">{t("Текущий статус:")}{statusLabels[selectedOrder.status]}</p></Card> : null}
                {selectedOrder.posLastError ? (<div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                    <strong className="block">{t("Ошибка передачи на кухню")}</strong>
                    <span className="mt-1 block">{t("Не удалось передать заказ в систему кухни. Проверьте подключение в разделе интеграции.")}</span>
                  </div>) : null}
              </div>
            </div>

            <footer className="border-t border-border bg-card p-4 md:px-7">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                {primaryTransition(selectedOrder) && can("orders.status") ? (<Button variant="default" type="button" disabled={actionOrderId === selectedOrder.id} onClick={() => {
                    const transition = primaryTransition(selectedOrder);
                    if (transition)
                        void updateStatus(selectedOrder, transition.status);
                }}>
                    {actionOrderId === selectedOrder.id ? t("Сохраняем\u2026") : primaryTransition(selectedOrder)?.label}
                  </Button>) : <div />}
                {can("orders.status") && !(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (<Button variant="destructive" type="button" disabled={actionOrderId === selectedOrder.id} onClick={() => void updateStatus(selectedOrder, "cancelled")}>{t("Отменить заказ")}</Button>) : null}
              </div>
            </footer>
        </div> : null}
      </EditorDialog>

      <EditorDialog open={Boolean(selectedOrder && kitDraft)} onClose={() => { if (!kitSaving)
        closeKitEditor(); }} title={selectedOrder ? t("Комплектация {0}", { "0": orderNumber(selectedOrder) }) : t("Комплектация")}>
        {selectedOrder && kitDraft ? <fieldset disabled={kitSaving || !can("orders.edit")} className="flex min-h-0 flex-col">
            <div className="grid gap-4 overflow-y-auto p-5">
              <Label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm font-medium text-foreground"><span>{t("Без приборов")}</span><input type="checkbox" className="size-5 accent-primary" checked={kitDraft.noUtensils} onChange={(event) => setKitDraft({ ...kitDraft, noUtensils: event.target.checked })}/></Label>
              {!kitDraft.noUtensils ? <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"><span><strong className="block text-sm text-foreground">{t("Количество персон")}</strong><small className="mt-1 block text-xs text-muted-foreground">{t("Палочки и салфетки")}</small></span><span className="flex items-center gap-3"><Button variant="outline" type="button" aria-label={t("Уменьшить количество персон")} onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.max(1, kitDraft.utensilsCount - 1) })}>−</Button><strong className="min-w-6 text-center text-base">{kitDraft.utensilsCount}</strong><Button variant="outline" type="button" aria-label={t("Увеличить количество персон")} onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.min(50, kitDraft.utensilsCount + 1) })}>+</Button></span></div> : null}
              {kitDraft.kitItems.length ? <div className="divide-y divide-border rounded-xl border border-border">{kitDraft.kitItems.map((kitItem) => <div key={kitItem.id} className="flex min-w-0 items-center justify-between gap-3 p-4"><span className="min-w-0"><strong className="block break-words text-sm font-medium text-foreground">{kitItem.name}</strong><small className="mt-1 block text-xs text-muted-foreground">{t("Входит в заказ:")}{kitDraft.maxQuantities[kitItem.id]}{t("шт.")}</small></span><span className="flex shrink-0 items-center gap-2"><Button variant="outline" type="button" aria-label={t("Уменьшить {0}", { "0": kitItem.name })} disabled={kitItem.quantity <= 0} onClick={() => changeKitQuantity(kitItem.id, -1)}>−</Button><strong className="min-w-6 text-center text-base">{kitItem.quantity}</strong><Button variant="outline" type="button" aria-label={t("Увеличить {0}", { "0": kitItem.name })} disabled={kitItem.quantity >= (kitDraft.maxQuantities[kitItem.id] ?? 0)} onClick={() => changeKitQuantity(kitItem.id, 1)}>+</Button></span></div>)}</div> : <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{t("Для блюд этого заказа бесплатная комплектация не указана.")}</p>}
            </div>
            <DialogFooter className="mx-0 mb-0 shrink-0"><Button variant="outline" type="button" onClick={closeKitEditor}>{t("Отменить")}</Button><Button variant="default" type="button" disabled={kitSaving} onClick={() => void saveKit()}>{kitSaving ? t("Сохраняем\u2026") : t("Сохранить комплектацию")}</Button></DialogFooter>
        </fieldset> : null}
      </EditorDialog>
    </div>);
}
