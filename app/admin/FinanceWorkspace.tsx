"use client";

import { mdiRefresh } from "@mdi/js";
import { Icon } from "@mdi/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type {
  AdminRequest,
  CoinWithdrawal,
  CoinWithdrawalStatus,
  NftWithdrawal,
  NftWithdrawalStatus,
} from "./admin-types";

type FinanceAsset = "coin" | "nft";
type StatusFilter = "all" | CoinWithdrawalStatus | NftWithdrawalStatus;

type FinanceWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type CoinAction = {
  asset: "coin";
  item: CoinWithdrawal;
  mode: "approve" | "reject";
  txHash: string;
  reason: string;
};

type NftAction = {
  asset: "nft";
  item: NftWithdrawal;
  mode: "approve" | "reject";
  txHash: string;
  tokenId: string;
  reason: string;
};

type FinanceAction = CoinAction | NftAction;

const coinStatuses: Array<{ value: "all" | CoinWithdrawalStatus; label: string }> = [
  { value: "all", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "submitted", label: "Отправлены" },
  { value: "withdrawn", label: "Завершены" },
  { value: "failed", label: "Отклонены" },
];

const nftStatuses: Array<{ value: "all" | NftWithdrawalStatus; label: string }> = [
  { value: "all", label: "Все NFT" },
  { value: "pending", label: "Ожидают" },
  { value: "submitted", label: "Отправлены" },
  { value: "withdrawn", label: "Выведены" },
  { value: "failed", label: "Отклонены" },
  { value: "owned", label: "У пользователей" },
];

const statusLabels: Record<NftWithdrawalStatus, string> = {
  owned: "У пользователя",
  pending: "Ожидает решения",
  submitted: "Отправлено",
  withdrawn: "Выведено",
  failed: "Отклонено",
};

