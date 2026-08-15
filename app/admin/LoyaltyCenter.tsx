"use client";
/* eslint-disable @next/next/no-img-element */

import { Icon } from "@mdi/react";
import {
  mdiAlertCircleOutline,
  mdiGiftOutline,
  mdiImageOutline,
  mdiOpenInNew,
} from "@mdi/js";
import { FormEvent, type ReactNode, useMemo, useState } from "react";

export type NftStatus = "owned" | "pending" | "submitted" | "withdrawn" | "failed";

export type NftWithdrawal = {
  id: string;
  phone: string;
  regionSlug: string;
  name: string;
  image: string;
  description: string;
  network: string;
  contractAddress: string;
  metadataUri: string;
  tokenId: string | null;
  status: NftStatus;
  walletAddress: string | null;
  txHash: string | null;
  withdrawalError: string | null;
  withdrawalRequestedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  milestoneOrderCount: number;
};

export type LoyaltyOverview = {
  program: {
    enabled: boolean;
    everyOrders: number;
    name: string;
    image: string;
    description: string;
    network: string;
    contractAddress: string;
    metadataUri: string;
  };
  metrics: {
    rewardedProducts: number;
    coinsPerFullMenu: number;
    issuedCoins: number;
    coinTransactions: number;
    nftsTotal: number;
    nftStatuses: Partial<Record<NftStatus, number>>;
  };
  transferProviderConfigured: boolean;
};

export type LoyaltyProgramDraft = {
  enabled: boolean;
  everyOrders: string;
  name: string;
  image: string;
  description: string;
  network: string;
  contractAddress: string;
  metadataUri: string;
};

export type NftUpdatePayload = {
  status: "submitted" | "withdrawn" | "failed";
  txHash?: string;
  tokenId?: string;
  error?: string;
};

type Props = {
  regionName: string;
  overview: LoyaltyOverview | null;
  draft: LoyaltyProgramDraft;
  withdrawals: NftWithdrawal[];
  filter: "all" | NftStatus;
  loading: boolean;
  saving: boolean;
  updatingId: string | null;
  onDraftChange: (patch: Partial<LoyaltyProgramDraft>) => void;
  onFilterChange: (filter: "all" | NftStatus) => void;
  onSave: () => Promise<void>;
  onWithdrawalUpdate: (id: string, payload: NftUpdatePayload) => Promise<boolean>;
  onOpenCatalog: () => void;
  onImageFile: (file: File) => Promise<void>;
};

const statusLabels: Record<NftStatus, string> = {
  owned: "У клиента",
  pending: "Ожидает отправки",
  submitted: "В блокчейне",
  withdrawn: "Выведен",
  failed: "Ошибка",
};

const networkLabels: Record<string, string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  solana: "Solana",
  ton: "TON",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};

