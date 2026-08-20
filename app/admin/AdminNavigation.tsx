"use client";

import { Icon } from "@mdi/react";
import {
  mdiAccountGroupOutline,
  mdiChartBoxOutline,
  mdiCogOutline,
  mdiFoodOutline,
  mdiLogoutVariant,
  mdiReceiptTextOutline,
  mdiSaleOutline,
  mdiShapeOutline,
  mdiWalletOutline,
} from "@mdi/js";
import type { AdminSection } from "./admin-types";

export const adminSections: Array<{
  id: AdminSection;
  label: string;
  description: string;
  icon: string;
}> = [
  { id: "orders", label: "Заказы", description: "Приём и управление заказами", icon: mdiReceiptTextOutline },
  { id: "analytics", label: "Аналитика", description: "Основные показатели", icon: mdiChartBoxOutline },
  { id: "menu", label: "Меню", description: "Блюда и доступность", icon: mdiFoodOutline },
  { id: "categories", label: "Категории", description: "Категории по городам", icon: mdiShapeOutline },
  { id: "users", label: "Пользователи", description: "Клиентская база", icon: mdiAccountGroupOutline },
  { id: "finance", label: "Финансы", description: "Выводы средств", icon: mdiWalletOutline },
  { id: "promotions", label: "Акции", description: "Скидки и предложения", icon: mdiSaleOutline },
  { id: "settings", label: "Настройки", description: "Основные параметры", icon: mdiCogOutline },
];

type AdminNavigationProps = {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
  onLogout: () => void;
};

export function AdminNavigation({ active, onSelect, onLogout }: AdminNavigationProps) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <span className="min-w-0">
          <strong className="block text-sm font-semibold tracking-wide">NAKTA</strong>
          <small className="block text-xs text-slate-400">Панель управления</small>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Разделы админ-панели">
        {adminSections.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={selected ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                selected ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
              onClick={() => onSelect(item.id)}
            >
              <Icon path={item.icon} size={0.88} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0">
                <strong className="block truncate text-sm font-medium">{item.label}</strong>
                <small className={`block truncate text-[11px] ${selected ? "text-slate-500" : "text-slate-500"}`}>
                  {item.description}
                </small>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          onClick={onLogout}
        >
          <Icon path={mdiLogoutVariant} size={0.82} aria-hidden="true" />
          <span>Выйти из системы</span>
        </button>
      </div>
    </div>
  );
}