const statusStyles: Record<NftWithdrawalStatus, string> = {
  owned: "bg-slate-100 text-slate-700",
  pending: "bg-amber-50 text-amber-800",
  submitted: "bg-blue-50 text-blue-700",
  withdrawn: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const primaryButton = "inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";
const dangerButton = "inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60";
const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100";

function formatCoinAmount(amount: number) {
  return `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 4 })} NAKTA Coin`;
}

function formatDate(value: string | null) {
  if (!value) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shorten(value: string) {
  if (value.length <= 28) return value;
  return `${value.slice(0, 14)}…${value.slice(-10)}`;
}

export function FinanceWorkspace({ region, request, onNotice }: FinanceWorkspaceProps) {
  const [asset, setAsset] = useState<FinanceAsset>("coin");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [coinItems, setCoinItems] = useState<CoinWithdrawal[]>([]);
  const [nftItems, setNftItems] = useState<NftWithdrawal[]>([]);
  const [action, setAction] = useState<FinanceAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ region });
    if (filter !== "all") query.set("status", filter);

    try {
      if (asset === "coin") {
        setCoinItems(await request<CoinWithdrawal[]>(`/admin/coin-withdrawals?${query}`));
      } else {
        setNftItems(await request<NftWithdrawal[]>(`/admin/nft-withdrawals?${query}`));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки на вывод");
    } finally {
      setLoading(false);
    }
  }, [asset, filter, region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectAsset = (nextAsset: FinanceAsset) => {
    setAsset(nextAsset);
    setFilter("pending");
    setAction(null);
  };

  const beginCoinAction = (item: CoinWithdrawal, mode: "approve" | "reject") => {
    setAction({ asset: "coin", item, mode, txHash: "", reason: "" });
  };

  const beginNftAction = (item: NftWithdrawal, mode: "approve" | "reject") => {
    setAction({ asset: "nft", item, mode, txHash: "", tokenId: item.tokenId || "", reason: "" });
  };

  const submitAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || saving) return;
    setSaving(true);

    try {
      const path = action.asset === "coin"
        ? `/admin/coin-withdrawals/${action.item.id}`
        : `/admin/nft-withdrawals/${action.item.id}`;
      const body = action.mode === "reject"
        ? { status: "failed", error: action.reason.trim() }
        : action.asset === "coin"
          ? { status: "submitted", txHash: action.txHash.trim() }
          : { status: "submitted", txHash: action.txHash.trim(), tokenId: action.tokenId.trim() };

      await request(path, { method: "PATCH", body: JSON.stringify(body) });
      onNotice(action.mode === "approve" ? "Вывод отмечен как отправленный" : "Заявка на вывод отклонена", "success");
      setAction(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось обработать заявку", "error");
    } finally {
      setSaving(false);
    }
  };

  const completeCoin = async (item: CoinWithdrawal) => {
    try {
      await request(`/admin/coin-withdrawals/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "withdrawn", txHash: item.txHash }),
      });
      onNotice("Вывод NAKTA Coin завершён", "success");
      await load();
    } catch (completeError) {
      onNotice(completeError instanceof Error ? completeError.message : "Не удалось завершить вывод", "error");
    }
  };

  const completeNft = async (item: NftWithdrawal) => {
    try {
      await request(`/admin/nft-withdrawals/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "withdrawn", txHash: item.txHash, tokenId: item.tokenId }),
      });
      onNotice("Вывод NFT завершён", "success");
      await load();
    } catch (completeError) {
      onNotice(completeError instanceof Error ? completeError.message : "Не удалось завершить вывод NFT", "error");
    }
  };

  const statusOptions = asset === "coin" ? coinStatuses : nftStatuses;
  const currentItems = asset === "coin" ? coinItems : nftItems;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-2" aria-label="Тип вывода">
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          <button
            type="button"
            aria-pressed={asset === "coin"}
            className={`min-h-12 rounded-lg px-4 text-sm font-semibold transition ${asset === "coin" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => selectAsset("coin")}
          >
            NAKTA Coin
          </button>
          <button
            type="button"
            aria-pressed={asset === "nft"}
            className={`min-h-12 rounded-lg px-4 text-sm font-semibold transition ${asset === "nft" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => selectAsset("nft")}
          >
            NFT
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              {asset === "coin" ? "Заявки на вывод NAKTA Coin" : "Заявки на вывод NFT"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {asset === "coin" ? "Проверьте сумму и адрес кошелька перед отправкой." : "Проверьте NFT, сеть и адрес кошелька перед отправкой."}
            </p>
          </div>
          <button type="button" className={secondaryButton} onClick={() => void load()} disabled={loading}>
            <Icon path={mdiRefresh} size={0.72} aria-hidden="true" />
            {loading ? "Обновляем…" : "Обновить заявки"}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 p-3 sm:px-5">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium transition ${filter === option.value ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-5" role="alert">
            <p>{error}</p>
            <button type="button" className="mt-3 font-semibold underline" onClick={() => void load()}>Повторить загрузку</button>
          </div>
        ) : null}

        {!error && loading && currentItems.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500" role="status">Загружаем заявки…</div>
        ) : null}

        {!error && !loading && currentItems.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-semibold text-slate-950">Заявок нет</h3>
            <p className="mt-1 text-sm text-slate-500">Для выбранного статуса новых заявок на вывод нет.</p>
          </div>
        ) : null}

        {!error && asset === "coin" && coinItems.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {coinItems.map((item) => (
              <article key={item.id} className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(210px,0.8fr)_minmax(280px,1fr)_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg text-slate-950">{formatCoinAmount(item.amount)}</strong>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span>
                  </div>
                  <a href={`tel:${item.phone}`} className="mt-2 block text-sm font-medium text-blue-700">Позвонить: {item.phone}</a>
                  <span className="mt-1 block text-xs text-slate-500">Заявка от {formatDate(item.createdAt)}</span>
                </div>
                <dl className="grid min-w-0 gap-3 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs text-slate-500">Кошелёк получателя</dt>
                    <dd className="mt-1 font-mono text-slate-800" title={item.walletAddress}>{shorten(item.walletAddress)}</dd>
                  </div>
                  {item.txHash ? <div className="min-w-0"><dt className="text-xs text-slate-500">Хеш транзакции</dt><dd className="mt-1 font-mono text-xs text-slate-600" title={item.txHash}>{shorten(item.txHash)}</dd></div> : null}
                  {item.error ? <div><dt className="text-xs text-slate-500">Причина отказа</dt><dd className="mt-1 text-red-700">{item.error}</dd></div> : null}
                </dl>
                <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                  {item.status === "pending" ? <>
                    <button type="button" className={primaryButton} onClick={() => beginCoinAction(item, "approve")}>Одобрить вывод NAKTA Coin</button>
                    <button type="button" className={dangerButton} onClick={() => beginCoinAction(item, "reject")}>Отклонить вывод</button>
                  </> : null}
                  {item.status === "submitted" ? <button type="button" className={primaryButton} onClick={() => void completeCoin(item)}>Подтвердить получение</button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!error && asset === "nft" && nftItems.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {nftItems.map((item) => (
              <article key={item.id} className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(300px,1fr)_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg text-slate-950">{item.name}</strong>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">NFT за {item.milestoneOrderCount}-й заказ</p>
                  <a href={`tel:${item.phone}`} className="mt-1 block text-sm font-medium text-blue-700">Позвонить: {item.phone}</a>
                  <span className="mt-1 block text-xs text-slate-500">Запрос от {formatDate(item.withdrawalRequestedAt || item.createdAt)}</span>
                </div>
                <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-xs text-slate-500">Сеть</dt><dd className="mt-1 font-medium text-slate-800">{item.network || "Не указана"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Token ID</dt><dd className="mt-1 font-mono text-slate-800">{item.tokenId || "Будет назначен"}</dd></div>
                  <div className="col-span-2 min-w-0"><dt className="text-xs text-slate-500">Кошелёк получателя</dt><dd className="mt-1 font-mono text-slate-800" title={item.walletAddress || ""}>{item.walletAddress ? shorten(item.walletAddress) : "Кошелёк не указан"}</dd></div>
                  {item.txHash ? <div className="col-span-2 min-w-0"><dt className="text-xs text-slate-500">Хеш транзакции</dt><dd className="mt-1 font-mono text-xs text-slate-600" title={item.txHash}>{shorten(item.txHash)}</dd></div> : null}
                  {item.withdrawalError ? <div className="col-span-2"><dt className="text-xs text-slate-500">Причина отказа</dt><dd className="mt-1 text-red-700">{item.withdrawalError}</dd></div> : null}
                </dl>
                <div className="grid gap-2 sm:grid-cols-2 lg:flex">
                  {item.status === "pending" ? <>
                    <button type="button" className={primaryButton} onClick={() => beginNftAction(item, "approve")}>Одобрить вывод NFT</button>
                    <button type="button" className={dangerButton} onClick={() => beginNftAction(item, "reject")}>Отклонить вывод</button>
                  </> : null}
                  {item.status === "submitted" ? <button type="button" className={primaryButton} onClick={() => void completeNft(item)}>Подтвердить получение NFT</button> : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {action ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setAction(null);
        }}>
          <section className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="finance-dialog-title">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h2 id="finance-dialog-title" className="text-lg font-semibold text-slate-950">
                  {action.mode === "approve" ? `Одобрить вывод ${action.asset === "coin" ? "NAKTA Coin" : "NFT"}` : "Отклонить вывод"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Проверьте данные перед подтверждением.</p>
              </div>
              <button type="button" className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100" onClick={() => setAction(null)} disabled={saving}>Закрыть</button>
            </div>
            <form className="grid gap-4 p-5" onSubmit={submitAction}>
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                <strong className="block text-slate-950">{action.asset === "coin" ? formatCoinAmount(action.item.amount) : action.item.name}</strong>
                <span className="mt-1 block">Пользователь: {action.item.phone}</span>
                <span className="mt-2 block break-all font-mono text-xs">Кошелёк: {action.item.walletAddress || "не указан"}</span>
              </div>

              {action.mode === "approve" ? <>
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Хеш транзакции
                  <input required className={inputClass} value={action.txHash} onChange={(event) => setAction({ ...action, txHash: event.target.value })} placeholder="Введите хеш после отправки" />
                </label>
                {action.asset === "nft" ? (
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                    Token ID NFT <span className="font-normal text-slate-500">(если уже известен)</span>
                    <input className={inputClass} value={action.tokenId} onChange={(event) => setAction({ ...action, tokenId: event.target.value })} placeholder="Например, 184" />
                  </label>
                ) : null}
              </> : (
                <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                  Причина отказа
                  <textarea required className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={action.reason} onChange={(event) => setAction({ ...action, reason: event.target.value })} placeholder="Кратко укажите причину для истории заявки" />
                </label>
              )}

              <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <button type="button" className={secondaryButton} onClick={() => setAction(null)} disabled={saving}>Отменить</button>
                <button type="submit" className={action.mode === "approve" ? primaryButton : "min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"} disabled={saving}>
                  {saving ? "Сохраняем…" : action.mode === "approve" ? "Подтвердить отправку" : "Отклонить заявку"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
