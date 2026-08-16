"use client";

import Image from "next/image";
import { Icon } from "@mdi/react";
import {
  mdiAccountGroupOutline,
  mdiChartBoxOutline,
  mdiFoodOutline,
  mdiGiftOutline,
  mdiLogoutVariant,
  mdiPuzzleOutline,
  mdiReceiptTextOutline,
  mdiSaleOutline,
  mdiStorefrontOutline,
} from "@mdi/js";

export type AdminTab =
  | "statistics"
  | "orders"
  | "products"
  | "categories"
  | "promotions"
  | "customers"
  | "loyalty"
  | "settings"
  | "integrations";

type NavigationItem = {
  id: Exclude<AdminTab, "categories">;
  label: string;
  icon: string;
  badge?: "newOrders" | "pendingNfts";
};

type Props = {
  active: AdminTab;
  mobile?: boolean;
  newOrders: number;
  pendingNfts: number;
  regionName: string;
  onSelect: (tab: AdminTab) => void;
  onLogout: () => void;
};

const navigationItems: NavigationItem[] = [
  { id: "orders", label: "Заказы", icon: mdiReceiptTextOutline, badge: "newOrders" },
  { id: "products", label: "Каталог", icon: mdiFoodOutline },
  { id: "customers", label: "Клиенты", icon: mdiAccountGroupOutline },
  { id: "loyalty", label: "Лояльность", icon: mdiGiftOutline, badge: "pendingNfts" },
  { id: "statistics", label: "Аналитика", icon: mdiChartBoxOutline },
  { id: "promotions", label: "Акции", icon: mdiSaleOutline },
  { id: "settings", label: "Филиалы", icon: mdiStorefrontOutline },
  { id: "integrations", label: "Интеграции", icon: mdiPuzzleOutline },
];

export function AdminNavigation({
  active,
  mobile = false,
  newOrders,
  pendingNfts,
  regionName,
  onSelect,
  onLogout,
}: Props) {
  const badges = { newOrders, pendingNfts };
  const isActive = (item: AdminTab) => active === item
    || (item === "products" && active === "categories");

  return <aside
    className={`admin-sidebar admin-crm-sidebar admin-sidebar-rail${mobile ? " admin-sidebar-mobile" : ""}`}
    aria-label="Основная навигация"
  >
    <div className="admin-crm-brand admin-rail-brand">
      <span className="admin-crm-brand-mark" aria-hidden="true">
        <Image src="/favicon.svg" alt="" width={40} height={40} priority />
      </span>
      <span className="admin-brand-text"><b>NAKTA</b><small>KITCHEN</small></span>
    </div>

    <nav className="admin-crm-nav admin-rail-nav" aria-label="Разделы системы">
      {navigationItems.map((item) => {
        const badge = item.badge ? badges[item.badge] : 0;
        const selected = isActive(item.id);

        return <button
          type="button"
          className={`admin-nav-item${selected ? " active" : ""}`}
          aria-label={item.label}
          aria-current={selected ? "page" : undefined}
          data-tooltip={mobile ? undefined : item.label}
          title={mobile ? undefined : item.label}
          key={item.id}
          onClick={() => onSelect(item.id)}
        >
          <span className="admin-nav-icon" aria-hidden="true">
            <Icon path={item.icon} size={0.94} />
          </span>
          <span className="admin-nav-text">{item.label}</span>
          {badge > 0 ? <em className="admin-nav-badge" aria-label={`${badge} требуют внимания`}>{badge}</em> : null}
        </button>;
      })}
    </nav>

    <footer className="admin-rail-footer">
      <div className="admin-sidebar-branch"><small>Рабочий филиал</small><b>{regionName}</b></div>
      <button
        type="button"
        className="admin-logout admin-rail-logout"
        aria-label="Выйти из панели администратора"
        onClick={onLogout}
      >
        <span className="admin-admin-avatar" aria-hidden="true">A</span>
        <span className="admin-nav-text"><b>Администратор</b><small>Выйти из системы</small></span>
        <Icon path={mdiLogoutVariant} size={0.72} aria-hidden="true" />
      </button>
    </footer>
  </aside>;
}
