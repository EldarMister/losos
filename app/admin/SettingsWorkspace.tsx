"use client";

import { Icon } from "@mdi/react";
import {
  mdiCheckNetworkOutline,
  mdiClose,
  mdiDeleteOutline,
  mdiDownloadOutline,
  mdiPlus,
  mdiRefresh,
  mdiSwapHorizontal,
} from "@mdi/js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { DeliveryZoneEditor } from "./DeliveryZoneEditor";
import { ImageUpload } from "./ImageUpload";
import type {
  AdminRequest,
  DeliveryZonePoint,
  PickupLocation,
  Region,
} from "./admin-types";

type SettingsWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type SettingsTab = "basic" | "delivery" | "pickup" | "rewards" | "edu-pos";

type SettingsDraft = {
  enabled: boolean;
  contactPhone: string;
  supportPhone: string;
  deliveryOpenTime: string;
  deliveryCloseTime: string;
  deliveryIs24Hours: boolean;
  deliveryWorkingDays: number[];
  freeDeliveryThreshold: string;
  deliveryFee: string;
  minimumOrderAmount: string;
  maximumOrderAmount: string;
  estimatedDeliveryMinutes: string;
  deliveryZone: DeliveryZonePoint[];
  nftRewardEveryOrders: string;
  nftRewardName: string;
  nftRewardImage: string;
  nftRewardDescription: string;
  nftRewardNetwork: string;
  nftContractAddress: string;
  nftMetadataUri: string;
};

type PickupEditor = {
  item?: PickupLocation;
  title: string;
  address: string;
  workingHours: string;
  latitude: string;
  longitude: string;
  yandexUrl: string;
  enabled: boolean;
  sortOrder: string;
};

type EduPosStatus = {
  configured: boolean;
  lastMenuSyncAt: string | null;
  lastStopListSyncAt: string | null;
  lastError: string | null;
  intervals: { menuSeconds: number; stopListSeconds: number; ordersSeconds: number };
};

type EduPosCheck = {
  connected: boolean;
  dishes: number;
  checkedAt: string;
};

type EduPosMenuSync = {
  configured: boolean;
  matched?: number;
  received?: number;
  unavailable?: number;
};

type EduPosExport = {
  categories: number;
  products: number;
};

const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60";

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "basic", label: "Основное" },
  { id: "delivery", label: "Доставка" },
  { id: "pickup", label: "Самовывоз" },
  { id: "rewards", label: "Вознаграждения" },
  { id: "edu-pos", label: "EDU POS" },
];

const weekdays = [
  { value: 1, label: "Пн" }, { value: 2, label: "Вт" }, { value: 3, label: "Ср" },
  { value: 4, label: "Чт" }, { value: 5, label: "Пт" }, { value: 6, label: "Сб" },
  { value: 0, label: "Вс" },
];

function draftFromRegion(item: Region): SettingsDraft {
  return {
    enabled: item.enabled,
    contactPhone: item.contactPhone || "",
    supportPhone: item.supportPhone || "",
    deliveryOpenTime: item.deliveryOpenTime || "11:30",
    deliveryCloseTime: item.deliveryCloseTime || "22:30",
    deliveryIs24Hours: Boolean(item.deliveryIs24Hours),
    deliveryWorkingDays: item.deliveryWorkingDays || [0, 1, 2, 3, 4, 5, 6],
    freeDeliveryThreshold: String(item.freeDeliveryThreshold ?? 0),
    deliveryFee: String(item.deliveryFee ?? 0),
    minimumOrderAmount: String(item.minimumOrderAmount ?? 0),
    maximumOrderAmount: String(item.maximumOrderAmount ?? 0),
    estimatedDeliveryMinutes: String(item.estimatedDeliveryMinutes ?? 50),
    deliveryZone: item.deliveryZone || [],
    nftRewardEveryOrders: String(item.nftRewardEveryOrders ?? 0),
    nftRewardName: item.nftRewardName || "NFT NAKTA",
    nftRewardImage: item.nftRewardImage || "",
    nftRewardDescription: item.nftRewardDescription || "",
    nftRewardNetwork: item.nftRewardNetwork || "polygon",
    nftContractAddress: item.nftContractAddress || "",
    nftMetadataUri: item.nftMetadataUri || "",
  };
}

