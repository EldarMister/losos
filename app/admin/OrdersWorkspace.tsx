"use client";

import { Icon } from "@mdi/react";
import {
  mdiFormatListBulleted,
  mdiMagnify,
  mdiRefresh,
  mdiStoreOutline,
  mdiTruckDeliveryOutline,
  mdiViewColumnOutline,
} from "@mdi/js";
import { useState } from "react";

export type OrdersWorkspaceStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export type OrdersWorkspacePeriod = "all" | "today" | "week" | "month";
export type OrdersWorkspaceView = "kanban" | "list";

export type OrdersWorkspaceOrder = {
  id: string;
  orderNumber: number;
  deliveryType: "delivery" | "pickup";
  customerName: string;
  address: string;
  total: number;
  status: OrdersWorkspaceStatus;
  createdAt: string;
};

export type OrdersWorkspaceProps<TOrder extends OrdersWorkspaceOrder = OrdersWorkspaceOrder> = {
  orders: readonly TOrder[];
  total: number;
  statusCounts: Partial<Record<OrdersWorkspaceStatus, number>>;
  loading: boolean;
  search: string;
  status: "all" | OrdersWorkspaceStatus;
  period: OrdersWorkspacePeriod;
  view: OrdersWorkspaceView;
  page: number;
  pageSize: number;
  pageCount: number;
  selectedOrderId?: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: "all" | OrdersWorkspaceStatus) => void;
  onPeriodChange: (period: OrdersWorkspacePeriod) => void;
  onViewChange: (view: OrdersWorkspaceView) => void;
  onPageChange: (page: number) => void;
  onOrderOpen: (order: TOrder) => void;
  onRefresh?: () => void;
};

type StatusDefinition = {
  value: OrdersWorkspaceStatus;
  label: string;
};

const statuses: readonly StatusDefinition[] = [
  { value: "new", label: "Новые" },
  { value: "confirmed", label: "Подтверждены" },
  { value: "preparing", label: "Готовятся" },
  { value: "ready", label: "Готовы" },
  { value: "delivering", label: "В доставке" },
  { value: "completed", label: "Завершены" },
  { value: "cancelled", label: "Отменены" },
];

const activeStatuses = statuses.filter(({ value }) => value !== "completed" && value !== "cancelled");

const periods: readonly { value: OrdersWorkspacePeriod; label: string }[] = [
  { value: "all", label: "Всё время" },
  { value: "today", label: "Сегодня" },
  { value: "week", label: "7 дней" },
  { value: "month", label: "Месяц" },
];

const statusLabels = Object.fromEntries(
  statuses.map(({ value, label }) => [value, label]),
) as Record<OrdersWorkspaceStatus, string>;

const formatOrderNumber = (order: OrdersWorkspaceOrder) =>
  `№${order.orderNumber || order.id.slice(0, 6).toUpperCase()}`;

const formatMoney = (value: number) =>
  `${Math.round(Number(value) || 0).toLocaleString("ru-RU")} сом`;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const orderAddress = (order: OrdersWorkspaceOrder) =>
  order.deliveryType === "pickup" ? "Самовывоз" : order.address || "Адрес не указан";

