"use client";

import { ChevronRight, MapPin, Phone, RefreshCw, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import type {
  AdminOrder,
  AdminRequest,
  OrderKitItem,
  OrdersResponse,
  OrderStatus,
} from "./admin-types";

type OrdersWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

const statusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
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

const filterOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "confirmed", label: "Принятые" },
  { value: "preparing", label: "Готовятся" },
  { value: "ready", label: "Готовы" },
  { value: "delivering", label: "В пути" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
];

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Bishkek",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function orderNumber(order: AdminOrder) {
  return order.orderNumber ? `№${order.orderNumber}` : "Без номера";
}

function deliveryLabel(order: AdminOrder) {
  return order.deliveryType === "pickup" ? "Самовывоз" : "Доставка";
}

function paymentLabel(method: AdminOrder["paymentMethod"]) {
  if (method === "cash") return "Наличными";
  if (method === "online") return "Онлайн";
  return "Картой";
}

function primaryTransition(order: AdminOrder): { status: OrderStatus; label: string } | null {
  switch (order.status) {
    case "new":
      return { status: "confirmed", label: "Принять заказ" };
    case "confirmed":
      return { status: "preparing", label: "Начать готовить" };
    case "preparing":
      return { status: "ready", label: "Отметить готовым" };
    case "ready":
      return order.deliveryType === "delivery"
        ? { status: "delivering", label: "Передать курьеру" }
        : { status: "completed", label: "Выдать заказ" };
    case "delivering":
      return { status: "completed", label: "Завершить заказ" };
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

type KitDraft = {
  orderId: string;
  expectedUpdatedAt?: string;
  noUtensils: boolean;
  utensilsCount: number;
  kitItems: OrderKitItem[];
  maxQuantities: Record<string, number>;
};

function EmptyOrders({ filtered }: { filtered: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
      <div>
        <p className="text-base font-semibold text-foreground">{filtered ? "Заказы не найдены" : "Новых заказов пока нет"}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {filtered ? "Измените фильтр или поисковый запрос." : "Новые заказы появятся здесь автоматически."}
        </p>
      </div>
    </div>
  );
}

export default function OrdersWorkspace({ region, request, onNotice }: OrdersWorkspaceProps) {
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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
    if (!quiet) setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ regionSlug: region, limit: "25", offset: String(page * 25) });
      if (filter !== "all") query.set("status", filter);
      if (search) query.set("search", search);
      if (from) query.set("from", new Date(`${from}T00:00:00+06:00`).toISOString());
      if (to) query.set("to", new Date(`${to}T23:59:59.999+06:00`).toISOString());
      const result = await request<OrdersResponse>(`/admin/orders?${query}`);
      if (sequence !== requestSequence.current) return;
      setOrders(result.items);
      setTotal(result.total);
      setCounts(result.statusCounts);
      setSelectedOrder((current) => current
        ? { ...current, ...result.items.find((item) => item.id === current.id) }
        : null);
    } catch (loadError) {
      if (sequence !== requestSequence.current) return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказы");
    } finally {
      if (sequence === requestSequence.current && !quiet) setLoading(false);
    }
  }, [filter, region, request, search, page, from, to]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadOrders(), 0);
    const timer = window.setInterval(() => void loadOrders(true), 20_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  useEffect(() => {
    const refresh = () => void loadOrders(true);
    const open = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id || kitSaving || actionOrderId || !closeKitEditor()) return;
      const sequence = ++detailSequence.current;
      void request<AdminOrder>(`/admin/orders/${encodeURIComponent(id)}`).then((order) => {
        if (sequence !== detailSequence.current) return;
        setSelectedOrder(order); setDetailTab("summary");
      }).catch((error: unknown) => {
        if (sequence === detailSequence.current) onNotice(error instanceof Error ? error.message : "Не удалось открыть заказ", "error");
      });
    };
    if (!notificationOpened.current) {
      const id = new URLSearchParams(window.location.search).get("order");
      if (id) { notificationOpened.current = true; open(new CustomEvent("admin:open-order", { detail: { id } })); }
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
    if (searchDraft.trim() === search) return;
    const timer = window.setTimeout(() => { setPage(0); setSearch(searchDraft.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, search]);

  const updateStatus = async (order: AdminOrder, status: OrderStatus) => {
    if (actionOrderId || !can("orders.status")) return;
    if (status === "cancelled" && !window.confirm(`Отменить заказ ${orderNumber(order)}? Вернуть его в работу будет нельзя.`)) return;
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
    } catch (updateError) {
      onNotice(updateError instanceof Error ? updateError.message : "Не удалось изменить статус заказа", "error");
      await loadOrders(true);
    } finally {
      setActionOrderId(null);
    }
  };

  const openOrder = async (order: AdminOrder) => {
    if (kitSaving || actionOrderId || !closeKitEditor()) return;
    const sequence = ++detailSequence.current;
    setSelectedOrder(order);
    setDetailTab("summary");
    setDetailLoading(true);
    try {
      const full = await request<AdminOrder>(`/admin/orders/${encodeURIComponent(order.id)}`);
      if (sequence !== detailSequence.current) return;
      setSelectedOrder((current) => current?.id === full.id ? full : current);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось загрузить подробности заказа", "error"); }
    finally { if (sequence === detailSequence.current) setDetailLoading(false); }
  };

  const openKitEditor = (order: AdminOrder) => {
    if (detailLoading || !can("orders.edit") || order.status === "completed" || order.status === "cancelled") return;
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
    if (!selectedOrder || !kitDraft || kitDraft.orderId !== selectedOrder.id || kitSaving || !can("orders.edit")) return;
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
      onNotice(`${orderNumber(updated)} — комплектация сохранена`, "success");
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить комплектацию", "error");
    } finally {
      setKitSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeading title="Заказы" />
      <Card className="gap-0 overflow-hidden rounded-xl border border-border bg-card py-0" aria-label="Фильтры заказов">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border p-4">
          <form className="flex min-w-0 gap-2" onSubmit={submitSearch}>
            <Label className="relative min-w-0 flex-1">
              <span className="sr-only">Найти заказ</span>
              <Search className="size-4 shrink-0 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/20"
                placeholder="Номер, имя или телефон"
              />
            </Label>
          </form>
          <Button variant="ghost"
            type="button"
            size="icon"
            className="size-11"
            aria-label="Обновить заказы"
            title="Обновить заказы"
            disabled={loading}
            onClick={() => void loadOrders()}
          >
            <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-border p-4 lg:grid-cols-[220px_220px_1fr]"><Label className="grid gap-1.5 text-xs text-muted-foreground">С даты<Input type="date" value={from} max={to || undefined} onChange={(event) => {setFrom(event.target.value);setPage(0);}} /></Label><Label className="grid gap-1.5 text-xs text-muted-foreground">По дату<Input type="date" value={to} min={from || undefined} onChange={(event) => {setTo(event.target.value);setPage(0);}} /></Label>{from || to || search ? <Button variant="ghost" className="self-end justify-self-start" onClick={() => {setFrom("");setTo("");setSearch("");setSearchDraft("");setPage(0);}}>Сбросить фильтры</Button> : null}</div>
        <div className="overflow-x-auto px-4 py-3">
          <div className="flex min-w-max gap-2" role="list" aria-label="Фильтр по статусу">
            {filterOptions.map((option) => {
              const active = option.value === filter;
              const count = option.value === "all"
                ? Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0)
                : counts[option.value] ?? 0;
              return (
                <Button variant="ghost"
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                  }`}
                  onClick={() => { setFilter(option.value); setPage(0); }}
                >
                  {option.label} <span className={active ? "text-primary-foreground/70" : "text-muted-foreground"}>{count}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {loading ? <span className="sr-only" role="status">Обновляем заказы…</span> : null}

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <strong className="block font-semibold">Не удалось показать заказы</strong>
          <span className="mt-1 block">{error}</span>
          <Button variant="ghost" type="button" className="mt-3 font-semibold underline" onClick={() => void loadOrders()}>Повторить загрузку</Button>
        </div>
      ) : null}

      {!error ? (
        <Card className="gap-0 overflow-hidden rounded-xl border border-border bg-card py-0" aria-label="Список заказов">
          {orders.length === 0 && !loading ? <EmptyOrders filtered={Boolean(search) || filter !== "new"} /> : null}

          {orders.length > 0 ? (
            <div className="hidden overflow-x-auto md:block">
              <Table className="w-full min-w-[920px] border-collapse text-left">
                <TableHeader className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <TableRow>
                    <TableHead className="px-5 py-3.5">Заказ</TableHead>
                    <TableHead className="px-5 py-3.5">Клиент</TableHead>
                    <TableHead className="px-5 py-3.5">Получение</TableHead>
                    <TableHead className="px-5 py-3.5">Сумма</TableHead>
                    <TableHead className="px-5 py-3.5">Статус</TableHead>
                    <TableHead className="px-5 py-3.5 text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {orders.map((order) => {
                    const transition = primaryTransition(order);
                    return (
                      <TableRow key={order.id} className="group hover:bg-muted/80">
                        <TableCell className="px-5 py-4 align-top">
                          <Button variant="ghost" type="button" className="admin-order-link text-left hover:underline" onClick={() => void openOrder(order)}>
                            <strong className="block text-sm font-semibold text-foreground">{orderNumber(order)}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-top">
                          <strong className="block max-w-52 truncate text-sm font-medium text-foreground">{order.customerName || "Без имени"}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">{order.phone}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-top">
                          <span className="block text-sm text-foreground">{deliveryLabel(order)}</span>
                          <span className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">{order.address || "Адрес не указан"}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4 align-top text-sm font-semibold text-foreground">{formatMoney(order.total)}</TableCell>
                        <TableCell className="px-5 py-4 align-top"><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            {transition && can("orders.status") ? (
                              <Button variant="ghost"
                                type="button"
                                disabled={actionOrderId === order.id}
                                className="min-h-10 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                                onClick={() => void updateStatus(order, transition.status)}
                              >
                                {actionOrderId === order.id ? "Сохраняем…" : transition.label}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {orders.length > 0 ? (
            <div className="divide-y divide-border md:hidden">
              {orders.map((order) => {
                const transition = primaryTransition(order);
                return (
                  <article key={order.id} className="p-4">
                    <Button variant="ghost" type="button" className="admin-order-summary w-full text-left" onClick={() => void openOrder(order)}>
                      <span className="flex w-full min-w-0 items-start justify-between gap-3">
                        <span className="min-w-0">
                          <strong className="block text-base font-semibold text-foreground">{orderNumber(order)}</strong>
                          <small className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)}</small>
                        </span>
                        <span className="flex shrink-0 items-center gap-2"><StatusBadge status={order.status} /><ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" /></span>
                      </span>
                      <span className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                        <span className="min-w-0">
                          <small className="block text-xs text-muted-foreground">Клиент</small>
                          <strong className="mt-1 block break-words font-medium text-foreground">{order.customerName || "Без имени"}</strong>
                        </span>
                        <span>
                          <small className="block text-xs text-muted-foreground">Сумма</small>
                          <strong className="mt-1 block font-semibold text-foreground">{formatMoney(order.total)}</strong>
                        </span>
                      </span>
                      <span className="mt-3 block min-w-0 break-words border-t border-border pt-3 text-sm text-muted-foreground">
                        {deliveryLabel(order)} · {order.address || "Адрес не указан"}
                      </span>
                    </Button>
                    <div className="mt-4 grid gap-2">
                      {transition && can("orders.status") ? (
                        <Button variant="ghost"
                          type="button"
                          disabled={actionOrderId === order.id}
                          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                          onClick={() => void updateStatus(order, transition.status)}
                        >
                          {actionOrderId === order.id ? "Сохраняем…" : transition.label}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </Card>
      ) : null}

      <ListPagination total={total} page={page} loading={loading} onPageChange={setPage} />

      <EditorDialog open={Boolean(selectedOrder) && !kitDraft} onClose={() => { if (!kitSaving && closeKitEditor()) { detailSequence.current += 1; setSelectedOrder(null); setDetailTab("summary"); setDetailLoading(false); } }} title={selectedOrder ? `Заказ ${orderNumber(selectedOrder)}` : "Заказ"} description={detailLoading ? "Загружаем актуальные сведения…" : selectedOrder ? `Создан ${formatDate(selectedOrder.createdAt)}` : undefined} wide>
        {selectedOrder ? <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><Tabs value={detailTab} onValueChange={setDetailTab}><TabsList><TabsTrigger value="summary">Состав и клиент</TabsTrigger><TabsTrigger value="kit">Комплектация</TabsTrigger><TabsTrigger value="history">История</TabsTrigger></TabsList></Tabs><StatusBadge status={selectedOrder.status} /></div>
            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
              <div className="grid gap-6">
                <Card className={detailTab === "summary" ? "gap-0 p-4" : "hidden"} aria-labelledby="customer-title">
                  <h3 id="customer-title" className="text-sm font-semibold text-foreground">Клиент и получение</h3>
                  <div className="mt-3 rounded-xl border border-border p-4 text-sm">
                    <strong className="block text-base text-foreground">{selectedOrder.customerName || "Без имени"}</strong>
                    <a className="mt-3 flex items-center gap-2 text-primary" href={`tel:${selectedOrder.phone}`}>
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      <span>Позвонить: {selectedOrder.phone}</span>
                    </a>
                    <div className="mt-3 flex items-start gap-2 text-foreground">
                      <MapPin className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        <strong className="block font-medium">{deliveryLabel(selectedOrder)}</strong>
                        <span className="mt-1 block text-muted-foreground">{selectedOrder.address || "Адрес не указан"}</span>
                        {selectedOrder.deliveryType === "delivery" ? (
                          <small className="mt-1 block text-muted-foreground">
                            {[
                              selectedOrder.apartment && `кв. ${selectedOrder.apartment}`,
                              selectedOrder.entrance && `подъезд ${selectedOrder.entrance}`,
                              selectedOrder.floor && `этаж ${selectedOrder.floor}`,
                              selectedOrder.intercom && `домофон ${selectedOrder.intercom}`,
                            ].filter(Boolean).join(" · ") || "Без дополнительных деталей"}
                          </small>
                        ) : null}
                      </span>
                    </div>
                    {selectedOrder.comment ? (
                      <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                        <strong className="block text-xs font-semibold uppercase tracking-wide">Комментарий клиента</strong>
                        <p className="mt-1">{selectedOrder.comment}</p>
                      </div>
                    ) : null}
                  </div>
                </Card>

                <Card className={detailTab === "summary" ? "gap-0 p-4" : "hidden"} aria-labelledby="items-title">
                  <h3 id="items-title" className="text-sm font-semibold text-foreground">Состав заказа</h3>
                  <div className="mt-3 divide-y divide-border rounded-xl border border-border">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <strong className="block text-sm font-medium text-foreground">{item.quantity} × {item.productName}</strong>
                          {item.modifierSnapshots?.length ? (
                            <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                              {item.modifierSnapshots.map((modifier) => (
                                <li key={`${item.id}-${modifier.itemId}`}>{modifier.itemName}{modifier.quantity > 1 ? ` × ${modifier.quantity}` : ""}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-foreground">{formatMoney(item.lineTotal)}</span>
                      </div>
                    ))}
                    <div className="grid gap-2 bg-muted/50 p-4 text-sm">
                      <div className="flex justify-between gap-4 text-muted-foreground"><span>Оплата</span><span>{paymentLabel(selectedOrder.paymentMethod)}</span></div>
                      <div className="flex justify-between gap-4 text-muted-foreground"><span>Приборы</span><span>{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} шт.`}</span></div>
                      <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold text-foreground"><span>Итого</span><span>{formatMoney(selectedOrder.total)}</span></div>
                    </div>
                  </div>
                </Card>

                <Card className={detailTab === "kit" ? "gap-0 p-4" : "hidden"} aria-labelledby="kit-title">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="kit-title" className="text-sm font-semibold text-foreground">Комплектация</h3>
                    {can("orders.edit") && !(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (
                      <Button variant="ghost" type="button" className="rounded-lg border border-input px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50" onClick={() => openKitEditor(selectedOrder)}>Изменить комплектацию</Button>
                    ) : null}
                  </div>
                  <div className="mt-3 rounded-xl border border-border p-4 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-muted-foreground">Приборы</span><strong className="font-medium text-foreground">{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} персон`}</strong></div>
                    <div className="mt-3 grid gap-2 border-t border-border pt-3">
                      {(selectedOrder.kitItems ?? []).map((kitItem) => (
                        <div key={kitItem.id} className="flex justify-between gap-4 text-foreground"><span>{kitItem.name}</span><strong className="font-medium">{kitItem.quantity} шт.</strong></div>
                      ))}
                      {!selectedOrder.kitItems?.length ? <p className="text-muted-foreground">Дополнительная комплектация не указана.</p> : null}
                    </div>
                  </div>
                </Card>

                {detailTab === "history" ? <Card className="p-5"><h3 className="font-semibold">История обработки</h3><ol className="space-y-4 border-l border-border pl-5"><li className="text-sm"><strong className="block">Заказ создан</strong><span className="text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span></li>{((selectedOrder as AdminOrder & {statusHistory?:Array<{id:string;status:OrderStatus;createdAt:string;actorName?:string}>}).statusHistory ?? []).map((entry) => <li key={entry.id} className="text-sm"><strong className="block">{statusLabels[entry.status]}</strong><span className="text-muted-foreground">{formatDate(entry.createdAt)}{entry.actorName ? ` · ${entry.actorName}` : ""}</span></li>)}</ol><p className="text-xs text-muted-foreground">Текущий статус: {statusLabels[selectedOrder.status]}</p></Card> : null}
                {selectedOrder.posLastError ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                    <strong className="block">Ошибка передачи на кухню</strong>
                    <span className="mt-1 block">Не удалось передать заказ в систему кухни. Проверьте подключение в разделе интеграции.</span>
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="border-t border-border bg-card p-4 md:px-7">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                {primaryTransition(selectedOrder) && can("orders.status") ? (
                  <Button variant="ghost"
                    type="button"
                    disabled={actionOrderId === selectedOrder.id}
                    className="min-h-12 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    onClick={() => {
                      const transition = primaryTransition(selectedOrder);
                      if (transition) void updateStatus(selectedOrder, transition.status);
                    }}
                  >
                    {actionOrderId === selectedOrder.id ? "Сохраняем…" : primaryTransition(selectedOrder)?.label}
                  </Button>
                ) : <div />}
                {can("orders.status") && !(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (
                  <Button variant="ghost"
                    type="button"
                    disabled={actionOrderId === selectedOrder.id}
                    className="min-h-12 rounded-lg border border-destructive/20 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                    onClick={() => void updateStatus(selectedOrder, "cancelled")}
                  >
                    Отменить заказ
                  </Button>
                ) : null}
              </div>
            </footer>
        </div> : null}
      </EditorDialog>

      <EditorDialog open={Boolean(selectedOrder && kitDraft)} onClose={() => { if (!kitSaving) closeKitEditor(); }} title={selectedOrder ? `Комплектация ${orderNumber(selectedOrder)}` : "Комплектация"}>
        {selectedOrder && kitDraft ? <fieldset disabled={kitSaving || !can("orders.edit")} className="flex min-h-0 flex-col">
            <div className="grid gap-4 overflow-y-auto p-5">
              <Label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm font-medium text-foreground"><span>Без приборов</span><input type="checkbox" className="size-5 accent-primary" checked={kitDraft.noUtensils} onChange={(event) => setKitDraft({ ...kitDraft, noUtensils: event.target.checked })} /></Label>
              {!kitDraft.noUtensils ? <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"><span><strong className="block text-sm text-foreground">Количество персон</strong><small className="mt-1 block text-xs text-muted-foreground">Палочки и салфетки</small></span><span className="flex items-center gap-3"><Button variant="ghost" type="button" aria-label="Уменьшить количество персон" className="grid size-10 place-items-center rounded-lg border border-input text-xl text-foreground" onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.max(1, kitDraft.utensilsCount - 1) })}>−</Button><strong className="min-w-6 text-center text-base">{kitDraft.utensilsCount}</strong><Button variant="ghost" type="button" aria-label="Увеличить количество персон" className="grid size-10 place-items-center rounded-lg border border-input text-xl text-foreground" onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.min(50, kitDraft.utensilsCount + 1) })}>+</Button></span></div> : null}
              {kitDraft.kitItems.length ? <div className="divide-y divide-border rounded-xl border border-border">{kitDraft.kitItems.map((kitItem) => <div key={kitItem.id} className="flex min-w-0 items-center justify-between gap-3 p-4"><span className="min-w-0"><strong className="block break-words text-sm font-medium text-foreground">{kitItem.name}</strong><small className="mt-1 block text-xs text-muted-foreground">Входит в заказ: {kitDraft.maxQuantities[kitItem.id]} шт.</small></span><span className="flex shrink-0 items-center gap-2"><Button variant="ghost" type="button" aria-label={`Уменьшить ${kitItem.name}`} disabled={kitItem.quantity <= 0} className="grid size-10 place-items-center rounded-lg border border-input text-xl text-foreground disabled:opacity-40" onClick={() => changeKitQuantity(kitItem.id, -1)}>−</Button><strong className="min-w-6 text-center text-base">{kitItem.quantity}</strong><Button variant="ghost" type="button" aria-label={`Увеличить ${kitItem.name}`} disabled={kitItem.quantity >= (kitDraft.maxQuantities[kitItem.id] ?? 0)} className="grid size-10 place-items-center rounded-lg border border-input text-xl text-foreground disabled:opacity-40" onClick={() => changeKitQuantity(kitItem.id, 1)}>+</Button></span></div>)}</div> : <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Для блюд этого заказа бесплатная комплектация не указана.</p>}
            </div>
            <footer className="grid gap-2 border-t border-border p-4 sm:grid-cols-2"><Button variant="ghost" type="button" className="min-h-11 rounded-lg border border-input text-sm font-medium text-foreground" onClick={closeKitEditor}>Отменить</Button><Button variant="ghost" type="button" className="min-h-11 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={kitSaving} onClick={() => void saveKit()}>{kitSaving ? "Сохраняем…" : "Сохранить комплектацию"}</Button></footer>
        </fieldset> : null}
      </EditorDialog>
    </div>
  );
}
