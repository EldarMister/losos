"use client";

import { Icon } from "@mdi/react";
import {
  mdiAlertCircleOutline,
  mdiSync,
} from "@mdi/js";

export type EduPosStatus = {
  configured: boolean;
  lastMenuSyncAt: string | null;
  lastStopListSyncAt: string | null;
  lastError: string | null;
  intervals: { menuSeconds: number; stopListSeconds: number; ordersSeconds: number };
};

type Props = {
  status: EduPosStatus | null;
  loading: boolean;
  action: "import" | "export" | null;
  nftTransferConfigured: boolean;
  onRefresh: () => Promise<void>;
  onImport: () => Promise<void>;
  onExport: () => Promise<void>;
};

const timestamp = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value))
  : "Ещё не выполнялась";

export function IntegrationsView({
  status,
  loading,
  action,
  nftTransferConfigured,
  onRefresh,
  onImport,
  onExport,
}: Props) {
  return <div className="admin-crm-page admin-integrations-view">
    <header className="admin-page-command">
      <span><small>Состояние обмена данными</small></span>
      <button type="button" className="admin-secondary-button" onClick={() => void onRefresh()} disabled={loading}><Icon path={mdiSync} size={0.75} />{loading ? "Проверяем…" : "Обновить"}</button>
    </header>

    <section className="admin-surface admin-integrations-register">
      <div className="admin-table-scroll"><table className="admin-data-table admin-integrations-table">
        <thead><tr><th>Интеграция</th><th>Состояние</th><th>Последняя синхронизация</th><th>Режим</th><th>Действия</th></tr></thead>
        <tbody>
          <tr>
            <td data-label="Интеграция"><b>EDU POS</b><small>Меню, стоп-лист, кухня</small></td>
            <td data-label="Состояние"><span className={`admin-status-chip ${status?.configured ? "success" : "neutral"}`}>{status?.configured ? "Подключено" : "Не настроено"}</span></td>
            <td data-label="Синхронизация"><b>{timestamp(status?.lastMenuSyncAt)}</b><small>Стоп-лист: {timestamp(status?.lastStopListSyncAt)}</small></td>
            <td data-label="Режим">{status?.configured ? `Заказы: ${status.intervals.ordersSeconds} сек.` : "—"}</td>
            <td data-label="Действия"><span className="admin-integration-actions"><button type="button" className="admin-secondary-button" disabled={!status?.configured || action !== null} onClick={() => void onImport()}>{action === "import" ? "Получаем…" : "Получить меню"}</button><button type="button" className="admin-primary-button" disabled={!status?.configured || action !== null} onClick={() => void onExport()}>{action === "export" ? "Отправляем…" : "Отправить меню"}</button></span></td>
          </tr>
          {status?.lastError ? <tr className="admin-integration-error-row"><td colSpan={5} role="alert"><Icon path={mdiAlertCircleOutline} size={0.7} />{status.lastError}</td></tr> : null}
          <tr>
            <td data-label="Интеграция"><b>NFT Transfer</b><small>Вывод на криптокошелёк</small></td>
            <td data-label="Состояние"><span className={`admin-status-chip ${nftTransferConfigured ? "success" : "warning"}`}>{nftTransferConfigured ? "Автоматически" : "Вручную"}</span></td>
            <td data-label="Синхронизация">—</td>
            <td data-label="Режим">{nftTransferConfigured ? "Webhook-провайдер" : "Очередь оператора"}</td>
            <td data-label="Действия">Раздел «Лояльность»</td>
          </tr>
        </tbody>
      </table></div>
    </section>
  </div>;
}