function emptyPickup(sortOrder: number): PickupEditor {
  return {
    title: "",
    address: "",
    workingHours: "",
    latitude: "",
    longitude: "",
    yandexUrl: "",
    enabled: true,
    sortOrder: String(sortOrder),
  };
}

function pickupDraft(item: PickupLocation): PickupEditor {
  return {
    item,
    title: item.title || "",
    address: item.address,
    workingHours: item.workingHours || "",
    latitude: item.latitude == null ? "" : String(item.latitude),
    longitude: item.longitude == null ? "" : String(item.longitude),
    yandexUrl: item.yandexUrl || "",
    enabled: item.enabled,
    sortOrder: String(item.sortOrder),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Ещё не выполнялась";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

export function SettingsWorkspace({ region, request, onNotice }: SettingsWorkspaceProps) {
  const [tab, setTab] = useState<SettingsTab>("basic");
  const [item, setItem] = useState<Region | null>(null);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [pickupEditor, setPickupEditor] = useState<PickupEditor | null>(null);
  const [eduPosStatus, setEduPosStatus] = useState<EduPosStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posAction, setPosAction] = useState<"check" | "sync" | "export" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [regions, status] = await Promise.all([
        request<Region[]>("/admin/settings"),
        request<EduPosStatus>("/admin/edu-pos/status").catch(() => null),
      ]);
      const selected = regions.find((candidate) => candidate.slug === region) ?? regions[0] ?? null;
      setItem(selected);
      setDraft(selected ? draftFromRegion(selected) : null);
      setEduPosStatus(status);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, [region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveRegion = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !draft || saving) return;
    if (tab === "delivery" && draft.deliveryZone.length > 0 && draft.deliveryZone.length < 3) {
      onNotice("Для зоны доставки нужно минимум три точки", "error");
      return;
    }
    setSaving(true);
    try {
      await request(`/admin/regions/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: draft.enabled,
          contactPhone: draft.contactPhone.trim(),
          supportPhone: draft.supportPhone.trim(),
          deliveryOpenTime: draft.deliveryOpenTime,
          deliveryCloseTime: draft.deliveryCloseTime,
          deliveryIs24Hours: draft.deliveryIs24Hours,
          deliveryWorkingDays: draft.deliveryWorkingDays,
          freeDeliveryThreshold: Number(draft.freeDeliveryThreshold),
          deliveryFee: Number(draft.deliveryFee),
          minimumOrderAmount: Number(draft.minimumOrderAmount),
          maximumOrderAmount: Number(draft.maximumOrderAmount),
          estimatedDeliveryMinutes: Number(draft.estimatedDeliveryMinutes),
          ...(draft.deliveryZone.length >= 3 ? { deliveryZone: draft.deliveryZone } : {}),
          nftRewardEveryOrders: Number(draft.nftRewardEveryOrders),
          nftRewardName: draft.nftRewardName.trim(),
          nftRewardImage: draft.nftRewardImage,
          nftRewardDescription: draft.nftRewardDescription.trim(),
          nftRewardNetwork: draft.nftRewardNetwork,
          nftContractAddress: draft.nftContractAddress.trim(),
          nftMetadataUri: draft.nftMetadataUri.trim(),
        }),
      });
      onNotice("Настройки сохранены", "success");
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить настройки", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePickup = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !pickupEditor || saving) return;
    setSaving(true);
    try {
      const coordinates = pickupEditor.latitude === "" || pickupEditor.longitude === ""
        ? {}
        : {
            latitude: Number(pickupEditor.latitude),
            longitude: Number(pickupEditor.longitude),
          };
      const payload = {
        title: pickupEditor.title.trim(),
        address: pickupEditor.address.trim(),
        workingHours: pickupEditor.workingHours.trim(),
        ...coordinates,
        yandexUrl: pickupEditor.yandexUrl.trim(),
        enabled: pickupEditor.enabled,
        sortOrder: Number(pickupEditor.sortOrder),
      };
      if (pickupEditor.item) {
        await request(`/admin/pickup-locations/${pickupEditor.item.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await request("/admin/pickup-locations", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionId: item.id }),
        });
      }
      onNotice(pickupEditor.item ? "Точка самовывоза обновлена" : "Точка самовывоза добавлена", "success");
      setPickupEditor(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить точку", "error");
    } finally {
      setSaving(false);
    }
  };

  const resolvePickupCoordinates = async () => {
    if (!pickupEditor?.yandexUrl) {
      onNotice("Сначала вставьте ссылку на Яндекс Карты", "error");
      return;
    }
    try {
      const result = await request<{ latitude: number; longitude: number; resolvedUrl: string }>(
        "/admin/pickup-locations/resolve-map-link",
        { method: "POST", body: JSON.stringify({ yandexUrl: pickupEditor.yandexUrl }) },
      );
      setPickupEditor({
        ...pickupEditor,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
        yandexUrl: result.resolvedUrl,
      });
      onNotice("Координаты определены", "success");
    } catch (resolveError) {
      onNotice(resolveError instanceof Error ? resolveError.message : "Не удалось определить координаты", "error");
    }
  };

  const deletePickup = async (location: PickupLocation) => {
    if (!window.confirm(`Удалить точку «${location.title || location.address}»?`)) return;
    try {
      await request(`/admin/pickup-locations/${location.id}`, { method: "DELETE" });
      onNotice("Точка самовывоза удалена", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить точку", "error");
    }
  };

  const checkEduPos = async () => {
    setPosAction("check");
    try {
      const result = await request<EduPosCheck>("/admin/edu-pos/check", { method: "POST" });
      onNotice(`EDU POS отвечает. Получено блюд: ${result.dishes}`, "success");
      await load();
    } catch (checkError) {
      onNotice(checkError instanceof Error ? checkError.message : "EDU POS не отвечает", "error");
    } finally {
      setPosAction(null);
    }
  };

  const syncEduPosMenu = async () => {
    setPosAction("sync");
    try {
      const [menu, stopList] = await Promise.all([
        request<EduPosMenuSync>("/admin/edu-pos/sync-menu", { method: "POST" }),
        request<EduPosMenuSync>("/admin/edu-pos/sync-stop-list", { method: "POST" }),
      ]);
      onNotice(`Сверка завершена: сопоставлено ${menu.matched ?? 0} из ${menu.received ?? 0}, недоступно ${stopList.unavailable ?? 0}`, "success");
      await load();
    } catch (syncError) {
      onNotice(syncError instanceof Error ? syncError.message : "Не удалось сверить меню", "error");
    } finally {
      setPosAction(null);
    }
  };

  const exportEduPosMenu = async () => {
    setPosAction("export");
    try {
      const result = await request<EduPosExport>(`/admin/edu-pos/export-menu?region=${encodeURIComponent(region)}`, { method: "POST" });
      onNotice(`В EDU POS отправлено: ${result.categories} категорий и ${result.products} блюд`, "success");
      await load();
    } catch (exportError) {
      onNotice(exportError instanceof Error ? exportError.message : "EDU POS не принял меню", "error");
    } finally {
      setPosAction(null);
    }
  };

  if (loading && !draft) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Загружаем настройки…</div>;
  }
  if (error && !draft) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">{error}</div>;
  }
  if (!item || !draft) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Город не найден.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-3">
        <nav className="flex min-w-max gap-1" aria-label="Разделы настроек">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={tab === entry.id ? "page" : undefined}
              className={`min-h-12 border-b-2 px-3 text-sm font-medium ${tab === entry.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>
      </div>

      <form className="space-y-4" onSubmit={saveRegion}>
        {tab === "basic" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="font-semibold text-slate-950">Основные настройки</h2>
              <p className="mt-1 text-sm text-slate-500">Город: {item.name}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Телефон кухни<input className={inputClass} value={draft.contactPhone} onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })} /></label>
              <label className={labelClass}>Телефон поддержки<input className={inputClass} value={draft.supportPhone} onChange={(event) => setDraft({ ...draft, supportPhone: event.target.value })} /></label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 sm:col-span-2"><input type="checkbox" className="size-4 accent-blue-600" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />Принимать заказы в этом городе</label>
            </div>
          </section>
        ) : null}

        {tab === "delivery" ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="border-b border-slate-200 pb-4"><h2 className="font-semibold text-slate-950">Условия доставки</h2><p className="mt-1 text-sm text-slate-500">Расписание, стоимость и ограничения заказа.</p></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className={labelClass}>Начало работы<input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryOpenTime} onChange={(event) => setDraft({ ...draft, deliveryOpenTime: event.target.value })} /></label>
                <label className={labelClass}>Окончание работы<input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryCloseTime} onChange={(event) => setDraft({ ...draft, deliveryCloseTime: event.target.value })} /></label>
                <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={draft.deliveryIs24Hours} onChange={(event) => setDraft({ ...draft, deliveryIs24Hours: event.target.checked })} />Круглосуточно</label>
                <label className={labelClass}>Минимальный заказ<input required min="0" type="number" className={inputClass} value={draft.minimumOrderAmount} onChange={(event) => setDraft({ ...draft, minimumOrderAmount: event.target.value })} /></label>
                <label className={labelClass}>Максимальный заказ<input required min="1" type="number" className={inputClass} value={draft.maximumOrderAmount} onChange={(event) => setDraft({ ...draft, maximumOrderAmount: event.target.value })} /></label>
                <label className={labelClass}>Стоимость доставки<input required min="0" type="number" className={inputClass} value={draft.deliveryFee} onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })} /></label>
                <label className={labelClass}>Бесплатная доставка от<input required min="0" type="number" className={inputClass} value={draft.freeDeliveryThreshold} onChange={(event) => setDraft({ ...draft, freeDeliveryThreshold: event.target.value })} /></label>
                <label className={labelClass}>Ожидаемое время, минут<input required min="1" type="number" className={inputClass} value={draft.estimatedDeliveryMinutes} onChange={(event) => setDraft({ ...draft, estimatedDeliveryMinutes: event.target.value })} /></label>
              </div>
              <fieldset className="mt-5"><legend className="text-sm font-medium text-slate-700">Рабочие дни</legend><div className="mt-2 flex flex-wrap gap-2">{weekdays.map((day) => <label key={day.value} className={`grid size-11 cursor-pointer place-items-center rounded-lg border text-sm font-medium ${draft.deliveryWorkingDays.includes(day.value) ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600"}`}><input type="checkbox" className="sr-only" checked={draft.deliveryWorkingDays.includes(day.value)} onChange={(event) => setDraft({ ...draft, deliveryWorkingDays: event.target.checked ? [...draft.deliveryWorkingDays, day.value] : draft.deliveryWorkingDays.filter((value) => value !== day.value) })} />{day.label}</label>)}</div></fieldset>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4"><h2 className="font-semibold text-slate-950">Зона доставки</h2><p className="mt-1 text-sm text-slate-500">Нарисуйте или скорректируйте границу на карте.</p></div>
              <DeliveryZoneEditor cityName={item.name} regionSlug={item.slug} points={draft.deliveryZone} onChange={(deliveryZone) => setDraft({ ...draft, deliveryZone })} />
            </section>
          </div>
        ) : null}

        {tab === "rewards" ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-4"><h2 className="font-semibold text-slate-950">NFT-вознаграждение</h2><p className="mt-1 text-sm text-slate-500">NAKTA Coin задаются в каждом блюде, здесь настраивается NFT за повторные заказы.</p></div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
              <ImageUpload label="Изображение NFT" value={draft.nftRewardImage} hint="Квадратное изображение до 5 МБ." onChange={(nftRewardImage) => setDraft({ ...draft, nftRewardImage })} onError={(message) => onNotice(message, "error")} />
              <div className="grid content-start gap-4">
                <label className={labelClass}>Выдавать NFT за каждые N заказов<input min="0" max="10000" type="number" className={inputClass} value={draft.nftRewardEveryOrders} onChange={(event) => setDraft({ ...draft, nftRewardEveryOrders: event.target.value })} /><small className="font-normal text-slate-500">0 — отключить выдачу NFT.</small></label>
                <label className={labelClass}>Название NFT<input className={inputClass} value={draft.nftRewardName} onChange={(event) => setDraft({ ...draft, nftRewardName: event.target.value })} /></label>
                <label className={labelClass}>Описание<textarea className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={draft.nftRewardDescription} onChange={(event) => setDraft({ ...draft, nftRewardDescription: event.target.value })} /></label>
                <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Технические параметры NFT</summary><div className="mt-4 grid gap-4"><label className={labelClass}>Сеть<select className={inputClass} value={draft.nftRewardNetwork} onChange={(event) => setDraft({ ...draft, nftRewardNetwork: event.target.value })}><option value="polygon">Polygon</option><option value="ethereum">Ethereum</option><option value="bsc">BSC</option><option value="solana">Solana</option><option value="ton">TON</option></select></label><label className={labelClass}>Адрес контракта<input className={inputClass} value={draft.nftContractAddress} onChange={(event) => setDraft({ ...draft, nftContractAddress: event.target.value })} /></label><label className={labelClass}>Ссылка на метаданные<input className={inputClass} value={draft.nftMetadataUri} onChange={(event) => setDraft({ ...draft, nftMetadataUri: event.target.value })} /></label></div></details>
              </div>
            </div>
          </section>
        ) : null}

        {(["basic", "delivery", "rewards"] as SettingsTab[]).includes(tab) ? (
          <div className="flex justify-end"><button type="submit" className={`${primaryButton} w-full sm:w-auto`} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить настройки"}</button></div>
        ) : null}
      </form>

      {tab === "pickup" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-950">Точки самовывоза</h2><p className="mt-1 text-sm text-slate-500">Адреса, которые клиент может выбрать при оформлении.</p></div><button type="button" className={primaryButton} onClick={() => setPickupEditor(emptyPickup(item.pickupLocations?.length ?? 0))}><Icon path={mdiPlus} size={0.72} aria-hidden="true" />Добавить точку самовывоза</button></header>
          {item.pickupLocations?.length ? <div className="divide-y divide-slate-200">{item.pickupLocations.map((location) => <article key={location.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-5"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{location.title || "Точка самовывоза"}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${location.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{location.enabled ? "Активна" : "Выключена"}</span></div><p className="mt-2 text-sm text-slate-700">{location.address}</p><p className="mt-1 text-xs text-slate-500">{location.workingHours || "Время работы не указано"}</p></div><div className="grid grid-cols-2 gap-2"><button type="button" className={secondaryButton} onClick={() => setPickupEditor(pickupDraft(location))}>Редактировать</button><button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => void deletePickup(location)}><Icon path={mdiDeleteOutline} size={0.7} aria-hidden="true" />Удалить</button></div></article>)}</div> : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-slate-500">Точек самовывоза пока нет.</div>}
        </section>
      ) : null}

      {tab === "edu-pos" ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Подключение EDU POS</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eduPosStatus?.configured ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{eduPosStatus?.configured ? "Настроено" : "Не настроено"}</span></div><p className="mt-2 text-sm text-slate-500">Заказы синхронизируются каждые {eduPosStatus?.intervals.ordersSeconds ?? 7.5} сек.</p></div><button type="button" className={secondaryButton} disabled={Boolean(posAction)} onClick={() => void checkEduPos()}><Icon path={mdiCheckNetworkOutline} size={0.75} aria-hidden="true" />{posAction === "check" ? "Проверяем…" : "Проверить подключение"}</button></div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-4"><dt className="text-xs text-slate-500">Последняя сверка меню</dt><dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(eduPosStatus?.lastMenuSyncAt ?? null)}</dd></div><div className="rounded-lg bg-slate-50 p-4"><dt className="text-xs text-slate-500">Последняя сверка стоп-листа</dt><dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(eduPosStatus?.lastStopListSyncAt ?? null)}</dd></div></dl>
            {eduPosStatus?.lastError ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><strong className="block">Последняя ошибка</strong><span className="mt-1 block break-words">{eduPosStatus.lastError}</span></div> : null}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-5"><Icon path={mdiSwapHorizontal} size={1} aria-hidden="true" className="text-blue-600" /><h3 className="mt-4 font-semibold text-slate-950">Сверить меню из EDU POS</h3><p className="mt-2 text-sm leading-6 text-slate-500">Обновит цены, сопоставления блюд и стоп-лист на сайте.</p><button type="button" className={`${primaryButton} mt-5 w-full`} disabled={Boolean(posAction) || !eduPosStatus?.configured} onClick={() => void syncEduPosMenu()}>{posAction === "sync" ? "Сверяем…" : "Сверить меню"}</button></article>
            <article className="rounded-xl border border-slate-200 bg-white p-5"><Icon path={mdiDownloadOutline} size={1} aria-hidden="true" className="text-blue-600" /><h3 className="mt-4 font-semibold text-slate-950">Экспортировать меню в EDU POS</h3><p className="mt-2 text-sm leading-6 text-slate-500">Отправит категории, блюда, цены, доступность и модификации выбранного города.</p><button type="button" className={`${primaryButton} mt-5 w-full`} disabled={Boolean(posAction) || !eduPosStatus?.configured} onClick={() => void exportEduPosMenu()}>{posAction === "export" ? "Экспортируем…" : "Экспортировать меню"}</button></article>
          </section>
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong className="block">Как синхронизируются заказы</strong><p className="mt-1 leading-6">После «Принять заказ» он отправляется в EDU POS. Статусы кухни автоматически переводят заказ в «Готовится» и «Готов». Более ранний ответ POS не может откатить уже продвинутый заказ назад.</p></section>
        </div>
      ) : null}

      {pickupEditor ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-0 sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPickupEditor(null); }}>
          <form className="flex min-h-dvh w-full max-w-2xl flex-col bg-white shadow-2xl sm:min-h-0 sm:rounded-xl" onSubmit={savePickup}>
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-semibold text-slate-950">{pickupEditor.item ? "Редактировать самовывоз" : "Добавить самовывоз"}</h2><button type="button" aria-label="Закрыть редактор самовывоза" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={() => setPickupEditor(null)}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button></header>
            <div className="grid gap-4 overflow-y-auto p-5"><label className={labelClass}>Название точки<input className={inputClass} placeholder="Например, Манаса" value={pickupEditor.title} onChange={(event) => setPickupEditor({ ...pickupEditor, title: event.target.value })} /></label><label className={labelClass}>Адрес<input required className={inputClass} value={pickupEditor.address} onChange={(event) => setPickupEditor({ ...pickupEditor, address: event.target.value })} /></label><label className={labelClass}>Время работы<input className={inputClass} placeholder="Ежедневно, 11:00–23:00" value={pickupEditor.workingHours} onChange={(event) => setPickupEditor({ ...pickupEditor, workingHours: event.target.value })} /></label><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><label className={labelClass}>Ссылка на Яндекс Карты<input type="url" className={inputClass} placeholder="https://yandex.ru/maps/…" value={pickupEditor.yandexUrl} onChange={(event) => setPickupEditor({ ...pickupEditor, yandexUrl: event.target.value })} /></label><button type="button" className={`${secondaryButton} self-end`} onClick={() => void resolvePickupCoordinates()}><Icon path={mdiRefresh} size={0.7} aria-hidden="true" />Определить координаты</button></div><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Широта<input type="number" step="any" className={inputClass} value={pickupEditor.latitude} onChange={(event) => setPickupEditor({ ...pickupEditor, latitude: event.target.value })} /></label><label className={labelClass}>Долгота<input type="number" step="any" className={inputClass} value={pickupEditor.longitude} onChange={(event) => setPickupEditor({ ...pickupEditor, longitude: event.target.value })} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Порядок<input min="0" type="number" className={inputClass} value={pickupEditor.sortOrder} onChange={(event) => setPickupEditor({ ...pickupEditor, sortOrder: event.target.value })} /></label><label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={pickupEditor.enabled} onChange={(event) => setPickupEditor({ ...pickupEditor, enabled: event.target.checked })} />Точка активна</label></div></div>
            <footer className="grid gap-2 border-t border-slate-200 p-4 sm:grid-cols-2"><button type="button" className={secondaryButton} onClick={() => setPickupEditor(null)}>Отменить</button><button type="submit" className={primaryButton} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить точку"}</button></footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
