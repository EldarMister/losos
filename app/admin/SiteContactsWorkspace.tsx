"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { useAdminAccess } from "./admin-access";
import { confirmAdminNavigation, useUnsavedChanges } from "./use-unsaved-changes";
import { useAdminLanguage } from "./i18n/react";
import { translateAdmin as t } from "./i18n/store";
import type { AdminRequest, Region } from "./admin-types";
import { contactPhoneHref, instagramHref, type SiteContacts, type SiteContactSettings } from "../lib/site-settings";
import { CATALOG_UPDATED_EVENT, CATALOG_UPDATE_STORAGE_KEY } from "../lib/catalog-sync";

export function SiteContactsWorkspace({ regions, region, request, onNotice }: {
  regions: Region[]; region: string; request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
}) {
  useAdminLanguage();
  const { can } = useAdminAccess();
  const [scope, setScope] = useState("all");
  const [settings, setSettings] = useState<SiteContactSettings | null>(null);
  const [draft, setDraft] = useState<SiteContacts | null>(null);
  const [useGlobal, setUseGlobal] = useState(false);
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = draft !== null && saved !== JSON.stringify({ contacts: draft, useGlobal });
  useUnsavedChanges(dirty);
  const select = useCallback((data: SiteContactSettings, target: string) => {
    const inherited = target !== "all" && !Object.hasOwn(data.overrides, target);
    const contacts = target === "all" ? data.global : data.overrides[target] ?? data.global;
    setDraft({ ...contacts }); setUseGlobal(inherited);
    setSaved(JSON.stringify({ contacts, useGlobal: inherited }));
  }, []);
  useEffect(() => {
    let active = true;
    void request<SiteContactSettings>("/admin/site-settings").then(data => {
      if (!active) return;
      setSettings(data); select(data, "all");
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : t("Не удалось загрузить настройки")); });
    return () => { active = false; };
  }, [request, select]);
  async function changeScope(target: string) {
    if (!settings || busy || target === scope || !await confirmAdminNavigation()) return;
    setScope(target); select(settings, target);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || busy || !can("settings.edit")) return;
    setBusy(true); setError("");
    try {
      const data = await request<SiteContactSettings>("/admin/site-settings", { method: "PATCH", body: JSON.stringify({
        target: scope, useGlobal: scope !== "all" && useGlobal,
        ...(scope !== "all" && useGlobal ? {} : { contacts: { phone: draft.phone.trim(), email: draft.email.trim(), address: draft.address.trim(), instagram: draft.instagram.trim().replace(/^@/, "") } }),
      }) });
      setSettings(data); select(data, scope);
      window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
      try { localStorage.setItem(CATALOG_UPDATE_STORAGE_KEY, String(Date.now())); } catch { /* The current tab is already updated. */ }
      onNotice(t("Настройки сохранены"), "success");
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("Не удалось сохранить настройки")); }
    finally { setBusy(false); }
  }
  if (!settings || !draft) return <Card className="p-5"><p role={error ? "alert" : "status"}>{error || t("Загружаем настройки…")}</p></Card>;
  const shown = scope !== "all" && useGlobal ? settings.global : draft;
  return <form className="space-y-4" onSubmit={save}>
    <Card className="gap-4 p-5">
      <div><h2 className="font-semibold">{t("Контакты сайта")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("Телефон, адрес, почта и Instagram в подвале сайта и поддержке.")}</p></div>
      <Label className="grid gap-2">{t("Для каких городов")}
        <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={scope} disabled={busy} onChange={event => void changeScope(event.target.value)}>
          <option value="all">{t("Общие для всех городов")}</option>
          {regions.map(item => <option key={item.slug} value={item.slug}>{item.name}{item.slug === region ? ` · ${t("Текущий город")}` : ""}</option>)}
        </select>
      </Label>
      <p className="text-xs text-muted-foreground">{scope === "all" ? t("Общие данные используются в городах без собственных настроек.") : t("Изменения в этом городе не затрагивают остальные города.")}</p>
      {scope !== "all" ? <div className="flex items-center justify-between gap-4 rounded-lg border p-3"><Label htmlFor="site-contacts-inherit">{t("Использовать общие данные")}</Label><Switch id="site-contacts-inherit" checked={useGlobal} disabled={busy || !can("settings.edit")} onCheckedChange={setUseGlobal}/></div> : null}
      <fieldset disabled={busy || !can("settings.edit") || scope !== "all" && useGlobal} className="grid gap-4 sm:grid-cols-2">
        <Label className="grid gap-2">{t("Телефон")}<Input type="tel" required maxLength={40} value={shown.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })}/></Label>
        <Label className="grid gap-2">{t("Электронная почта")}<Input type="email" required maxLength={160} value={shown.email} onChange={event => setDraft({ ...draft, email: event.target.value })}/></Label>
        <Label className="grid gap-2 sm:col-span-2">{t("Адрес")}<Input maxLength={240} value={shown.address} onChange={event => setDraft({ ...draft, address: event.target.value })}/></Label>
        <Label className="grid gap-2 sm:col-span-2">Instagram<Input maxLength={31} placeholder="naktasushi_osh" value={shown.instagram} onChange={event => setDraft({ ...draft, instagram: event.target.value })}/></Label>
      </fieldset>
      <div className="rounded-xl bg-muted p-4 text-sm"><p className="mb-2 text-xs text-muted-foreground">{t("Предпросмотр контактов")}</p><a href={contactPhoneHref(shown.phone)}>{shown.phone}</a><p className="mt-1">{shown.address}</p>{shown.instagram ? <a className="mt-2 inline-block underline underline-offset-4" href={instagramHref(shown.instagram.trim().replace(/^@/, ""))} target="_blank" rel="noopener noreferrer">@{shown.instagram.replace(/^@/, "")}</a> : null}</div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy || !dirty || !can("settings.edit")}>{busy ? t("Сохраняем…") : t("Сохранить")}</Button><Button type="button" variant="outline" disabled={busy || !dirty} onClick={() => select(settings, scope)}>{t("Отменить")}</Button></div>
    </Card>
  </form>;
}
