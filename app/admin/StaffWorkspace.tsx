"use client";

import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, Ellipsis, History, LoaderCircle, Minus, Pencil, Plus, ShieldCheck, UserRound, UserRoundCheck, UserRoundX, X } from "lucide-react";
import { useUnsavedChanges } from "./use-unsaved-changes";
import { useAdminAccess, type Staff } from "./admin-access";
import type { AdminRequest } from "./admin-types";
import { AdminSelect } from "./AdminSelect";
import { ListPagination } from "./workspace-kit";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type PermissionGroup = { section: string; label: string; permissions: { key: string; label: string }[] };
type AuditEntry = { id: string; actorName?: string; action: string; createdAt: string };
type PermissionOverride = Staff["permissions"][string];
const pageSize = 25;
const roleNames = { OWNER: "Владелец", ADMIN: "Администратор", MANAGER: "Менеджер" };
const roleOptions = Object.entries(roleNames).map(([value, label]) => ({ value, label }));
const managerDefaults = new Set(["orders.view", "orders.edit", "orders.status", "customers.view", "customers.edit"]);
const permissionActions = [
  { value: "view", label: "Просмотр" }, { value: "create", label: "Создание" },
  { value: "edit", label: "Редактирование" }, { value: "delete", label: "Удаление" },
  { value: "export", label: "Экспорт" }, { value: "status", label: "Смена статуса" },
];
const overrideOptions = [
  { value: "inherit", label: "По роли" }, { value: "allow", label: "Разрешить" }, { value: "deny", label: "Запретить" },
];
const auditActions: Record<string, string> = {
  "staff.bootstrap": "Настроил первого владельца", "staff.create": "Создал сотрудника",
  "staff.update": "Изменил данные или доступ сотрудника", "staff.access": "Изменил роль или права",
  "auth.login": "Вошёл в систему", "auth.password_changed": "Изменил свой пароль",
  "customer.update": "Изменил карточку клиента", "order.status": "Изменил статус заказа",
  createProduct: "Создал товар", updateProduct: "Изменил товар", deleteProduct: "Удалил товар",
  createCategory: "Создал категорию", updateCategory: "Изменил категорию", deleteCategory: "Удалил категорию",
  createPromotion: "Создал акцию", updatePromotion: "Изменил акцию", deletePromotion: "Удалил акцию",
  createRegion: "Создал город", updateRegion: "Изменил настройки города", updateOrderKit: "Изменил комплектацию заказа",
  createPickupLocation: "Создал точку выдачи", updatePickupLocation: "Изменил точку выдачи", deletePickupLocation: "Удалил точку выдачи",
};

function sameOverrides(left: Staff["permissions"], right: Staff["permissions"]) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every(key => (left[key] || "inherit") === (right[key] || "inherit"));
}

