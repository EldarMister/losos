"use client";

import { Icon } from "@mdi/react";
import {
  mdiChevronRight,
  mdiClose,
  mdiMagnify,
  mdiMapMarkerOutline,
  mdiPhoneOutline,
  mdiRefresh,
} from "@mdi/js";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  new: "border-blue-200 bg-blue-50 text-blue-700",
  confirmed: "border-indigo-200 bg-indigo-50 text-indigo-700",
  preparing: "border-amber-200 bg-amber-50 text-amber-800",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delivering: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-slate-200 bg-slate-100 text-slate-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
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
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function orderNumber(order: AdminOrder) {
  return `№${order.orderNumber || order.id.slice(0, 6).toUpperCase()}`;
}

function deliveryLabel(order: AdminOrder) {
  return order.deliveryType === "pickup" ? "Самовывоз" : "Доставка";
}

function paymentLabel(method: AdminOrder["paymentMethod"]) {
  if (method === "cash") return "Наличными";
  if (method === "online") return "Оплачено онлайн";
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

const defaultKitItems: OrderKitItem[] = [
  { id: "soy-sauce", name: "Соевый соус", quantity: 1 },
  { id: "wasabi", name: "Васаби", quantity: 1 },
  { id: "pickled-ginger", name: "Имбирь маринованный", quantity: 1 },
];

type KitDraft = {
  noUtensils: boolean;
  utensilsCount: number;
  kitItems: OrderKitItem[];
};

function EmptyOrders({ filtered }: { filtered: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center px-6 py-12 text-center">
      <div>
        <p className="text-base font-semibold text-slate-900">{filtered ? "Заказы не найдены" : "Новых заказов пока нет"}</p>
        <p className="mt-2 text-sm text-slate-500">
          {filtered ? "Измените фильтр или поисковый запрос." : "Список обновляется автоматически каждые 20 секунд."}
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
  const [kitDraft, setKitDraft] = useState<KitDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [kitSaving, setKitSaving] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const loadOrders = useCallback(async (quiet = false) => {
    const sequence = ++requestSequence.current;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ regionSlug: region, limit: "100", offset: "0" });
      if (filter !== "all") query.set("status", filter);
      if (search) query.set("search", search);
      const result = await request<OrdersResponse>(`/admin/orders?${query}`);
      if (sequence !== requestSequence.current) return;
      setOrders(result.items);
      setTotal(result.total);
      setCounts(result.statusCounts);
      setSelectedOrder((current) => current
        ? result.items.find((item) => item.id === current.id) ?? current
        : null);
    } catch (loadError) {
      if (sequence !== requestSequence.current) return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заказы");
    } finally {
      if (sequence === requestSequence.current && !quiet) setLoading(false);
    }
  }, [filter, region, request, search]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadOrders(), 0);
    const timer = window.setInterval(() => void loadOrders(true), 20_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
  };

  const updateStatus = async (order: AdminOrder, status: OrderStatus) => {
    if (actionOrderId) return;
    if (status === "cancelled" && !window.confirm(`Отменить заказ ${orderNumber(order)}? Вернуть его в работу будет нельзя.`)) return;
    setActionOrderId(order.id);
    try {
      const updated = await request<AdminOrder>(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedOrder((current) => current?.id === updated.id ? updated : current);
      onNotice(`${orderNumber(updated)} — ${statusLabels[updated.status]}`, "success");
      await loadOrders(true);
    } catch (updateError) {
      onNotice(updateError instanceof Error ? updateError.message : "Не удалось изменить статус заказа", "error");
    } finally {
      setActionOrderId(null);
    }
  };

  const openKitEditor = (order: AdminOrder) => {
    setKitDraft({
      noUtensils: order.noUtensils,
      utensilsCount: Math.max(1, order.utensilsCount || 1),
      kitItems: (order.kitItems?.length ? order.kitItems : defaultKitItems).map((item) => ({ ...item })),
    });
  };

  const changeKitQuantity = (id: string, delta: number) => {
    setKitDraft((current) => current ? {
      ...current,
      kitItems: current.kitItems.map((item) => item.id === id
        ? { ...item, quantity: Math.min(20, Math.max(0, item.quantity + delta)) }
        : item),
    } : current);
  };

  const saveKit = async () => {
    if (!selectedOrder || !kitDraft || kitSaving) return;
    setKitSaving(true);
    try {
      const updated = await request<AdminOrder>(`/admin/orders/${selectedOrder.id}/kit`, {
        method: "PATCH",
        body: JSON.stringify({
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
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white" aria-label="Фильтры заказов">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[minmax(260px,1fr)_auto] md:items-center">
          <form className="flex min-w-0 gap-2" onSubmit={submitSearch}>
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Найти заказ</span>
              <Icon path={mdiMagnify} size={0.78} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-400" />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="Номер, имя или телефон"
              />
            </label>
            <button type="submit" className="h-11 shrink-0 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              Найти
            </button>
          </form>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => void loadOrders()}
          >
            <Icon path={mdiRefresh} size={0.78} aria-hidden="true" />
            Обновить список
          </button>
        </div>

        <div className="overflow-x-auto px-4 py-3">
          <div className="flex min-w-max gap-2" role="list" aria-label="Фильтр по статусу">
            {filterOptions.map((option) => {
              const active = option.value === filter;
              const count = option.value === "all"
                ? Object.values(counts).reduce((sum, value) => sum + (value ?? 0), 0)
                : counts[option.value] ?? 0;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  }`}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label} <span className={active ? "text-slate-300" : "text-slate-400"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-sm text-slate-500">Показано: <strong className="font-semibold text-slate-900">{orders.length}</strong> из {total}</p>
        {loading ? <span className="text-sm text-slate-500" role="status">Обновляем…</span> : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          <strong className="block font-semibold">Не удалось показать заказы</strong>
          <span className="mt-1 block">{error}</span>
          <button type="button" className="mt-3 font-semibold underline" onClick={() => void loadOrders()}>Повторить загрузку</button>
        </div>
      ) : null}

      {!error ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label="Список заказов">
          {orders.length === 0 && !loading ? <EmptyOrders filtered={Boolean(search) || filter !== "new"} /> : null}

          {orders.length > 0 ? (
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Заказ</th>
                    <th className="px-5 py-3.5">Клиент</th>
                    <th className="px-5 py-3.5">Получение</th>
                    <th className="px-5 py-3.5">Сумма</th>
                    <th className="px-5 py-3.5">Статус</th>
                    <th className="px-5 py-3.5 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => {
                    const transition = primaryTransition(order);
                    return (
                      <tr key={order.id} className="group hover:bg-slate-50/80">
                        <td className="px-5 py-4 align-top">
                          <button type="button" className="text-left" onClick={() => setSelectedOrder(order)}>
                            <strong className="block text-sm font-semibold text-slate-950">{orderNumber(order)}</strong>
                            <span className="mt-1 block text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                          </button>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <strong className="block max-w-52 truncate text-sm font-medium text-slate-900">{order.customerName || "Без имени"}</strong>
                          <span className="mt-1 block text-xs text-slate-500">{order.phone}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="block text-sm text-slate-900">{deliveryLabel(order)}</span>
                          <span className="mt-1 block max-w-64 truncate text-xs text-slate-500">{order.address || "Адрес не указан"}</span>
                        </td>
                        <td className="px-5 py-4 align-top text-sm font-semibold text-slate-950">{formatMoney(order.total)}</td>
                        <td className="px-5 py-4 align-top"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            {transition ? (
                              <button
                                type="button"
                                disabled={actionOrderId === order.id}
                                className="min-h-10 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                                onClick={() => void updateStatus(order, transition.status)}
                              >
                                {actionOrderId === order.id ? "Сохраняем…" : transition.label}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Подробнее <Icon path={mdiChevronRight} size={0.65} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {orders.length > 0 ? (
            <div className="divide-y divide-slate-200 md:hidden">
              {orders.map((order) => {
                const transition = primaryTransition(order);
                return (
                  <article key={order.id} className="p-4">
                    <button type="button" className="w-full text-left" onClick={() => setSelectedOrder(order)}>
                      <span className="flex items-start justify-between gap-3">
                        <span>
                          <strong className="block text-base font-semibold text-slate-950">{orderNumber(order)}</strong>
                          <small className="mt-1 block text-xs text-slate-500">{formatDate(order.createdAt)}</small>
                        </span>
                        <StatusBadge status={order.status} />
                      </span>
                      <span className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <span>
                          <small className="block text-xs text-slate-500">Клиент</small>
                          <strong className="mt-1 block truncate font-medium text-slate-900">{order.customerName || "Без имени"}</strong>
                        </span>
                        <span>
                          <small className="block text-xs text-slate-500">Сумма</small>
                          <strong className="mt-1 block font-semibold text-slate-950">{formatMoney(order.total)}</strong>
                        </span>
                      </span>
                      <span className="mt-3 block border-t border-slate-100 pt-3 text-sm text-slate-600">
                        {deliveryLabel(order)} · {order.address || "Адрес не указан"}
                      </span>
                    </button>
                    <div className="mt-4 grid gap-2">
                      {transition ? (
                        <button
                          type="button"
                          disabled={actionOrderId === order.id}
                          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                          onClick={() => void updateStatus(order, transition.status)}
                        >
                          {actionOrderId === order.id ? "Сохраняем…" : transition.label}
                        </button>
                      ) : null}
                      <button type="button" className="min-h-11 rounded-lg border border-slate-300 text-sm font-medium text-slate-700" onClick={() => setSelectedOrder(order)}>
                        Открыть заказ
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedOrder(null);
        }}>
          <section className="flex h-dvh w-full flex-col bg-white shadow-2xl md:max-w-2xl" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="order-detail-title" className="text-xl font-semibold text-slate-950">Заказ {orderNumber(selectedOrder)}</h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">Создан {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button type="button" aria-label="Закрыть карточку заказа" className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setSelectedOrder(null)}>
                <Icon path={mdiClose} size={0.8} aria-hidden="true" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
              <div className="grid gap-6">
                <section aria-labelledby="customer-title">
                  <h3 id="customer-title" className="text-sm font-semibold text-slate-950">Клиент и получение</h3>
                  <div className="mt-3 rounded-xl border border-slate-200 p-4 text-sm">
                    <strong className="block text-base text-slate-950">{selectedOrder.customerName || "Без имени"}</strong>
                    <a className="mt-3 flex items-center gap-2 text-blue-700" href={`tel:${selectedOrder.phone}`}>
                      <Icon path={mdiPhoneOutline} size={0.72} aria-hidden="true" />
                      <span>Позвонить: {selectedOrder.phone}</span>
                    </a>
                    <div className="mt-3 flex items-start gap-2 text-slate-700">
                      <Icon path={mdiMapMarkerOutline} size={0.72} aria-hidden="true" className="mt-0.5 shrink-0" />
                      <span>
                        <strong className="block font-medium">{deliveryLabel(selectedOrder)}</strong>
                        <span className="mt-1 block text-slate-600">{selectedOrder.address || "Адрес не указан"}</span>
                        {selectedOrder.deliveryType === "delivery" ? (
                          <small className="mt-1 block text-slate-500">
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
                      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">
                        <strong className="block text-xs font-semibold uppercase tracking-wide">Комментарий клиента</strong>
                        <p className="mt-1">{selectedOrder.comment}</p>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section aria-labelledby="items-title">
                  <h3 id="items-title" className="text-sm font-semibold text-slate-950">Состав заказа</h3>
                  <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <strong className="block text-sm font-medium text-slate-950">{item.quantity} × {item.productName}</strong>
                          {item.modifierSnapshots?.length ? (
                            <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                              {item.modifierSnapshots.map((modifier) => (
                                <li key={`${item.id}-${modifier.itemId}`}>{modifier.itemName}{modifier.quantity > 1 ? ` × ${modifier.quantity}` : ""}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-950">{formatMoney(item.lineTotal)}</span>
                      </div>
                    ))}
                    <div className="grid gap-2 bg-slate-50 p-4 text-sm">
                      <div className="flex justify-between gap-4 text-slate-600"><span>Оплата</span><span>{paymentLabel(selectedOrder.paymentMethod)}</span></div>
                      <div className="flex justify-between gap-4 text-slate-600"><span>Приборы</span><span>{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} шт.`}</span></div>
                      <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-950"><span>Итого</span><span>{formatMoney(selectedOrder.total)}</span></div>
                    </div>
                  </div>
                </section>

                <section aria-labelledby="kit-title">
                  <div className="flex items-center justify-between gap-3">
                    <h3 id="kit-title" className="text-sm font-semibold text-slate-950">Комплектация</h3>
                    {!(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (
                      <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => openKitEditor(selectedOrder)}>Изменить комплектацию</button>
                    ) : null}
                  </div>
                  <div className="mt-3 rounded-xl border border-slate-200 p-4 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-slate-500">Приборы</span><strong className="font-medium text-slate-900">{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} персон`}</strong></div>
                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                      {(selectedOrder.kitItems?.length ? selectedOrder.kitItems : defaultKitItems).map((kitItem) => (
                        <div key={kitItem.id} className="flex justify-between gap-4 text-slate-700"><span>{kitItem.name}</span><strong className="font-medium">{kitItem.quantity} шт.</strong></div>
                      ))}
                    </div>
                  </div>
                </section>

                {selectedOrder.posLastError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                    <strong className="block">Ошибка передачи на кухню</strong>
                    <span className="mt-1 block">{selectedOrder.posLastError}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-white p-4 md:px-7">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                {primaryTransition(selectedOrder) ? (
                  <button
                    type="button"
                    disabled={actionOrderId === selectedOrder.id}
                    className="min-h-12 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => {
                      const transition = primaryTransition(selectedOrder);
                      if (transition) void updateStatus(selectedOrder, transition.status);
                    }}
                  >
                    {actionOrderId === selectedOrder.id ? "Сохраняем…" : primaryTransition(selectedOrder)?.label}
                  </button>
                ) : <div />}
                {!(["completed", "cancelled"] as OrderStatus[]).includes(selectedOrder.status) ? (
                  <button
                    type="button"
                    disabled={actionOrderId === selectedOrder.id}
                    className="min-h-12 rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    onClick={() => void updateStatus(selectedOrder, "cancelled")}
                  >
                    Отменить заказ
                  </button>
                ) : null}
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {selectedOrder && kitDraft ? (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/55 p-0 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setKitDraft(null); }}>
          <section className="flex min-h-dvh w-full max-w-lg flex-col bg-white shadow-2xl sm:min-h-0 sm:rounded-xl" role="dialog" aria-modal="true" aria-labelledby="kit-editor-title">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><h2 id="kit-editor-title" className="text-lg font-semibold text-slate-950">Комплектация {orderNumber(selectedOrder)}</h2><p className="mt-1 text-sm text-slate-500">Укажите точное количество для кухни.</p></div><button type="button" aria-label="Закрыть редактор комплектации" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={() => setKitDraft(null)}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button></header>
            <div className="grid gap-4 overflow-y-auto p-5">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-800"><span>Без приборов</span><input type="checkbox" className="size-5 accent-blue-600" checked={kitDraft.noUtensils} onChange={(event) => setKitDraft({ ...kitDraft, noUtensils: event.target.checked })} /></label>
              {!kitDraft.noUtensils ? <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"><span><strong className="block text-sm text-slate-900">Количество персон</strong><small className="mt-1 block text-xs text-slate-500">Палочки и салфетки</small></span><span className="flex items-center gap-3"><button type="button" aria-label="Уменьшить количество персон" className="grid size-10 place-items-center rounded-lg border border-slate-300 text-xl text-slate-700" onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.max(1, kitDraft.utensilsCount - 1) })}>−</button><strong className="min-w-6 text-center text-base">{kitDraft.utensilsCount}</strong><button type="button" aria-label="Увеличить количество персон" className="grid size-10 place-items-center rounded-lg border border-slate-300 text-xl text-slate-700" onClick={() => setKitDraft({ ...kitDraft, utensilsCount: Math.min(50, kitDraft.utensilsCount + 1) })}>+</button></span></div> : null}
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">{kitDraft.kitItems.map((kitItem) => <div key={kitItem.id} className="flex items-center justify-between gap-4 p-4"><strong className="text-sm font-medium text-slate-900">{kitItem.name}</strong><span className="flex items-center gap-3"><button type="button" aria-label={`Уменьшить ${kitItem.name}`} className="grid size-10 place-items-center rounded-lg border border-slate-300 text-xl text-slate-700" onClick={() => changeKitQuantity(kitItem.id, -1)}>−</button><strong className="min-w-6 text-center text-base">{kitItem.quantity}</strong><button type="button" aria-label={`Увеличить ${kitItem.name}`} className="grid size-10 place-items-center rounded-lg border border-slate-300 text-xl text-slate-700" onClick={() => changeKitQuantity(kitItem.id, 1)}>+</button></span></div>)}</div>
            </div>
            <footer className="grid gap-2 border-t border-slate-200 p-4 sm:grid-cols-2"><button type="button" className="min-h-11 rounded-lg border border-slate-300 text-sm font-medium text-slate-700" onClick={() => setKitDraft(null)}>Отменить</button><button type="button" className="min-h-11 rounded-lg bg-blue-600 text-sm font-semibold text-white disabled:opacity-60" disabled={kitSaving} onClick={() => void saveKit()}>{kitSaving ? "Сохраняем…" : "Сохранить комплектацию"}</button></footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
