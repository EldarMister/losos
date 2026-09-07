"use client";

import {
  mdiArrowLeft,
  mdiMagnify,
  mdiRefresh,
} from "@mdi/js";
import { Icon } from "@mdi/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AdminRequest,
  Customer,
  CustomerDetail,
  OrderStatus,
} from "./admin-types";

type UsersWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";
const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100";

const orderLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function UsersWorkspace({ region, request }: UsersWorkspaceProps) {
  const [users, setUsers] = useState<Customer[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ region, search, limit: "100", offset: "0" });
      const result = await request<{ items: Customer[] }>(`/admin/customers?${query}`);
      setUsers(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить пользователей");
    } finally {
      setListLoading(false);
    }
  }, [region, request, search]);

  const loadDetail = useCallback(async (phone: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const result = await request<CustomerDetail>(`/admin/customers/${encodeURIComponent(phone)}?region=${encodeURIComponent(region)}`);
      setDetail(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карточку пользователя");
    } finally {
      setDetailLoading(false);
    }
  }, [region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
  };

  const openCustomer = (phone: string) => {
    setSelectedPhone(phone);
    setDetail(null);
    void loadDetail(phone);
  };

  const closeCustomer = () => {
    setSelectedPhone(null);
    setDetail(null);
    setError("");
  };

  if (selectedPhone) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className={`${secondaryButton} self-start`} onClick={closeCustomer}>
            <Icon path={mdiArrowLeft} size={0.72} aria-hidden="true" />
            К списку пользователей
          </button>
          <button type="button" className={secondaryButton} onClick={() => void loadDetail(selectedPhone)} disabled={detailLoading}>
            <Icon path={mdiRefresh} size={0.72} aria-hidden="true" />
            {detailLoading ? "Обновляем…" : "Обновить данные"}
          </button>
        </div>

        {error ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
            <p>{error}</p>
            <button type="button" className="mt-3 font-semibold underline" onClick={() => void loadDetail(selectedPhone)}>Повторить</button>
          </section>
        ) : null}

        {!error && detailLoading && !detail ? <section className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Загружаем карточку пользователя…</section> : null}

        {detail ? <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Карточка пользователя</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{detail.customerName || "Без имени"}</h2>
                <a href={`tel:${detail.phone}`} className="mt-2 inline-block text-sm font-medium text-blue-700">Позвонить: {detail.phone}</a>
              </div>
              <p className="text-sm text-slate-500">Последний заказ: {formatDate(detail.lastOrderAt)}</p>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">Всего заказов</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(detail.ordersCount)}</dd><span className="mt-1 block text-xs text-slate-500">Завершено: {formatNumber(detail.completedOrders)}</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">Сумма покупок</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(detail.revenue)}</dd><span className="mt-1 block text-xs text-slate-500">Только завершённые заказы</span></div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5"><h3 className="font-semibold text-slate-950">Все заказы</h3><p className="mt-1 text-sm text-slate-500">История заказов пользователя в выбранном городе.</p></div>
            {detail.orders.length ? <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Заказ</th><th className="px-5 py-3">Дата</th><th className="px-5 py-3">Тип</th><th className="px-5 py-3">Статус</th><th className="px-5 py-3 text-right">Сумма</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">{detail.orders.map((order) => <tr key={order.id}><td className="px-5 py-4 font-semibold text-slate-950">№{order.orderNumber}</td><td className="px-5 py-4 text-slate-600">{formatDate(order.createdAt)}</td><td className="px-5 py-4 text-slate-600">{order.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}</td><td className="px-5 py-4 text-slate-700">{orderLabels[order.status]}</td><td className="px-5 py-4 text-right font-semibold text-slate-950">{formatMoney(order.total)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="divide-y divide-slate-200 md:hidden">{detail.orders.map((order) => <article key={order.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-slate-950">Заказ №{order.orderNumber}</strong><span className="mt-1 block text-xs text-slate-500">{formatDate(order.createdAt)}</span></div><strong className="shrink-0 text-slate-950">{formatMoney(order.total)}</strong></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-full bg-slate-100 px-2.5 py-1">{orderLabels[order.status]}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">{order.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}</span></div></article>)}</div>
            </> : <p className="p-8 text-center text-sm text-slate-500">Заказов пока нет.</p>}
          </section>

        </> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex min-w-0 flex-1 gap-2 sm:max-w-xl" onSubmit={submitSearch}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Найти пользователя</span>
            <Icon path={mdiMagnify} size={0.75} aria-hidden="true" className="absolute left-3 top-3.5 text-slate-400" />
            <input type="search" className={`${inputClass} pl-10`} placeholder="Имя или телефон" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />
          </label>
          <button type="submit" className={primaryButton}>Найти</button>
        </form>
        <button type="button" className={secondaryButton} onClick={() => void loadUsers()} disabled={listLoading}><Icon path={mdiRefresh} size={0.72} aria-hidden="true" />{listLoading ? "Обновляем…" : "Обновить"}</button>
      </section>

      {error ? <section className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">{error}</section> : null}
      {!error && listLoading && !users.length ? <section className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Загружаем пользователей…</section> : null}

      {!error && users.length ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Пользователь</th><th className="px-5 py-3">Заказы</th><th className="px-5 py-3">Сумма покупок</th><th className="px-5 py-3"><span className="sr-only">Действие</span></th></tr></thead>
              <tbody className="divide-y divide-slate-200">{users.map((user) => <tr key={user.phone}><td className="px-5 py-4"><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-xs text-slate-500">{user.phone}</span></td><td className="px-5 py-4 text-slate-700"><strong>{formatNumber(user.ordersCount)}</strong><span className="mt-1 block text-xs text-slate-500">Завершено: {formatNumber(user.completedOrders)}</span></td><td className="px-5 py-4 font-semibold text-slate-950">{formatMoney(user.revenue)}</td><td className="px-5 py-4 text-right"><button type="button" className={secondaryButton} onClick={() => openCustomer(user.phone)}>Открыть карточку</button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-200 lg:hidden">{users.map((user) => <article key={user.phone} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-sm text-slate-500">{user.phone}</span></div><strong className="shrink-0 text-sm text-slate-950">{formatMoney(user.revenue)}</strong></div><dl className="mt-4 border-t border-slate-100 pt-3 text-sm"><div><dt className="text-xs text-slate-500">Заказы</dt><dd className="mt-1 font-semibold text-slate-950">{formatNumber(user.ordersCount)}</dd></div></dl><button type="button" className={`${primaryButton} mt-4 w-full`} onClick={() => openCustomer(user.phone)}>Открыть карточку пользователя</button></article>)}</div>
        </section>
      ) : null}

      {!error && !listLoading && !users.length ? <section className="rounded-xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">Пользователи не найдены</h2><p className="mt-1 text-sm text-slate-500">Измените запрос или дождитесь первого заказа.</p></section> : null}
    </div>
  );
}