export function StaffWorkspace({ request, onNotice, onAccessChanged }: {
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
  onAccessChanged: () => void;
}) {
  const { staff: me, can } = useAdminAccess();
  const owner = me?.role === "OWNER";
  const canReadStaff = can("staff.view");
  const canReadAudit = can("audit.view");
  const [section, setSection] = useState("staff");
  const [items, setItems] = useState<Staff[]>([]);
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [creating, setCreating] = useState(false);
  const [editorTab, setEditorTab] = useState("data");
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Staff["role"]>("MANAGER");
  const [overrides, setOverrides] = useState<Staff["permissions"]>({});
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditRevision, setAuditRevision] = useState(0);
  const loadVersion = useRef(0);
  const mutationInFlight = useRef(false);

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    if (!canReadStaff) return;
    setLoading(true);
    setError("");
    try {
      const [data, permissions] = await Promise.all([
        request<{ items: Staff[]; total: number }>(`/admin/staff?limit=${pageSize}&offset=${offset}`),
        request<PermissionGroup[]>("/admin/permissions"),
      ]);
      if (version !== loadVersion.current) return;
      setItems(data.items);
      setTotal(data.total);
      setCatalog(permissions);
    } catch (cause) {
      if (version !== loadVersion.current) return;
      setItems([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить персонал");
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, [request, offset, canReadStaff]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => { clearTimeout(timer); loadVersion.current += 1; };
  }, [load, me?.id]);

  useEffect(() => {
    if (!canReadAudit || section !== "audit") return;
    let active = true;
    const timer = setTimeout(() => {
      setAuditLoading(true);
      setAuditError("");
      void request<{ items: AuditEntry[] }>("/admin/audit?limit=20")
        .then(data => { if (active) setAudit(data.items); })
        .catch(cause => { if (active) { setAudit([]); setAuditError(cause instanceof Error ? cause.message : "Не удалось загрузить журнал"); } })
        .finally(() => { if (active) setAuditLoading(false); });
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [request, canReadAudit, section, auditRevision, me?.id]);

  const dirty = (creating || !!editing) && (name !== (editing?.name || "") || login !== (editing?.login || "") || password !== "" || role !== (editing?.role || "MANAGER") || !sameOverrides(overrides, editing?.permissions || {}));
  useUnsavedChanges(dirty);

  function open(item: Staff | null) {
    if (mutationInFlight.current) return;
    setEditing(item);
    setCreating(!item);
    setName(item?.name || "");
    setLogin(item?.login || "");
    setRole(item?.role || "MANAGER");
    setOverrides({ ...item?.permissions });
    setPassword("");
    setFormError("");
    setEditorTab("data");
  }

  function close() {
    if (mutationInFlight.current || dirty && !window.confirm("Закрыть карточку? Несохранённые изменения будут потеряны.")) return;
    setCreating(false);
    setEditing(null);
    setPassword("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (mutationInFlight.current) return;
    if (!canReadStaff || (creating ? !owner || !can("staff.create") : !can("staff.edit") || !editing || !owner && editing.role === "OWNER")) {
      setFormError("Недостаточно прав для сохранения сотрудника.");
      return;
    }
    const invalid = !name.trim() ? "Укажите имя сотрудника."
      : creating && !/^[a-zA-Z0-9._@+-]{3,100}$/.test(login) ? "Логин: от 3 до 100 латинских букв, цифр или символов . _ @ + -."
      : (creating || password) && (password.length < 12 || password.length > 256) ? "Пароль должен содержать от 12 до 256 символов." : "";
    if (invalid) { setEditorTab("data"); setFormError(invalid); return; }
    mutationInFlight.current = true;
    setBusy(true);
    setFormError("");
    try {
      if (creating) {
        await request("/admin/staff", { method: "POST", body: JSON.stringify({ name, login, password, ...(owner ? { role, permissions: overrides } : {}) }) });
      } else if (editing) {
        await request(`/admin/staff/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name, ...(password && editing.id !== me?.id ? { password } : {}) }) });
        if (owner) await request(`/admin/staff/${editing.id}/access`, { method: "PATCH", body: JSON.stringify({ role, permissions: overrides }) });
      }
      setCreating(false);
      setEditing(null);
      setPassword("");
      await load();
      setAuditRevision(value => value + 1);
      onAccessChanged();
      onNotice("Сотрудник сохранён");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Не удалось сохранить сотрудника");
    } finally {
      mutationInFlight.current = false;
      setBusy(false);
    }
  }

  async function toggle(item: Staff) {
    if (mutationInFlight.current || !can("staff.edit") || !owner && item.role === "OWNER") return;
    if (!window.confirm(`${item.active ? "Отключить" : "Включить"} доступ сотрудника «${item.name}»?${item.active ? " Его сеансы будут завершены." : ""}`)) return;
    mutationInFlight.current = true;
    setTogglingId(item.id);
    try {
      await request(`/admin/staff/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) });
      await load();
      setAuditRevision(value => value + 1);
      onAccessChanged();
      onNotice("Доступ обновлён");
    } catch (cause) {
      onNotice(cause instanceof Error ? cause.message : "Не удалось изменить доступ", "error");
    } finally {
      mutationInFlight.current = false;
      setTogglingId(null);
    }
  }

  function effective(key: string) {
    if (role === "OWNER") return true;
    if (key === "staff.create") return false;
    const allowed = (permission: string) => overrides[permission] === "allow" || (overrides[permission] !== "deny" && (role === "ADMIN" || managerDefaults.has(permission)));
    return allowed(key) && (key.endsWith(".view") || allowed(`${key.split(".")[0]}.view`));
  }

  function permissionControl(group: PermissionGroup, permission: PermissionGroup["permissions"][number]) {
    if (permission.key === "staff.create") return <span className="text-xs text-muted-foreground">Только владелец</span>;
    const permitted = effective(permission.key);
    const needsView = !permission.key.endsWith(".view") && !effective(`${group.section}.view`);
    return <div className="flex min-w-0 items-center gap-2">
      <AdminSelect aria-label={`${group.label}: ${permission.label}`} className="min-w-0 text-xs" disabled={busy} value={overrides[permission.key] || "inherit"} options={overrideOptions} onValueChange={value => setOverrides(previous => {
        const next = { ...previous };
        if (value === "inherit") delete next[permission.key];
        else next[permission.key] = value as PermissionOverride;
        return next;
      })} />
      <span title={permitted ? "Разрешено" : needsView ? "Недоступно без просмотра раздела" : "Запрещено"} className="shrink-0">
        {permitted ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Minus className="size-4 text-muted-foreground" aria-hidden="true" />}
        <span className="sr-only">{permitted ? "Разрешено" : needsView ? "Недоступно без просмотра раздела" : "Запрещено"}</span>
      </span>
    </div>;
  }

  if (!canReadStaff) return <p className="text-sm text-muted-foreground">Нет доступа к персоналу.</p>;
  const overrideCount = Object.values(overrides).filter(value => value !== "inherit").length;
  const dialogOpen = (creating && owner && can("staff.create")) || (!!editing && can("staff.edit") && (owner || editing.role !== "OWNER"));

  return <div className="space-y-6">
    <Tabs value={canReadAudit ? section : "staff"} onValueChange={value => setSection(String(value))} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList><TabsTrigger value="staff"><UserRound />Сотрудники</TabsTrigger>{canReadAudit && <TabsTrigger value="audit"><History />Журнал действий</TabsTrigger>}</TabsList>
        {owner && can("staff.create") && <Button disabled={busy || !!togglingId} onClick={() => open(null)}><Plus />Добавить сотрудника</Button>}
      </div>
      <TabsContent value="staff" className="space-y-4">
        <p className="text-sm text-muted-foreground">Всего сотрудников: {total}. У каждого — личная учётная запись и права доступа.</p>
        {error && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}<Button variant="outline" disabled={loading} onClick={() => void load()}>Повторить</Button></div>}
        <Card className="gap-0 overflow-hidden py-0">
          <Table aria-label="Сотрудники" aria-busy={loading}>
            <TableHeader><TableRow><TableHead>Сотрудник</TableHead><TableHead className="hidden sm:table-cell">Роль</TableHead><TableHead>Статус</TableHead><TableHead className="w-12"><span className="sr-only">Действия</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map(item => <TableRow key={item.id}>
                <TableCell><div className="flex items-center gap-3"><span className="hidden size-9 shrink-0 place-items-center rounded-full bg-muted sm:grid"><UserRound className="size-4" /></span><div className="min-w-0"><span className="block max-w-40 truncate font-medium sm:max-w-80" title={item.name}>{item.name}{item.id === me?.id && <span className="ml-1 text-xs font-normal text-muted-foreground">(вы)</span>}</span><span className="block max-w-40 truncate text-xs text-muted-foreground sm:max-w-80" title={item.login}>{item.login}</span><span className="mt-1 block text-xs text-muted-foreground sm:hidden">{roleNames[item.role]}</span></div></div></TableCell>
                <TableCell className="hidden sm:table-cell">{roleNames[item.role]}</TableCell>
                <TableCell><Badge variant={item.active ? "secondary" : "outline"}>{item.active ? "Активен" : "Отключён"}</Badge></TableCell>
                <TableCell>{can("staff.edit") && (owner || item.role !== "OWNER") && <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={`Действия: ${item.name}`} disabled={busy || !!togglingId} />}>
                    {togglingId === item.id ? <LoaderCircle className="size-4 animate-spin" /> : <Ellipsis className="size-4" />}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => open(item)}><Pencil />Редактировать</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant={item.active ? "destructive" : "default"} onClick={() => void toggle(item)}>{item.active ? <UserRoundX /> : <UserRoundCheck />}{item.active ? "Отключить доступ" : "Включить доступ"}</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>}</TableCell>
              </TableRow>)}
              {!items.length && <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">{loading ? "Загружаем сотрудников…" : error ? "Список недоступен" : "Сотрудники не найдены"}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <ListPagination total={total} page={offset / pageSize} pageSize={pageSize} loading={loading || !!togglingId} onPageChange={page => setOffset(page * pageSize)} />
        </Card>
      </TabsContent>
      {canReadAudit && <TabsContent value="audit"><Card><CardHeader><CardTitle>Последние действия</CardTitle><CardDescription>Последние 20 событий. Время указано по Бишкеку.</CardDescription></CardHeader><CardContent>
        {auditLoading ? <p className="py-6 text-sm text-muted-foreground" role="status">Загружаем журнал…</p> : auditError ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-destructive" role="alert">{auditError}<Button variant="outline" onClick={() => setAuditRevision(value => value + 1)}>Повторить</Button></div> : audit.length ? <ul className="divide-y">{audit.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-sm"><div><span className="font-medium">{item.actorName || "Сотрудник"}</span><p className="text-muted-foreground">{auditActions[item.action] || "Изменил рабочие данные"}</p></div><time dateTime={item.createdAt} className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Bishkek" })}</time></li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">Действий пока нет.</p>}
      </CardContent></Card></TabsContent>}
    </Tabs>

    <Dialog open={dialogOpen} disablePointerDismissal={busy} onOpenChange={next => { if (!next) close(); }}>
      <DialogContent showCloseButton={false} className={`flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 ${owner && editorTab === "access" ? "sm:max-w-6xl" : "sm:max-w-2xl"}`}>
        <DialogHeader className="relative shrink-0 border-b p-4 pr-14 sm:p-6 sm:pr-14"><DialogTitle>{creating ? "Новый сотрудник" : editing?.name}</DialogTitle><DialogDescription>{owner ? "Личная учётная запись и доступ к рабочим разделам." : "Основные данные сотрудника. Роль и права меняет владелец."}</DialogDescription><Button type="button" variant="ghost" size="icon-sm" className="absolute right-3 top-3" aria-label="Закрыть карточку сотрудника" disabled={busy} onClick={close}><X /></Button></DialogHeader>
        <form noValidate onSubmit={save} className="flex min-h-0 flex-1 flex-col" aria-busy={busy}>
          <Tabs value={owner ? editorTab : "data"} onValueChange={value => setEditorTab(String(value))} className="min-h-0 flex-1 gap-0">
            {owner && <div className="shrink-0 px-4 pt-4 sm:px-6"><TabsList><TabsTrigger value="data" disabled={busy}><UserRound />Данные</TabsTrigger><TabsTrigger value="access" disabled={busy}><ShieldCheck />Права доступа</TabsTrigger></TabsList></div>}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              <TabsContent value="data" className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2"><Label htmlFor="staff-name">Имя</Label><Input id="staff-name" value={name} disabled={busy} onChange={event => setName(event.target.value)} required maxLength={120} autoComplete="name" /></div>
                  <div className="grid gap-2"><Label htmlFor="staff-login">Логин</Label><Input id="staff-login" value={login} disabled={busy || !creating} onChange={event => setLogin(event.target.value)} required maxLength={100} autoComplete="off" />{!creating && <p className="text-xs text-muted-foreground">Логин нельзя изменить после создания.</p>}</div>
                  {(creating || owner && editing?.id !== me?.id) && <div className="grid gap-2 sm:col-span-2"><Label htmlFor="staff-password">{creating ? "Пароль" : "Новый пароль"}</Label><Input id="staff-password" type="password" autoComplete="new-password" disabled={busy} required={creating} minLength={12} maxLength={256} value={password} onChange={event => setPassword(event.target.value)} /><p className="text-xs text-muted-foreground">{creating ? "Не менее 12 символов." : "Оставьте пустым, чтобы сохранить текущий пароль. Новый пароль завершит активные сеансы сотрудника."}</p></div>}
                  {editing?.id === me?.id && <p className="text-xs text-muted-foreground sm:col-span-2">Свой пароль можно изменить в «Мой профиль».</p>}
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="staff-role">Роль</Label><AdminSelect id="staff-role" value={role} options={roleOptions} disabled={busy || !owner} onValueChange={value => setRole(value as Staff["role"])} /><p className="text-xs text-muted-foreground">{role === "OWNER" ? "Полный доступ, управление сотрудниками и их правами." : role === "ADMIN" ? "Все рабочие разделы, кроме создания сотрудников и изменения прав. Можно задать исключения." : "Работа с заказами и клиентами. Остальные разделы доступны по индивидуальным разрешениям."}</p></div>
                </div>
                {editing && !editing.active && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Сотрудник отключён и не может войти. Включить доступ можно через меню в списке сотрудников.</p>}
              </TabsContent>
              {owner && <TabsContent value="access" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium">{roleNames[role]}</h3><p className="mt-1 text-xs text-muted-foreground">{role === "OWNER" ? "Владелец всегда имеет полный доступ." : `Индивидуальных настроек: ${overrideCount}. Они сохраняются при смене роли.`}</p></div><Button type="button" variant="outline" size="sm" disabled={busy || role === "OWNER" || !overrideCount} onClick={() => setOverrides({})}>Сбросить к правам роли</Button></div>
                {role === "OWNER" ? <p className="rounded-lg bg-muted p-4 text-sm">Права владельца нельзя ограничить. Последнего активного владельца нельзя отключить или понизить.</p> : <>
                  <p className="text-xs leading-relaxed text-muted-foreground">Галочка показывает итоговый доступ после сохранения. Без просмотра раздела остальные действия в нём недоступны. Создавать сотрудников и менять права может только владелец.</p>
                  {editing && !editing.active && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Эти права вступят в силу после включения учётной записи.</p>}
                  <div className="space-y-3 lg:hidden">{catalog.map(group => <section key={group.section} className="rounded-lg border p-3"><h4 className="mb-3 font-medium">{group.label}</h4><div className="space-y-3">{group.permissions.map(permission => <div key={permission.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)] items-center gap-3"><span className="text-xs leading-snug">{permission.label}</span>{permissionControl(group, permission)}</div>)}</div></section>)}</div>
                  <div className="hidden overflow-x-auto rounded-lg border lg:block"><Table className="min-w-[1060px] table-fixed"><TableHeader><TableRow><TableHead className="w-36">Раздел</TableHead>{permissionActions.map(action => <TableHead key={action.value} className="whitespace-normal text-xs">{action.label}</TableHead>)}</TableRow></TableHeader><TableBody>{catalog.map(group => <TableRow key={group.section}><TableCell className="whitespace-normal text-xs font-medium">{group.label}</TableCell>{permissionActions.map(action => { const permission = group.permissions.find(item => item.key === `${group.section}.${action.value}`); return <TableCell key={action.value} className="px-2">{permission ? permissionControl(group, permission) : <span className="text-muted-foreground">—</span>}</TableCell>; })}</TableRow>)}</TableBody></Table></div>
                </>}
              </TabsContent>}
            </div>
          </Tabs>
          <div className="sticky bottom-0 shrink-0 space-y-3 border-t bg-background p-4 sm:px-6">
            {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
            <div className="flex items-center justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={close}>Отменить</Button><Button type="submit" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? "Сохраняем…" : creating ? "Создать сотрудника" : "Сохранить"}</Button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
