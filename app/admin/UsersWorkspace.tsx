"use client";

import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import type {
  AdminRequest,
  Customer,
  CustomerDetail,
  OrderStatus,
} from "./admin-types";

type UsersWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

const inputClass = "w-full";

const orderLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Bishkek",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function UsersWorkspace({ region, request, onNotice }: UsersWorkspaceProps) {
  const [users, setUsers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detail, setDetail] = useState<(CustomerDetail & {profile?:{name:string;notes:string};total?:number}) | null>(null);
  const { can } = useAdminAccess();
  const [profileEditor, setProfileEditor, closeProfileEditor] = useDraftEditor<{name:string;notes:string}>();
  const [profileSaving, setProfileSaving] = useState(false);
  const [detailPage, setDetailPage] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const listSequence = useRef(0);
  const detailSequence = useRef(0);

  const loadUsers = useCallback(async () => {
    const sequence = ++listSequence.current;
    setListLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ region, search, limit: "25", offset: String(page * 25) });
      const result = await request<{ items: Customer[]; total: number }>(`/admin/customers?${query}`);
      if (sequence !== listSequence.current) return;
      setUsers(result.items);
      setTotal(result.total);
    } catch (loadError) {
      if (sequence !== listSequence.current) return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить пользователей");
    } finally {
      if (sequence === listSequence.current) setListLoading(false);
    }
  }, [region, request, search, page]);

  const loadDetail = useCallback(async (phone: string) => {
    const sequence = ++detailSequence.current;
    setDetailLoading(true);
    setError("");
    try {
      const result = await request<CustomerDetail & {profile?:{name:string;notes:string};total?:number}>(`/admin/customers/${encodeURIComponent(phone)}?${new URLSearchParams({region,limit:"25",offset:String(detailPage * 25)})}`);
      if (sequence !== detailSequence.current) return;
      setDetail(result);
    } catch (loadError) {
      if (sequence !== detailSequence.current) return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить карточку пользователя");
    } finally {
      if (sequence === detailSequence.current) setDetailLoading(false);
    }
  }, [region, request, detailPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchDraft.trim());
  };

  useEffect(() => {
    if (searchDraft.trim() === search) return;
    const timer = window.setTimeout(() => { setPage(0); setSearch(searchDraft.trim()); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, search]);

  const openCustomer = (phone: string) => {
    setSelectedPhone(phone);
    setDetail(null);
    setDetailPage(0);
  };

  const closeCustomer = () => {
    if (profileSaving || !closeProfileEditor()) return;
    detailSequence.current += 1;
    setDetailPage(0);
    setSelectedPhone(null);
    setDetail(null);
    setError("");
  };

  useEffect(() => {
    if (!selectedPhone) return;
    const timer = window.setTimeout(() => void loadDetail(selectedPhone), 0);
    return () => window.clearTimeout(timer);
  }, [selectedPhone, loadDetail]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileEditor || !selectedPhone || profileSaving || !can("customers.edit")) return;
    setProfileSaving(true);
    try {
      await request(`/admin/customers/${encodeURIComponent(selectedPhone)}`, {method:"PATCH",body:JSON.stringify({name:profileEditor.name.trim(),notes:profileEditor.notes.trim()})});
      setProfileEditor(null);
      onNotice("Карточка клиента сохранена", "success");
      await loadDetail(selectedPhone);
      await loadUsers();
    } catch (error) { onNotice(error instanceof Error ? error.message : "Не удалось сохранить карточку клиента", "error"); }
    finally { setProfileSaving(false); }
  };

  if (selectedPhone) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" type="button" className="self-start" onClick={closeCustomer}>
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Клиенты
          </Button>
          <Button variant="outline" type="button"  onClick={() => void loadDetail(selectedPhone)} disabled={detailLoading}>
            <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
            {detailLoading ? "Обновляем…" : "Обновить"}
          </Button>
        </div>

        {error ? (
          <Card className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive" role="alert">
            <p>{error}</p>
            <Button variant="ghost" type="button" className="mt-3 font-semibold underline" onClick={() => void loadDetail(selectedPhone)}>Повторить</Button>
          </Card>
        ) : null}

        {!error && detailLoading && !detail ? <Card className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Загружаем карточку пользователя…</Card> : null}

        {detail ? <>
          <Card className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Карточка клиента</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{detail.profile?.name || detail.customerName || "Без имени"}</h2>
                <a href={`tel:${detail.phone}`} className="mt-2 inline-block text-sm font-medium text-primary">Позвонить: {detail.phone}</a>
              </div>
              <div className="grid gap-3"><p className="text-sm text-muted-foreground">Последний заказ: {formatDate(detail.lastOrderAt)}</p>{can("customers.edit") ? <Button variant="outline" onClick={() => setProfileEditor({name:detail.profile?.name || detail.customerName || "",notes:detail.profile?.notes || ""})}>Редактировать</Button> : null}</div>
            </div>
            {detail.profile?.notes ? <div className="mt-5 rounded-lg bg-muted/50 p-4"><h3 className="text-xs font-semibold text-muted-foreground">Заметка сотрудников</h3><p className="mt-2 whitespace-pre-wrap text-sm">{detail.profile.notes}</p></div> : null}
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Всего заказов</dt><dd className="mt-2 text-2xl font-semibold text-foreground">{formatNumber(detail.ordersCount)}</dd><span className="mt-1 block text-xs text-muted-foreground">Завершено: {formatNumber(detail.completedOrders)}</span></div>
              <div className="rounded-xl border border-border bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Сумма покупок</dt><dd className="mt-2 text-2xl font-semibold text-foreground">{formatMoney(detail.revenue)}</dd><span className="mt-1 block text-xs text-muted-foreground">Только завершённые заказы</span></div>
            </dl>
          </Card>

          <Card className="gap-0 overflow-hidden rounded-md border py-0">
            <div className="border-b border-border p-5"><h3 className="font-semibold text-foreground">Все заказы</h3></div>
            {detail.orders.length ? <>
              <div className="hidden overflow-x-auto md:block">
                <Table className="w-full min-w-[760px] text-left text-sm">
                  <TableHeader className="bg-muted/50"><TableRow><TableHead className="px-4 py-3">Заказ</TableHead><TableHead className="px-4 py-3">Дата</TableHead><TableHead className="px-4 py-3">Тип</TableHead><TableHead className="px-4 py-3">Статус</TableHead><TableHead className="px-4 py-3 text-right">Сумма</TableHead></TableRow></TableHeader>
                  <TableBody className="divide-y divide-border">{detail.orders.map((order) => <TableRow key={order.id}><TableCell className="px-4 py-3 font-semibold text-foreground">№{order.orderNumber}</TableCell><TableCell className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</TableCell><TableCell className="px-4 py-3 text-muted-foreground">{order.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}</TableCell><TableCell className="px-4 py-3 text-foreground">{orderLabels[order.status]}</TableCell><TableCell className="px-4 py-3 text-right font-semibold text-foreground">{formatMoney(order.total)}</TableCell></TableRow>)}</TableBody>
                </Table>
              </div>
              <div className="divide-y divide-border md:hidden">{detail.orders.map((order) => <article key={order.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="text-foreground">Заказ №{order.orderNumber}</strong><span className="mt-1 block text-xs text-muted-foreground">{formatDate(order.createdAt)}</span></div><strong className="shrink-0 text-foreground">{formatMoney(order.total)}</strong></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-muted px-2.5 py-1">{orderLabels[order.status]}</span><span className="rounded-full bg-muted px-2.5 py-1">{order.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}</span></div></article>)}</div>
            </> : <p className="p-8 text-center text-sm text-muted-foreground">Заказов пока нет.</p>}
            <ListPagination total={detail.total ?? detail.ordersCount} page={detailPage} loading={detailLoading} onPageChange={setDetailPage} />
          </Card>

        </> : null}
        <EditorDialog open={Boolean(profileEditor)} onClose={() => {if (!profileSaving) closeProfileEditor();}} title="Карточка клиента">{profileEditor ? <form className="grid gap-4 p-4" onSubmit={saveProfile}><fieldset disabled={profileSaving || !can("customers.edit")} className="contents"><Label className="grid gap-2">Имя<Input required maxLength={140} value={profileEditor.name} onChange={(event) => setProfileEditor({...profileEditor,name:event.target.value})} /></Label><Label className="grid gap-2">Заметка<Textarea maxLength={2000} rows={5} value={profileEditor.notes} onChange={(event) => setProfileEditor({...profileEditor,notes:event.target.value})} /></Label><DialogFooter><Button type="button" variant="outline" disabled={profileSaving} onClick={closeProfileEditor}>Отменить</Button><Button type="submit" disabled={profileSaving}>{profileSaving ? "Сохраняем…" : "Сохранить карточку"}</Button></DialogFooter></fieldset></form> : null}</EditorDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeading title="Клиенты" />
      <div className="flex items-center justify-between gap-2">
        <form className="flex min-w-0 flex-1 gap-2 sm:max-w-sm" onSubmit={submitSearch}>
          <Label className="relative min-w-0 flex-1">
            <span className="sr-only">Найти клиента</span>
            <Search className="size-4 shrink-0 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" className={`${inputClass} pl-9`} placeholder="Имя или телефон" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />
          </Label>
        </form>
        <Button variant="outline" type="button" size="icon" aria-label="Обновить клиентов" title="Обновить клиентов" onClick={() => void loadUsers()} disabled={listLoading}><RefreshCw className="size-4 shrink-0" aria-hidden="true" /></Button>
      </div>

      {error ? <Card className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive" role="alert">{error}</Card> : null}
      {!error && listLoading && !users.length ? <Card className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Загружаем пользователей…</Card> : null}

      {!error && users.length ? (
        <Card className="gap-0 overflow-hidden rounded-md border py-0">
          <div className="hidden overflow-x-auto lg:block">
            <Table className="w-full min-w-[760px] text-left text-sm">
              <TableHeader className="bg-muted/50"><TableRow><TableHead className="px-4 py-3">Пользователь</TableHead><TableHead className="px-4 py-3">Заказы</TableHead><TableHead className="px-4 py-3">Сумма покупок</TableHead><TableHead className="px-4 py-3"><span className="sr-only">Действие</span></TableHead></TableRow></TableHeader>
              <TableBody className="divide-y divide-border">{users.map((user) => <TableRow key={user.phone}><TableCell className="px-4 py-3"><strong className="block text-foreground">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-xs text-muted-foreground">{user.phone}</span></TableCell><TableCell className="px-4 py-3 text-foreground"><strong>{formatNumber(user.ordersCount)}</strong><span className="mt-1 block text-xs text-muted-foreground">Завершено: {formatNumber(user.completedOrders)}</span></TableCell><TableCell className="px-4 py-3 font-semibold text-foreground">{formatMoney(user.revenue)}</TableCell><TableCell className="px-4 py-3 text-right"><Button variant="outline" type="button"  onClick={() => openCustomer(user.phone)}>Открыть</Button></TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          <div className="divide-y divide-border lg:hidden">{users.map((user) => <article key={user.phone} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="block text-foreground">{user.customerName || "Без имени"}</strong><span className="mt-1 block text-sm text-muted-foreground">{user.phone}</span></div><strong className="shrink-0 text-sm text-foreground">{formatMoney(user.revenue)}</strong></div><dl className="mt-4 border-t border-border pt-3 text-sm"><div><dt className="text-xs text-muted-foreground">Заказы</dt><dd className="mt-1 font-semibold text-foreground">{formatNumber(user.ordersCount)}</dd></div></dl><Button variant="outline" type="button" className="mt-4 w-full" onClick={() => openCustomer(user.phone)}>Открыть</Button></article>)}</div>
        </Card>
      ) : null}

      {!error && !listLoading && !users.length ? <Card className="rounded-xl border border-border bg-card p-10 text-center"><h2 className="font-semibold text-foreground">Клиенты не найдены</h2><p className="mt-1 text-sm text-muted-foreground">Измените запрос или дождитесь первого заказа.</p></Card> : null}
      <ListPagination total={total} page={page} loading={listLoading} onPageChange={setPage} />
    </div>
  );
}