function NftArtwork({ src, alt, fallback }: { src: string; alt: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <img src={src} alt={alt} onError={() => setFailed(true)} />
    : <>{fallback}</>;
}

export function LoyaltyCenter({
  regionName,
  overview,
  draft,
  withdrawals,
  filter,
  loading,
  saving,
  updatingId,
  onDraftChange,
  onFilterChange,
  onSave,
  onWithdrawalUpdate,
  onOpenCatalog,
  onImageFile,
}: Props) {
  const [section, setSection] = useState<"withdrawals" | "program" | "coins">("withdrawals");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => withdrawals.find((item) => item.id === selectedId) ?? null,
    [selectedId, withdrawals],
  );
  const [nextStatus, setNextStatus] = useState<NftUpdatePayload["status"]>("submitted");
  const [txHash, setTxHash] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [error, setError] = useState("");
  const programReady = overview !== null;

  const selectWithdrawal = (nft: NftWithdrawal) => {
    setSelectedId(nft.id);
    setNextStatus(nft.status === "submitted" ? "withdrawn" : "submitted");
    setTxHash(nft.txHash || "");
    setTokenId(nft.tokenId || "");
    setError(nft.withdrawalError || "");
  };

  const statuses = overview?.metrics.nftStatuses ?? {};
  const pendingCount = Number(statuses.pending || 0) + Number(statuses.submitted || 0);
  const submitWithdrawal = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const updated = await onWithdrawalUpdate(selected.id, {
      status: nextStatus,
      txHash: txHash.trim() || undefined,
      tokenId: tokenId.trim() || undefined,
      error: error.trim() || undefined,
    });
    if (updated) setSelectedId(null);
  };

  return <div className="admin-crm-page admin-loyalty-view">
    <header className="admin-page-command">
      <span><small>Филиал: {regionName}</small></span>
      <dl className="admin-operation-summary" aria-label="Сводка программы лояльности">
        <div><dt>NAKTA Coin</dt><dd>{Number(overview?.metrics.issuedCoins || 0).toLocaleString("ru-RU")}</dd></div>
        <div><dt>NFT</dt><dd>{Number(overview?.metrics.nftsTotal || 0).toLocaleString("ru-RU")}</dd></div>
        <div><dt>В обработке</dt><dd>{pendingCount}</dd></div>
        <div><dt>Ошибки</dt><dd className={Number(statuses.failed || 0) ? "danger" : ""}>{Number(statuses.failed || 0)}</dd></div>
      </dl>
    </header>

    <nav className="admin-context-tabs" aria-label="Разделы лояльности">
      <button type="button" className={section === "withdrawals" ? "active" : ""} aria-current={section === "withdrawals" ? "page" : undefined} onClick={() => setSection("withdrawals")}>NFT-выводы{pendingCount ? <em>{pendingCount}</em> : null}</button>
      <button type="button" className={section === "program" ? "active" : ""} aria-current={section === "program" ? "page" : undefined} onClick={() => setSection("program")}>NFT-программа</button>
      <button type="button" className={section === "coins" ? "active" : ""} aria-current={section === "coins" ? "page" : undefined} onClick={() => setSection("coins")}>NAKTA Coin</button>
    </nav>

    {section === "program" ? <section className="admin-surface admin-loyalty-program-card">
        <header className="admin-surface-header">
          <span><h2>NFT-программа</h2></span>
          <label className="admin-toggle-line"><span>{draft.enabled ? "Включена" : "Выключена"}</span><input type="checkbox" checked={draft.enabled} disabled={!programReady || saving} onChange={(event) => onDraftChange({ enabled: event.target.checked })} /></label>
        </header>
        <form className="admin-loyalty-program-form" onSubmit={(event) => { event.preventDefault(); void onSave(); }}>
          <div className="admin-loyalty-preview">
            <span className="admin-nft-artwork">
              <NftArtwork key={draft.image} src={draft.image} alt="Предпросмотр NFT" fallback={<Icon path={mdiImageOutline} size={2} aria-hidden="true" />} />
            </span>
            <label className="admin-upload admin-nft-upload">Загрузить изображение<input type="file" accept="image/*" disabled={!programReady || saving} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onImageFile(file).finally(() => { event.target.value = ""; }); }} /></label>
            <label>Ссылка на изображение<input disabled={!programReady || saving} value={draft.image.startsWith("data:") ? "" : draft.image} onChange={(event) => onDraftChange({ image: event.target.value })} placeholder="https://… или IPFS gateway" /></label>
          </div>
          <div className="admin-loyalty-fields">
            <div className="admin-form-grid-2">
              <label>Выдавать каждые N заказов<input required type="number" min="1" max="10000" disabled={!programReady || saving || !draft.enabled} value={draft.everyOrders} onChange={(event) => onDraftChange({ everyOrders: event.target.value })} /><small>Например: 10, 20 или 50</small></label>
              <label>Название NFT<input required disabled={!programReady || saving || !draft.enabled} maxLength={160} value={draft.name} onChange={(event) => onDraftChange({ name: event.target.value })} placeholder="NFT NAKTA" /></label>
            </div>
            <label>Описание<textarea disabled={!programReady || saving || !draft.enabled} maxLength={2000} value={draft.description} onChange={(event) => onDraftChange({ description: event.target.value })} placeholder="За что клиент получает NFT" /></label>
            <div className="admin-form-grid-2">
              <label>Сеть<select disabled={!programReady || saving || !draft.enabled} value={draft.network} onChange={(event) => onDraftChange({ network: event.target.value })}><option value="polygon">Polygon</option><option value="ethereum">Ethereum</option><option value="bsc">BNB Smart Chain</option><option value="solana">Solana</option><option value="ton">TON</option></select></label>
              <label>Адрес контракта<input disabled={!programReady || saving || !draft.enabled} value={draft.contractAddress} onChange={(event) => onDraftChange({ contractAddress: event.target.value })} placeholder="Можно заполнить позже" /></label>
            </div>
            <label>Metadata URI<input disabled={!programReady || saving || !draft.enabled} value={draft.metadataUri} onChange={(event) => onDraftChange({ metadataUri: event.target.value })} placeholder="ipfs://…" /></label>
            <div className="admin-program-actions"><span><b>{programReady ? draft.enabled ? `1 NFT за каждые ${draft.everyOrders || "N"} заказов` : "Начисление NFT остановлено" : "Загружаем настройки программы"}</b><small>Изменение применяется к следующим завершённым заказам.</small></span><button type="submit" className="admin-primary-button" disabled={saving || !programReady}>{saving ? "Сохраняем…" : "Сохранить программу"}</button></div>
          </div>
        </form>
      </section> : null}

      {section === "coins" ? <section className="admin-surface admin-coin-program-card">
        <header><span className="admin-coin-program-logo">N</span><span><h2>NAKTA Coin</h2></span></header>
        <dl><div><dt>Блюд с наградой</dt><dd>{overview?.metrics.rewardedProducts || 0}</dd></div><div><dt>Коинов в полном меню</dt><dd>{overview?.metrics.coinsPerFullMenu || 0}</dd></div><div><dt>История начислений</dt><dd>{overview?.metrics.coinTransactions || 0}</dd></div></dl>
        <button type="button" className="admin-secondary-button" onClick={onOpenCatalog}>Настроить награды в каталоге</button>
      </section> : null}

    {section === "withdrawals" ? <section className="admin-surface admin-nft-queue">
      <header className="admin-surface-header">
        <span><h2>NFT и выводы</h2></span>
        {loading ? <span className="admin-inline-loading" role="status">Обновляем…</span> : null}
      </header>
      <div className="admin-segmented-filter" role="group" aria-label="Статус NFT">
        {([
          ["all", "Все"],
          ["pending", "Ожидают"],
          ["submitted", "Отправлены"],
          ["withdrawn", "Завершены"],
          ["failed", "Ошибки"],
          ["owned", "У клиентов"],
        ] as const).map(([value, label]) => <button type="button" className={filter === value ? "active" : ""} aria-pressed={filter === value} key={value} onClick={() => onFilterChange(value)}>{label}{value !== "all" ? <em>{Number(statuses[value] || 0)}</em> : null}</button>)}
      </div>

      {withdrawals.length ? <div className="admin-table-scroll"><table className="admin-data-table admin-nft-table">
        <thead><tr><th>NFT</th><th>Клиент</th><th>Сеть</th><th>Кошелёк</th><th>Статус</th><th>Дата</th><th><span className="sr-only">Открыть</span></th></tr></thead>
        <tbody>{withdrawals.map((nft) => <tr key={nft.id} className={nft.status === "pending" || nft.status === "failed" ? "requires-action" : ""}>
          <td data-label="NFT"><span className="admin-nft-name"><NftArtwork key={nft.image} src={nft.image} alt="" fallback={<i>NFT</i>} /><span><b>{nft.name}</b><small>{nft.milestoneOrderCount}-й заказ</small></span></span></td>
          <td data-label="Клиент"><b>{nft.phone}</b></td>
          <td data-label="Сеть">{networkLabels[nft.network] || nft.network}</td>
          <td data-label="Кошелёк"><span className="admin-wallet-address" title={nft.walletAddress || "Кошелёк ещё не указан"}>{nft.walletAddress || "Не запрошен"}</span></td>
          <td data-label="Статус"><span className={`admin-status-chip nft-${nft.status}`}>{statusLabels[nft.status]}</span></td>
          <td data-label="Дата">{formatDate(nft.withdrawalRequestedAt || nft.createdAt)}</td>
          <td data-label="Действия"><button type="button" className="admin-row-link" onClick={() => selectWithdrawal(nft)} aria-label={`Открыть NFT ${nft.name}`}><Icon path={mdiOpenInNew} size={0.72} /></button></td>
        </tr>)}</tbody>
      </table></div> : !loading ? <div className="admin-empty-state"><span><Icon path={mdiGiftOutline} size={1.35} /></span><h3>В этом фильтре пока пусто</h3><p>Новые NFT появятся после достижения клиентами заданного количества заказов.</p></div> : null}
    </section> : null}

    {selected ? <div className="admin-editor-overlay admin-sidepanel-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-nft-dialog-title" tabIndex={-1} autoFocus onKeyDown={(event) => { if (event.key === "Escape" && updatingId !== selected.id) setSelectedId(null); }} onMouseDown={(event) => { if (event.target === event.currentTarget && updatingId !== selected.id) setSelectedId(null); }}>
      <section className="admin-nft-sidepanel">
        <header><span><small>NFT клиента</small><h2 id="admin-nft-dialog-title">{selected.name}</h2><p>{selected.phone} · {networkLabels[selected.network] || selected.network}</p></span><button type="button" disabled={updatingId === selected.id} onClick={() => setSelectedId(null)} aria-label="Закрыть">×</button></header>
        <div className="admin-nft-sidepanel-summary">
          <NftArtwork key={selected.image} src={selected.image} alt="" fallback={<span>NFT</span>} />
          <dl><div><dt>Статус</dt><dd><span className={`admin-status-chip nft-${selected.status}`}>{statusLabels[selected.status]}</span></dd></div><div><dt>Награда</dt><dd>{selected.milestoneOrderCount}-й заказ</dd></div><div><dt>Получен</dt><dd>{formatDate(selected.createdAt)}</dd></div></dl>
        </div>
        <div className="admin-nft-technical"><label>Кошелёк<span>{selected.walletAddress || "Клиент ещё не запросил вывод"}</span></label><label>Tx hash<span>{selected.txHash || "—"}</span></label><label>Token ID<span>{selected.tokenId || "—"}</span></label>{selected.withdrawalError ? <p role="alert"><Icon path={mdiAlertCircleOutline} size={0.72} />{selected.withdrawalError}</p> : null}</div>
        {selected.status !== "owned" && selected.status !== "withdrawn" ? <form className="admin-nft-resolution" onSubmit={(event) => void submitWithdrawal(event)}>
          <h3>Обновить обработку</h3>
          <label>Новый статус<select disabled={updatingId === selected.id} value={nextStatus} onChange={(event) => setNextStatus(event.target.value as NftUpdatePayload["status"])}><option value="submitted">Отправлен в блокчейн</option><option value="withdrawn">Вывод завершён</option><option value="failed">Ошибка обработки</option></select></label>
          {nextStatus !== "failed" ? <><label>Tx hash<input required disabled={updatingId === selected.id} value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="0x…" /></label><label>Token ID<input disabled={updatingId === selected.id} value={tokenId} onChange={(event) => setTokenId(event.target.value)} placeholder="Необязательно" /></label></> : <label>Причина ошибки<textarea required disabled={updatingId === selected.id} value={error} onChange={(event) => setError(event.target.value)} placeholder="Что нужно проверить оператору или клиенту" /></label>}
          <button type="submit" className="admin-primary-button" disabled={updatingId === selected.id}>{updatingId === selected.id ? "Сохраняем…" : "Обновить статус"}</button>
        </form> : null}
      </section>
    </div> : null}
  </div>;
}
