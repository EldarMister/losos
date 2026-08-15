"use client";

import { Icon } from "@mdi/react";
import {
  mdiAccountOutline,
  mdiChevronRight,
  mdiMagnify,
  mdiPhoneOutline,
} from "@mdi/js";

export type AdminCustomer = {
  phone: string;
  customerName: string;
  ordersCount: number;
  completedOrders: number;
  revenue: number;
  lastOrderAt: string;
  naktaCoins: number;
  nftCount: number;
  pendingNftCount: number;
};

type Props = {
  customers: AdminCustomer[];
  loading: boolean;
  search: string;
  total: number;
  page: number;
  pageCount: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onOpenOrders: (phone: string) => void;
};

const money = (value: number) => `${Math.round(Number(value) || 0).toLocaleString("ru-RU")} сом`;
const date = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};

export function CustomersView({
  customers,
  loading,
  search,
  total,
  page,
  pageCount,
  onSearchChange,
  onPageChange,
  onOpenOrders,
}: Props) {
  return <div className="admin-crm-page admin-customers-view">
    <section className="admin-surface admin-customer-directory">
      <header className="admin-surface-header">
        <span><small>Клиентская база</small></span>
        <span className="admin-record-count">{total.toLocaleString("ru-RU")} записей</span>
      </header>
      <div className="admin-directory-toolbar">
        <label className="admin-crm-search">
          <Icon path={mdiMagnify} size={0.85} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Имя или номер телефона"
            aria-label="Поиск клиентов"
          />
        </label>
        {loading ? <span className="admin-inline-loading" role="status">Обновляем…</span> : null}
      </div>

      {customers.length ? <div className="admin-table-scroll">
        <table className="admin-data-table admin-customers-table">
          <thead><tr><th>Клиент</th><th>Заказы</th><th>Выручка</th><th>NAKTA Coin</th><th>NFT</th><th>Последний заказ</th><th><span className="sr-only">Действия</span></th></tr></thead>
          <tbody>{customers.map((customer) => <tr key={customer.phone}>
            <td data-label="Клиент"><span className="admin-customer-cell"><i><Icon path={mdiAccountOutline} size={0.78} /></i><span><b>{customer.customerName || "Без имени"}</b><a href={`tel:${customer.phone}`}><Icon path={mdiPhoneOutline} size={0.58} />{customer.phone}</a></span></span></td>
            <td data-label="Заказы"><b>{Number(customer.ordersCount)}</b><small>{Number(customer.completedOrders)} завершено</small></td>
            <td data-label="Выручка"><b>{money(Number(customer.revenue))}</b><small>за всё время</small></td>
            <td data-label="NAKTA Coin"><span className="admin-coin-pill">{Number(customer.naktaCoins).toLocaleString("ru-RU")}</span></td>
            <td data-label="NFT"><span className="admin-nft-pill">{Number(customer.nftCount)}</span>{Number(customer.pendingNftCount) ? <small className="warning">{Number(customer.pendingNftCount)} в обработке</small> : <small>без заявок</small>}</td>
            <td data-label="Последний заказ">{date(customer.lastOrderAt)}</td>
            <td data-label="Действия"><button type="button" className="admin-row-link" onClick={() => onOpenOrders(customer.phone)} aria-label={`Открыть заказы клиента ${customer.customerName || customer.phone}`}><Icon path={mdiChevronRight} size={0.8} /></button></td>
          </tr>)}</tbody>
        </table>
      </div> : !loading ? <div className="admin-empty-state"><span><Icon path={mdiAccountOutline} size={1.35} /></span><h3>{search ? "Клиенты не найдены" : "Клиентов пока нет"}</h3><p>{search ? "Проверьте имя или номер телефона." : "Клиенты появятся после первого заказа."}</p></div> : null}
      {pageCount > 1 ? <nav className="admin-directory-pagination" aria-label="Страницы клиентской базы">
        <button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>← Назад</button>
        <span>Страница <b>{page}</b> из {pageCount}</span>
        <button type="button" disabled={page >= pageCount || loading} onClick={() => onPageChange(page + 1)}>Вперёд →</button>
      </nav> : null}
    </section>
  </div>;
}