const pageNumbers = (page: number, pageCount: number) =>
  [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((left, right) => left - right);

export default function OrdersWorkspace<TOrder extends OrdersWorkspaceOrder>({
  orders,
  total,
  statusCounts,
  loading,
  search,
  status,
  period,
  view,
  page,
  pageSize,
  pageCount,
  selectedOrderId,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  onViewChange,
  onPageChange,
  onOrderOpen,
  onRefresh,
}: OrdersWorkspaceProps<TOrder>) {
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"all" | "delivery" | "pickup">("all");
  const visibleStatuses = status === "all"
    ? activeStatuses
    : statuses.filter((item) => item.value === status);
  const filteredOrders = deliveryTypeFilter === "all"
    ? orders
    : orders.filter((order) => order.deliveryType === deliveryTypeFilter);
  const visiblePages = pageNumbers(page, pageCount);
  const countedOrders = Object.values(statusCounts)
    .reduce((sum, count) => sum + Number(count || 0), 0);
  const allStatusCount = countedOrders || total;
  const firstVisibleOrder = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleOrder = Math.min((page - 1) * pageSize + orders.length, total);

  return <section className="admin-orders-workspace" aria-busy={loading}>
    <header className="admin-orders-commandbar">
      <label className="admin-orders-search">
        <Icon path={mdiMagnify} size={0.82} aria-hidden="true" />
        <input
          type="search"
          aria-label="Поиск заказов"
          value={search}
          placeholder="Заказ, клиент, телефон или адрес"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="admin-orders-filters" role="group" aria-label="Фильтры заказов">
        <label>
          <select
            aria-label="Статус заказа"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as "all" | OrdersWorkspaceStatus)}
          >
            <option value="all">{view === "kanban" ? "Активные" : "Все статусы"} · {view === "kanban"
              ? activeStatuses.reduce((sum, item) => sum + Number(statusCounts[item.value] || 0), 0)
              : allStatusCount}</option>
            {statuses.map((item) => <option value={item.value} key={item.value}>
              {item.label} · {Number(statusCounts[item.value] || 0)}
            </option>)}
          </select>
        </label>
        <label>
          <select
            aria-label="Тип заказа"
            value={deliveryTypeFilter}
            onChange={(event) => setDeliveryTypeFilter(event.target.value as "all" | "delivery" | "pickup")}
          >
            <option value="all">Все типы</option>
            <option value="delivery">Доставка</option>
            <option value="pickup">Самовывоз</option>
          </select>
        </label>
        <label>
          <select
            aria-label="Период заказов"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as OrdersWorkspacePeriod)}
          >
            {periods.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>
        {onRefresh ? <button
          type="button"
          className="admin-orders-refresh"
          disabled={loading}
          aria-label="Обновить заказы"
          title="Обновить"
          onClick={onRefresh}
        ><Icon path={mdiRefresh} size={0.8} aria-hidden="true" /></button> : null}
      </div>

      <div className="admin-orders-view-switch" role="group" aria-label="Вид заказов">
        <button
          type="button"
          className={view === "kanban" ? "active" : ""}
          aria-pressed={view === "kanban"}
          onClick={() => onViewChange("kanban")}
        ><Icon path={mdiViewColumnOutline} size={0.78} aria-hidden="true" /><span>Канбан</span></button>
        <button
          type="button"
          className={view === "list" ? "active" : ""}
          aria-pressed={view === "list"}
          onClick={() => onViewChange("list")}
        ><Icon path={mdiFormatListBulleted} size={0.78} aria-hidden="true" /><span>Список</span></button>
      </div>
    </header>

    {loading && orders.length === 0 ? <div className="admin-orders-loading" role="status">Загрузка заказов…</div> : null}

    {!loading && filteredOrders.length === 0 ? <div className="admin-orders-empty">
      <strong>Заказов не найдено</strong>
      <span>Измените поиск или фильтры.</span>
    </div> : null}

    {filteredOrders.length > 0 && view === "kanban" ? <div className="admin-orders-kanban">
      {visibleStatuses.map((column) => {
        const columnOrders = filteredOrders.filter((order) => order.status === column.value);
        const headingId = `orders-column-${column.value}`;
        return <section className={`admin-orders-kanban-column status-${column.value}`} aria-labelledby={headingId} key={column.value}>
          <header>
            <h2 id={headingId}>{column.label}</h2>
            <span>{columnOrders.length < Number(statusCounts[column.value] || 0)
              ? `${columnOrders.length}/${Number(statusCounts[column.value] || 0)}`
              : Number(statusCounts[column.value] || 0)}</span>
          </header>
          <div className="admin-orders-kanban-cards">
            {columnOrders.map((order) => <button
              type="button"
              className={`admin-orders-kanban-card${selectedOrderId === order.id ? " selected" : ""}`}
              aria-label={`${formatOrderNumber(order)}, ${order.customerName}, ${formatMoney(order.total)}`}
              key={order.id}
              onClick={() => onOrderOpen(order)}
            >
              <span className="admin-orders-card-head">
                <strong>{formatOrderNumber(order)}</strong>
                <time dateTime={order.createdAt}>{formatTime(order.createdAt)}</time>
              </span>
              <span className="admin-orders-card-client">{order.customerName || "Клиент не указан"}</span>
              <span className="admin-orders-card-delivery">
                <Icon path={order.deliveryType === "pickup" ? mdiStoreOutline : mdiTruckDeliveryOutline} size={0.55} aria-hidden="true" />
                {order.deliveryType === "pickup" ? "Самовывоз" : "Доставка"}
              </span>
              <span className="admin-orders-card-foot">
                <span>{order.address || orderAddress(order)}</span>
                <b>{formatMoney(order.total)}</b>
              </span>
            </button>)}
            {columnOrders.length === 0 ? <span className="admin-orders-column-empty">Нет заказов</span> : null}
            {columnOrders.length > 0 && columnOrders.length < Number(statusCounts[column.value] || 0)
              ? <span className="admin-orders-column-note">Показаны последние {columnOrders.length}</span>
              : null}
          </div>
        </section>;
      })}
    </div> : null}

    {filteredOrders.length > 0 && view === "list" ? <div className="admin-orders-table-wrap">
      <table className="admin-orders-table">
        <thead><tr>
          <th scope="col">Заказ</th>
          <th scope="col">Клиент</th>
          <th scope="col">Адрес</th>
          <th scope="col">Статус</th>
          <th scope="col">Сумма</th>
          <th scope="col">Время</th>
        </tr></thead>
        <tbody>{filteredOrders.map((order) => <tr className={selectedOrderId === order.id ? "selected" : ""} key={order.id}>
          <td><button type="button" className="admin-orders-order-link" onClick={() => onOrderOpen(order)}>{formatOrderNumber(order)}</button></td>
          <td>{order.customerName || "—"}</td>
          <td>{orderAddress(order)}</td>
          <td><span className={`admin-order-status status-${order.status}`}>{statusLabels[order.status]}</span></td>
          <td>{formatMoney(order.total)}</td>
          <td><time dateTime={order.createdAt}>{formatDate(order.createdAt)}</time></td>
        </tr>)}</tbody>
      </table>
    </div> : null}

    {filteredOrders.length > 0 && view === "list" ? <footer className="admin-orders-pagination">
      <span>{firstVisibleOrder}–{lastVisibleOrder} из {total}</span>
      {pageCount > 1 ? <nav aria-label="Страницы заказов">
        <button type="button" aria-label="Предыдущая страница" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>‹</button>
        {visiblePages.map((value) => <button
          type="button"
          className={value === page ? "active" : ""}
          aria-current={value === page ? "page" : undefined}
          key={value}
          onClick={() => onPageChange(value)}
        >{value}</button>)}
        <button type="button" aria-label="Следующая страница" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>›</button>
      </nav> : null}
    </footer> : null}
  </section>;
}
