"use client";
import { translateAdmin as t, adminLocale } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { confirmAdminAction } from "./AdminConfirmationDialog";
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
type PermissionGroup = {
    section: string;
    label: string;
    permissions: {
        key: string;
        label: string;
    }[];
};
type AuditEntry = {
    id: string;
    actorName?: string;
    action: string;
    createdAt: string;
};
type PermissionOverride = Staff["permissions"][string];
const pageSize = 25;
const roleNames = { get OWNER() {
        return t("Владелец");
    }, get ADMIN() {
        return t("Администратор");
    }, get MANAGER() {
        return t("Менеджер");
    } };
const managerDefaults = new Set(["orders.view", "orders.edit", "orders.status", "customers.view", "customers.edit"]);
const permissionActions = [
    { value: "view", get label() {
            return t("Просмотр");
        } }, { value: "create", get label() {
            return t("Создание");
        } },
    { value: "edit", get label() {
            return t("Редактирование");
        } }, { value: "delete", get label() {
            return t("Удаление");
        } },
    { value: "export", get label() {
            return t("Экспорт");
        } }, { value: "status", get label() {
            return t("Смена статуса");
        } },
];
const overrideOptions = [
    { value: "inherit", get label() {
            return t("По роли");
        } }, { value: "allow", get label() {
            return t("Разрешить");
        } }, { value: "deny", get label() {
            return t("Запретить");
        } },
];
const auditActions: Record<string, string> = {
    get "staff.bootstrap"() {
        return t("Настроил первого владельца");
    },
    get "staff.create"() {
        return t("Создал сотрудника");
    },
    get "staff.update"() {
        return t("Изменил данные или доступ сотрудника");
    },
    get "staff.access"() {
        return t("Изменил роль или права");
    },
    get "auth.login"() {
        return t("Вошёл в систему");
    },
    get "auth.password_changed"() {
        return t("Изменил свой пароль");
    },
    get "customer.update"() {
        return t("Изменил карточку клиента");
    },
    get "order.status"() {
        return t("Изменил статус заказа");
    },
    get createProduct() {
        return t("Создал товар");
    },
    get updateProduct() {
        return t("Изменил товар");
    },
    get deleteProduct() {
        return t("Удалил товар");
    },
    get createCategory() {
        return t("Создал категорию");
    },
    get updateCategory() {
        return t("Изменил категорию");
    },
    get deleteCategory() {
        return t("Удалил категорию");
    },
    get createPromotion() {
        return t("Создал акцию");
    },
    get updatePromotion() {
        return t("Изменил акцию");
    },
    get deletePromotion() {
        return t("Удалил акцию");
    },
    get createRegion() {
        return t("Создал город");
    },
    get updateRegion() {
        return t("Изменил настройки города");
    },
    get updateOrderKit() {
        return t("Изменил комплектацию заказа");
    },
    get createPickupLocation() {
        return t("Создал точку выдачи");
    },
    get updatePickupLocation() {
        return t("Изменил точку выдачи");
    },
    get deletePickupLocation() {
        return t("Удалил точку выдачи");
    },
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
    useAdminLanguage();
    const roleOptions = Object.entries(roleNames).map(([value, label]) => ({ value, label }));
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
        if (!canReadStaff)
            return;
        setLoading(true);
        setError("");
        try {
            const [data, permissions] = await Promise.all([
                request<{
                    items: Staff[];
                    total: number;
                }>(`/admin/staff?limit=${pageSize}&offset=${offset}`),
                request<PermissionGroup[]>("/admin/permissions"),
            ]);
            if (version !== loadVersion.current)
                return;
            setItems(data.items);
            setTotal(data.total);
            setCatalog(permissions);
        }
        catch (cause) {
            if (version !== loadVersion.current)
                return;
            setItems([]);
            setTotal(0);
            setError(cause instanceof Error ? cause.message : t("Не удалось загрузить персонал"));
        }
        finally {
            if (version === loadVersion.current)
                setLoading(false);
        }
    }, [request, offset, canReadStaff]);
    useEffect(() => {
        const timer = setTimeout(() => void load(), 0);
        return () => { clearTimeout(timer); loadVersion.current += 1; };
    }, [load, me?.id]);
    useEffect(() => {
        if (!canReadAudit || section !== "audit")
            return;
        let active = true;
        const timer = setTimeout(() => {
            setAuditLoading(true);
            setAuditError("");
            void request<{
                items: AuditEntry[];
            }>("/admin/audit?limit=20")
                .then(data => { if (active)
                setAudit(data.items); })
                .catch(cause => { if (active) {
                setAudit([]);
                setAuditError(cause instanceof Error ? cause.message : t("Не удалось загрузить журнал"));
            } })
                .finally(() => { if (active)
                setAuditLoading(false); });
        }, 0);
        return () => { active = false; clearTimeout(timer); };
    }, [request, canReadAudit, section, auditRevision, me?.id]);
    const dirty = (creating || !!editing) && (name !== (editing?.name || "") || login !== (editing?.login || "") || password !== "" || role !== (editing?.role || "MANAGER") || !sameOverrides(overrides, editing?.permissions || {}));
    useUnsavedChanges(dirty);
    function open(item: Staff | null) {
        if (mutationInFlight.current)
            return;
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
    async function close() {
        if (mutationInFlight.current || dirty && !await confirmAdminAction(t("Закрыть карточку? Несохранённые изменения будут потеряны.")))
            return;
        setCreating(false);
        setEditing(null);
        setPassword("");
    }
    async function save(event: FormEvent) {
        event.preventDefault();
        if (mutationInFlight.current)
            return;
        if (!canReadStaff || (creating ? !owner || !can("staff.create") : !can("staff.edit") || !editing || !owner && editing.role === "OWNER")) {
            setFormError(t("Недостаточно прав для сохранения сотрудника."));
            return;
        }
        const invalid = !name.trim() ? t("Укажите имя сотрудника.") : creating && !/^[a-zA-Z0-9._@+-]{3,100}$/.test(login) ? t("Логин: от 3 до 100 латинских букв, цифр или символов . _ @ + -.") : (creating || password) && (password.length < 12 || password.length > 256) ? t("Пароль должен содержать от 12 до 256 символов.") : "";
        if (invalid) {
            setEditorTab("data");
            setFormError(invalid);
            return;
        }
        mutationInFlight.current = true;
        setBusy(true);
        setFormError("");
        try {
            if (creating) {
                await request("/admin/staff", { method: "POST", body: JSON.stringify({ name, login, password, ...(owner ? { role, permissions: overrides } : {}) }) });
            }
            else if (editing) {
                await request(`/admin/staff/${editing.id}`, { method: "PATCH", body: JSON.stringify({ name, ...(password && editing.id !== me?.id ? { password } : {}) }) });
                if (owner)
                    await request(`/admin/staff/${editing.id}/access`, { method: "PATCH", body: JSON.stringify({ role, permissions: overrides }) });
            }
            setCreating(false);
            setEditing(null);
            setPassword("");
            await load();
            setAuditRevision(value => value + 1);
            onAccessChanged();
            onNotice(t("Сотрудник сохранён"));
        }
        catch (cause) {
            setFormError(cause instanceof Error ? cause.message : t("Не удалось сохранить сотрудника"));
        }
        finally {
            mutationInFlight.current = false;
            setBusy(false);
        }
    }
    async function toggle(item: Staff) {
        if (mutationInFlight.current || !can("staff.edit") || !owner && item.role === "OWNER")
            return;
        if (!await confirmAdminAction(t("{0} доступ сотрудника \u00AB{1}\u00BB?{2}", { "0": item.active ? t("Отключить") : t("Включить"), "1": item.name, "2": item.active ? t(" Его сеансы будут завершены.") : "" })))
            return;
        mutationInFlight.current = true;
        setTogglingId(item.id);
        try {
            await request(`/admin/staff/${item.id}`, { method: "PATCH", body: JSON.stringify({ active: !item.active }) });
            await load();
            setAuditRevision(value => value + 1);
            onAccessChanged();
            onNotice(t("Доступ обновлён"));
        }
        catch (cause) {
            onNotice(cause instanceof Error ? cause.message : t("Не удалось изменить доступ"), "error");
        }
        finally {
            mutationInFlight.current = false;
            setTogglingId(null);
        }
    }
    function effective(key: string) {
        if (role === "OWNER")
            return true;
        if (key === "staff.create")
            return false;
        const allowed = (permission: string) => overrides[permission] === "allow" || (overrides[permission] !== "deny" && (role === "ADMIN" || managerDefaults.has(permission)));
        return allowed(key) && (key.endsWith(".view") || allowed(`${key.split(".")[0]}.view`));
    }
    function permissionControl(group: PermissionGroup, permission: PermissionGroup["permissions"][number]) {
        if (permission.key === "staff.create")
            return <span className="text-xs text-muted-foreground">{t("Только владелец")}</span>;
        const permitted = effective(permission.key);
        const needsView = !permission.key.endsWith(".view") && !effective(`${group.section}.view`);
        return <div className="flex min-w-0 items-center gap-2">
      <AdminSelect aria-label={`${t(group.label)}: ${t(permission.label)}`} className="min-w-0 text-xs" disabled={busy} value={overrides[permission.key] || "inherit"} options={overrideOptions} onValueChange={value => setOverrides(previous => {
                const next = { ...previous };
                if (value === "inherit")
                    delete next[permission.key];
                else
                    next[permission.key] = value as PermissionOverride;
                return next;
            })}/>
      <span title={permitted ? t("Разрешено") : needsView ? t("Недоступно без просмотра раздела") : t("Запрещено")} className="shrink-0">
        {permitted ? <Check className="size-4 text-emerald-600" aria-hidden="true"/> : <Minus className="size-4 text-muted-foreground" aria-hidden="true"/>}
        <span className="sr-only">{permitted ? t("Разрешено") : needsView ? t("Недоступно без просмотра раздела") : t("Запрещено")}</span>
      </span>
    </div>;
    }
    if (!canReadStaff)
        return <p className="text-sm text-muted-foreground">{t("Нет доступа к персоналу.")}</p>;
    const overrideCount = Object.values(overrides).filter(value => value !== "inherit").length;
    const dialogOpen = (creating && owner && can("staff.create")) || (!!editing && can("staff.edit") && (owner || editing.role !== "OWNER"));
    return <div className="space-y-6">
    <Tabs value={canReadAudit ? section : "staff"} onValueChange={value => setSection(String(value))} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList><TabsTrigger value="staff"><UserRound />{t("Сотрудники")}</TabsTrigger>{canReadAudit && <TabsTrigger value="audit"><History />{t("Журнал действий")}</TabsTrigger>}</TabsList>
        {owner && can("staff.create") && <Button disabled={busy || !!togglingId} onClick={() => open(null)}><Plus />{t("Добавить сотрудника")}</Button>}
      </div>
      <TabsContent value="staff" className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("Всего сотрудников:")}{total}{t(". У каждого \u2014 личная учётная запись и права доступа.")}</p>
        {error && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}<Button variant="outline" disabled={loading} onClick={() => void load()}>{t("Повторить")}</Button></div>}
        <Card className="gap-0 overflow-hidden py-0">
          <Table aria-label={t("Сотрудники")} aria-busy={loading}>
            <TableHeader><TableRow><TableHead>{t("Сотрудник")}</TableHead><TableHead className="hidden sm:table-cell">{t("Роль")}</TableHead><TableHead>{t("Статус")}</TableHead><TableHead className="w-12"><span className="sr-only">{t("Действия")}</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map(item => <TableRow key={item.id}>
                <TableCell><div className="flex items-center gap-3"><span className="hidden size-9 shrink-0 place-items-center rounded-full bg-muted sm:grid"><UserRound className="size-4"/></span><div className="min-w-0"><span className="block max-w-40 truncate font-medium sm:max-w-80" title={item.name}>{item.name}{item.id === me?.id && <span className="ml-1 text-xs font-normal text-muted-foreground">{t("(вы)")}</span>}</span><span className="block max-w-40 truncate text-xs text-muted-foreground sm:max-w-80" title={item.login}>{item.login}</span><span className="mt-1 block text-xs text-muted-foreground sm:hidden">{roleNames[item.role]}</span></div></div></TableCell>
                <TableCell className="hidden sm:table-cell">{roleNames[item.role]}</TableCell>
                <TableCell><Badge variant={item.active ? "secondary" : "outline"}>{item.active ? t("Активен") : t("Отключён")}</Badge></TableCell>
                <TableCell>{can("staff.edit") && (owner || item.role !== "OWNER") && <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={t("Действия: {0}", { "0": item.name })} disabled={busy || !!togglingId}/>}>
                    {togglingId === item.id ? <LoaderCircle className="size-4 animate-spin"/> : <Ellipsis className="size-4"/>}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => open(item)}><Pencil />{t("Редактировать")}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant={item.active ? "destructive" : "default"} onClick={() => void toggle(item)}>{item.active ? <UserRoundX /> : <UserRoundCheck />}{item.active ? t("Отключить доступ") : t("Включить доступ")}</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>}</TableCell>
              </TableRow>)}
              {!items.length && <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">{loading ? t("Загружаем сотрудников\u2026") : error ? t("Список недоступен") : t("Сотрудники не найдены")}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <ListPagination total={total} page={offset / pageSize} pageSize={pageSize} loading={loading || !!togglingId} onPageChange={page => setOffset(page * pageSize)}/>
        </Card>
      </TabsContent>
      {canReadAudit && <TabsContent value="audit"><Card><CardHeader><CardTitle>{t("Последние действия")}</CardTitle><CardDescription>{t("Последние 20 событий. Время указано по Бишкеку.")}</CardDescription></CardHeader><CardContent>
        {auditLoading ? <p className="py-6 text-sm text-muted-foreground" role="status">{t("Загружаем журнал\u2026")}</p> : auditError ? <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-destructive" role="alert">{auditError}<Button variant="outline" onClick={() => setAuditRevision(value => value + 1)}>{t("Повторить")}</Button></div> : audit.length ? <ul className="divide-y">{audit.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-sm"><div><span className="font-medium">{item.actorName || t("Сотрудник")}</span><p className="text-muted-foreground">{auditActions[item.action] || t("Изменил рабочие данные")}</p></div><time dateTime={item.createdAt} className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString(adminLocale(), { timeZone: "Asia/Bishkek" })}</time></li>)}</ul> : <p className="py-6 text-sm text-muted-foreground">{t("Действий пока нет.")}</p>}
      </CardContent></Card></TabsContent>}
    </Tabs>

    <Dialog open={dialogOpen} disablePointerDismissal={busy} onOpenChange={next => { if (!next)
        close(); }}>
      <DialogContent showCloseButton={false} className={`flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 ${owner && editorTab === "access" ? "sm:max-w-6xl" : "sm:max-w-2xl"}`}>
        <DialogHeader className="relative shrink-0 border-b p-4 pr-14 sm:p-6 sm:pr-14"><DialogTitle>{creating ? t("Новый сотрудник") : editing?.name}</DialogTitle><DialogDescription>{owner ? t("Личная учётная запись и доступ к рабочим разделам.") : t("Основные данные сотрудника. Роль и права меняет владелец.")}</DialogDescription><Button type="button" variant="ghost" size="icon-sm" className="absolute right-3 top-3" aria-label={t("Закрыть карточку сотрудника")} disabled={busy} onClick={close}><X /></Button></DialogHeader>
        <form noValidate onSubmit={save} className="flex min-h-0 flex-1 flex-col" aria-busy={busy}>
          <Tabs value={owner ? editorTab : "data"} onValueChange={value => setEditorTab(String(value))} className="min-h-0 flex-1 gap-0">
            {owner && <div className="shrink-0 px-4 pt-4 sm:px-6"><TabsList><TabsTrigger value="data" disabled={busy}><UserRound />{t("Данные")}</TabsTrigger><TabsTrigger value="access" disabled={busy}><ShieldCheck />{t("Права доступа")}</TabsTrigger></TabsList></div>}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
              <TabsContent value="data" className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2"><Label htmlFor="staff-name">{t("Имя")}</Label><Input id="staff-name" value={name} disabled={busy} onChange={event => setName(event.target.value)} required maxLength={120} autoComplete="name"/></div>
                  <div className="grid gap-2"><Label htmlFor="staff-login">{t("Логин")}</Label><Input id="staff-login" value={login} disabled={busy || !creating} onChange={event => setLogin(event.target.value)} required maxLength={100} autoComplete="off"/>{!creating && <p className="text-xs text-muted-foreground">{t("Логин нельзя изменить после создания.")}</p>}</div>
                  {(creating || owner && editing?.id !== me?.id) && <div className="grid gap-2 sm:col-span-2"><Label htmlFor="staff-password">{creating ? t("Пароль") : t("Новый пароль")}</Label><Input id="staff-password" type="password" autoComplete="new-password" disabled={busy} required={creating} minLength={12} maxLength={256} value={password} onChange={event => setPassword(event.target.value)}/><p className="text-xs text-muted-foreground">{creating ? t("Не менее 12 символов.") : t("Оставьте пустым, чтобы сохранить текущий пароль. Новый пароль завершит активные сеансы сотрудника.")}</p></div>}
                  {editing?.id === me?.id && <p className="text-xs text-muted-foreground sm:col-span-2">{t("Свой пароль можно изменить в \u00ABМой профиль\u00BB.")}</p>}
                  <div className="grid gap-2 sm:col-span-2"><Label htmlFor="staff-role">{t("Роль")}</Label><AdminSelect id="staff-role" value={role} options={roleOptions} disabled={busy || !owner} onValueChange={value => setRole(value as Staff["role"])}/><p className="text-xs text-muted-foreground">{role === "OWNER" ? t("Полный доступ, управление сотрудниками и их правами.") : role === "ADMIN" ? t("Все рабочие разделы, кроме создания сотрудников и изменения прав. Можно задать исключения.") : t("Работа с заказами и клиентами. Остальные разделы доступны по индивидуальным разрешениям.")}</p></div>
                </div>
                {editing && !editing.active && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{t("Сотрудник отключён и не может войти. Включить доступ можно через меню в списке сотрудников.")}</p>}
              </TabsContent>
              {owner && <TabsContent value="access" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium">{roleNames[role]}</h3><p className="mt-1 text-xs text-muted-foreground">{role === "OWNER" ? t("Владелец всегда имеет полный доступ.") : t("Индивидуальных настроек: {0}. Они сохраняются при смене роли.", { "0": overrideCount })}</p></div><Button type="button" variant="outline" size="sm" disabled={busy || role === "OWNER" || !overrideCount} onClick={() => setOverrides({})}>{t("Сбросить к правам роли")}</Button></div>
                {role === "OWNER" ? <p className="rounded-lg bg-muted p-4 text-sm">{t("Права владельца нельзя ограничить. Последнего активного владельца нельзя отключить или понизить.")}</p> : <>
                  <p className="text-xs leading-relaxed text-muted-foreground">{t("Галочка показывает итоговый доступ после сохранения. Без просмотра раздела остальные действия в нём недоступны. Создавать сотрудников и менять права может только владелец.")}</p>
                  {editing && !editing.active && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{t("Эти права вступят в силу после включения учётной записи.")}</p>}
                  <div className="space-y-3 lg:hidden">{catalog.map(group => <section key={group.section} className="rounded-lg border p-3"><h4 className="mb-3 font-medium">{t(group.label)}</h4><div className="space-y-3">{group.permissions.map(permission => <div key={permission.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)] items-center gap-3"><span className="text-xs leading-snug">{t(permission.label)}</span>{permissionControl(group, permission)}</div>)}</div></section>)}</div>
                  <div className="hidden overflow-x-auto rounded-lg border lg:block"><Table className="min-w-[1060px] table-fixed"><TableHeader><TableRow><TableHead className="w-36">{t("Раздел")}</TableHead>{permissionActions.map(action => <TableHead key={action.value} className="whitespace-normal text-xs">{action.label}</TableHead>)}</TableRow></TableHeader><TableBody>{catalog.map(group => <TableRow key={group.section}><TableCell className="whitespace-normal text-xs font-medium">{t(group.label)}</TableCell>{permissionActions.map(action => { const permission = group.permissions.find(item => item.key === `${group.section}.${action.value}`); return <TableCell key={action.value} className="px-2">{permission ? permissionControl(group, permission) : <span className="text-muted-foreground">—</span>}</TableCell>; })}</TableRow>)}</TableBody></Table></div>
                </>}
              </TabsContent>}
            </div>
          </Tabs>
          <div className="sticky bottom-0 shrink-0 space-y-3 border-t bg-background p-4 sm:px-6">
            {formError && <p className="text-sm text-destructive" role="alert">{formError}</p>}
            <div className="flex items-center justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={close}>{t("Отменить")}</Button><Button type="submit" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin"/>}{busy ? t("Сохраняем\u2026") : creating ? t("Создать сотрудника") : t("Сохранить")}</Button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
