"use client";

import {
  mdiArrowLeft,
  mdiMagnify,
  mdiMinus,
  mdiPlus,
  mdiRefresh,
} from "@mdi/js";
import { Icon } from "@mdi/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AdminRequest,
  Customer,
  CustomerDetail,
  CustomerRewardAdjustment,
  NftWithdrawalStatus,
  OrderStatus,
} from "./admin-types";

type UsersWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type RewardAction = {
  asset: "coin" | "nft";
  direction: "add" | "remove";
  amount: string;
  reason: string;
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

const nftLabels: Record<NftWithdrawalStatus, string> = {
  owned: "Доступен",
  pending: "Вывод запрошен",
  submitted: "Отправлен",
  withdrawn: "Выведен",
  failed: "Ошибка вывода",
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

function changeLabel(item: CustomerRewardAdjustment) {
  const asset = item.asset === "coin" ? "NAKTA Coin" : "NFT";
  return `${item.delta > 0 ? "+" : ""}${formatNumber(item.delta)} ${asset}`;
}

export function UsersWorkspace({ region, request, onNotice }: UsersWorkspaceProps) {
  const [users, setUsers] = useState<Customer[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [action, setAction] = useState<RewardAction | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setAction(null);
    setError("");
  };

  const beginAdjustment = (asset: "coin" | "nft", direction: "add" | "remove") => {
    setAction({ asset, direction, amount: "1", reason: "" });
  };

  const submitAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || !selectedPhone || saving) return;
    const amount = Number(action.amount);
    if (!Number.isInteger(amount) || amount < 1) return;
    const delta = action.direction === "add" ? amount : -amount;
    setSaving(true);
    try {
      const updated = await request<CustomerDetail>(`/admin/customers/${encodeURIComponent(selectedPhone)}/rewards/adjust`, {
        method: "POST",
        body: JSON.stringify({
          region,
          asset: action.asset,
          delta,
          reason: action.reason.trim(),
        }),
      });
      setDetail(updated);
      setUsers((current) => current.map((user) => user.phone === updated.phone ? {
        ...user,
        naktaCoins: updated.naktaCoins,
        nftCount: updated.nftCount,
        pendingNftCount: updated.pendingNftCount,
      } : user));
      onNotice(action.direction === "add" ? "Награда начислена пользователю" : "Награда списана у пользователя", "success");
      setAction(null);
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось изменить баланс", "error");
    } finally {
      setSaving(false);
    }
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
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">Всего заказов</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(detail.ordersCount)}</dd><span className="mt-1 block text-xs text-slate-500">Завершено: {formatNumber(detail.completedOrders)}</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">Сумма покупок</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(detail.revenue)}</dd><span className="mt-1 block text-xs text-slate-500">Только завершённые заказы</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">Баланс NAKTA Coin</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(detail.naktaCoins)}</dd><span className="mt-1 block text-xs text-slate-500">Текущий доступный баланс</span></div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs text-slate-500">NFT пользователя</dt><dd className="mt-2 text-2xl font-semibold text-slate-950">{formatNumber(detail.nftCount)}</dd><span className="mt-1 block text-xs text-slate-500">Доступно: {detail.availableNftCount} · На выводе: {detail.pendingNftCount}</span></div>
            </dl>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="font-semibold text-slate-950">Управление NAKTA Coin</h3>
                <p className="mt-1 text-sm text-slate-500">Текущий баланс: {formatNumber(detail.naktaCoins)} Coin</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" className={primaryButton} onClick={() => beginAdjustment("coin", "add")}><Icon path={mdiPlus} size={0.72} aria-hidden="true" />Начислить Coin</button>
                <button type="button" className={secondaryButton} onClick={() => beginAdjustment("coin", "remove")} disabled={detail.naktaCoins === 0}><Icon path={mdiMinus} size={0.72} aria-hidden="true" />Списать Coin</button>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="font-semibold text-slate-950">Управление NFT</h3>
                <p className="mt-1 text-sm text-slate-500">Доступно для списания: {formatNumber(detail.availableNftCount)} NFT</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" className={primaryButton} onClick={() => beginAdjustment("nft", "add")}><Icon path={mdiPlus} size={0.72} aria-hidden="true" />Начислить NFT</button>
                <button type="button" className={secondaryButton} onClick={() => beginAdjustment("nft", "remove")} disabled={detail.availableNftCount === 0}><Icon path={mdiMinus} size={0.72} aria-hidden="true" />Списать NFT</button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">NFT, которые выводятся или уже выведены, списать нельзя.</p>
            </section>
          </div>

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

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5"><h3 className="font-semibold text-slate-950">NFT пользователя</h3><p className="mt-1 text-sm text-slate-500">Все начисленные NFT и их текущий статус.</p></div>
              {detail.nfts.length ? <div className="divide-y divide-slate-200">{detail.nfts.map((nft) => <article key={nft.id} className="p-4 sm:px-5"><div className="flex items-start justify-between gap-3"><div><strong className="text-slate-950">{nft.name}</strong><span className="mt-1 block text-xs text-slate-500">{nft.network} · {formatDate(nft.createdAt)}</span></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{nftLabels[nft.status]}</span></div></article>)}</div> : <p className="p-8 text-center text-sm text-slate-500">NFT пока не начислялись.</p>}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5"><h3 className="font-semibold text-slate-950">История ручных изменений</h3><p className="mt-1 text-sm text-slate-500">Когда и почему баланс менялся через админ-панель.</p></div>
              {detail.adjustments.length ? <div className="divide-y divide-slate-200">{detail.adjustments.map((item) => <article key={item.id} className="p-4 sm:px-5"><div className="flex items-start justify-between gap-3"><div><strong className={item.delta > 0 ? "text-emerald-700" : "text-red-700"}>{changeLabel(item)}</strong><p className="mt-1 text-sm text-slate-700">{item.reason}</p><span className="mt-1 block text-xs text-slate-500">{formatDate(item.createdAt)}</span></div><span className="shrink-0 text-xs text-slate-500">Остаток: {formatNumber(item.balanceAfter)}</span></div></article>)}</div> : <p className="p-8 text-center text-sm text-slate-500">Ручных изменений ещё не было.</p>}
            </section>
          </div>
        </> : null}

        {action && detail ? (
          <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/45 sm:place-items-center sm:p-4" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setAction(null);
          }}>
            <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
              <div className="border-b border-slate-200 p-5">
                <h2 id="reward-dialog-title" className="text-lg font-semibold text-slate-950">{action.direction === "add" ? "Начислить" : "Списать"} {action.asset === "coin" ? "NAKTA Coin" : "NFT"}</h2>
                <p className="mt-1 text-sm text-slate-500">Пользователь: {detail.customerName || detail.phone}</p>
              </div>
              <form className="grid gap-4 p-5" onSubmit={submitAdjustment}>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">Количество<input required type="number" min="1" max={action.asset === "nft" ? Math.max(1, action.direction === "remove" ? detail.availableNftCount : 100) : 1_000_000} className={inputClass} value={action.amount} onChange={(event) => setAction({ ...action, amount: event.target.value })} /></label>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">Причина изменения<textarea required maxLength={240} className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" placeholder="Например: компенсация за отменённый заказ" value={action.reason} onChange={(event) => setAction({ ...action, reason: event.target.value })} /></label>
                <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">После сохранения изменение попадёт в историю. Списать больше текущего доступного остатка нельзя.</p>
                <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2"><button type="button" className={secondaryButton} onClick={() => setAction(null)} disabled={saving}>Отменить</button><button type="submit" className={action.direction === "add" ? primaryButton : "min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"} disabled={saving}>{saving ? "Сохраняем…" : action.direction === "add" ? "Начислить пользователю" : "Списать у пользователя"}</button></div>
              </form>
            </section>
          </div>
        ) : null}
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
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Пользователь</th><th className="px-5 py-3">Заказы</th><th className="px-5 py-3">Сумма покупок</th><th className="px-5 py-3">NAKTA Coin</th><th className="px-5 py-3">NFT</th><th className="px-5 py-3"><span className="sr-only">Действие</span></th></tr></thead>
              <tbody className="divide-y divide-slate-200">{users.map((user) => <tr key={user.phone}><td className="px-5 py-4"><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-xs text-slate-500">{user.phone}</span></td><td className="px-5 py-4 text-slate-700"><strong>{formatNumber(user.ordersCount)}</strong><span className="mt-1 block text-xs text-slate-500">Завершено: {formatNumber(user.completedOrders)}</span></td><td className="px-5 py-4 font-semibold text-slate-950">{formatMoney(user.revenue)}</td><td className="px-5 py-4 font-semibold text-slate-950">{formatNumber(user.naktaCoins)}</td><td className="px-5 py-4 text-slate-700"><strong>{formatNumber(user.nftCount)}</strong>{user.pendingNftCount ? <span className="mt-1 block text-xs text-amber-700">На выводе: {user.pendingNftCount}</span> : null}</td><td className="px-5 py-4 text-right"><button type="button" className={secondaryButton} onClick={() => openCustomer(user.phone)}>Открыть карточку</button></td></tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-200 lg:hidden">{users.map((user) => <article key={user.phone} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-sm text-slate-500">{user.phone}</span></div><strong className="shrink-0 text-sm text-slate-950">{formatMoney(user.revenue)}</strong></div><dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-sm"><div><dt className="text-xs text-slate-500">Заказы</dt><dd className="mt-1 font-semibold text-slate-950">{formatNumber(user.ordersCount)}</dd></div><div><dt className="text-xs text-slate-500">Coin</dt><dd className="mt-1 font-semibold text-slate-950">{formatNumber(user.naktaCoins)}</dd></div><div><dt className="text-xs text-slate-500">NFT</dt><dd className="mt-1 font-semibold text-slate-950">{formatNumber(user.nftCount)}</dd></div></dl><button type="button" className={`${primaryButton} mt-4 w-full`} onClick={() => openCustomer(user.phone)}>Открыть карточку пользователя</button></article>)}</div>
        </section>
      ) : null}

      {!error && !listLoading && !users.length ? <section className="rounded-xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold text-slate-950">Пользователи не найдены</h2><p className="mt-1 text-sm text-slate-500">Измените запрос или дождитесь первого заказа.</p></section> : null}
    </div>
  );
}
