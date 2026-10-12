"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Clock3, Wallet, CircleCheck, ArrowUpRight, RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { useAdminAccess } from "./admin-access";
import type { AdminOrder, AdminRequest, AdminSection, OrdersResponse } from "./admin-types";

type Overview = { orders: { newOrders: number; activeOrders: number } | null; analytics: { revenue: number; completed: number; average: number } | null };
type DailyReport = { days: { label: string; revenue: number; count: number }[] };
const statusNames: Record<string, string> = { new: "Новый", confirmed: "Принят", preparing: "Готовится", ready: "Готов", delivering: "В пути", completed: "Завершён", cancelled: "Отменён" };
const money = (value: number) => `${value.toLocaleString("ru-RU")} сом`;
const dateLabel = (value: string) => new Date(value).toLocaleString("ru-RU", { timeZone: "Asia/Bishkek", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function OverviewView({ request, region, refresh, onSelect, onOpenOrder }: {
  request: AdminRequest; region: string; refresh: number; onSelect: (section: AdminSection) => void; onOpenOrder: (id: string) => void;
}) {
  const { can } = useAdminAccess();
  const [data, setData] = useState<Overview | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const ordersAllowed = can("orders.view");
  const analyticsAllowed = can("analytics.view");
  useEffect(() => {
    let active = true;
    const task = setTimeout(() => {
      setLoading(true);
      const format = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bishkek" });
      const to = format.format(new Date());
      const from = format.format(new Date(Date.now() - 6 * 86400000));
      void Promise.allSettled([
        request<Overview>(`/admin/overview?region=${encodeURIComponent(region)}`),
        ordersAllowed ? request<OrdersResponse>(`/admin/orders?regionSlug=${encodeURIComponent(region)}&limit=5&offset=0`) : Promise.resolve(null),
        analyticsAllowed ? request<DailyReport>(`/admin/reports?region=${encodeURIComponent(region)}&from=${from}&to=${to}`) : Promise.resolve(null),
      ]).then(([summary, recent, sales]) => {
        if (!active) return;
        setData(summary.status === "fulfilled" ? summary.value : null);
        setOrders(recent.status === "fulfilled" ? recent.value?.items || [] : []);
        setReport(sales.status === "fulfilled" ? sales.value : null);
        const failure = [summary, recent, sales].find(result => result.status === "rejected");
        setError(failure?.status === "rejected" ? failure.reason instanceof Error ? failure.reason.message : "Не удалось обновить обзор" : "");
        setLoading(false);
      });
    }, 0);
    return () => { active = false; clearTimeout(task); };
  }, [request, region, refresh, retry, ordersAllowed, analyticsAllowed]);

  const metrics = [
    ...(data?.orders ? [
      { label: "Новые заказы", value: data.orders.newOrders, icon: ShoppingBag, hint: "Ожидают обработки" },
      { label: "В работе", value: data.orders.activeOrders, icon: Clock3, hint: "Все активные заказы" },
    ] : []),
    ...(data?.analytics ? [
      { label: "Выручка сегодня", value: money(data.analytics.revenue), icon: Wallet, hint: "Завершённые заказы" },
      { label: "Завершено сегодня", value: data.analytics.completed, icon: CircleCheck, hint: "По времени завершения" },
    ] : []),
  ];
  return <div className="flex flex-col gap-4 md:gap-6" aria-busy={loading}>
    {error && <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">{error}<Button variant="outline" size="sm" onClick={() => setRetry(previous => previous + 1)}>Повторить</Button></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
      {metrics.map(metric => <Card key={metric.label} className="@container/card">
        <CardHeader><CardDescription>{metric.label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{metric.value}</CardTitle><CardAction><Badge variant="outline"><metric.icon className="size-4" aria-hidden="true" /></Badge></CardAction></CardHeader>
        <CardFooter className="border-t-0 bg-transparent pt-0 text-sm text-muted-foreground">{metric.hint}</CardFooter>
      </Card>)}
      {loading && !data && Array.from({ length: 4 }, (_, index) => <Card key={index}><CardHeader><Skeleton className="h-4 w-24" /><Skeleton className="mt-3 h-8 w-28" /></CardHeader><CardFooter className="border-t-0 bg-transparent"><Skeleton className="h-4 w-36" /></CardFooter></Card>)}
    </div>
    {analyticsAllowed && <Card>
      <CardHeader><CardTitle>Выручка за неделю</CardTitle><CardDescription>Завершённые заказы · Бишкек, UTC+6</CardDescription><CardAction><Button variant="outline" size="sm" onClick={() => onSelect("analytics")}>Аналитика<ArrowUpRight data-icon="inline-end" /></Button></CardAction></CardHeader>
      <CardContent><div className="h-56 min-w-0" role="img" aria-label="Выручка за последние семь дней">{report ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={report.days} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}><defs><linearGradient id="overview-sales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tickFormatter={value => String(value).slice(5)} tickLine={false} axisLine={false} fontSize={12} tick={{fill:"var(--muted-foreground)"}} /><YAxis width={52} tickLine={false} axisLine={false} fontSize={12} tick={{fill:"var(--muted-foreground)"}} /><Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 8 }} formatter={value => [money(Number(value)), "Выручка"]} /><Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={1.5} fill="url(#overview-sales)" /></AreaChart></ResponsiveContainer> : loading ? <Skeleton className="h-full w-full" /> : <p className="grid h-full place-items-center text-sm text-muted-foreground">Не удалось загрузить график.</p>}</div></CardContent>
    </Card>}
    {ordersAllowed && <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="py-4"><CardTitle>Последние заказы</CardTitle><CardAction><div className="flex gap-2"><Button variant="ghost" size="icon" disabled={loading} aria-label="Обновить обзор" title="Обновить обзор" onClick={() => setRetry(previous => previous + 1)}><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /></Button><Button variant="outline" size="sm" onClick={() => onSelect("orders")}>Все заказы<ArrowUpRight data-icon="inline-end" /></Button></div></CardAction></CardHeader>
      <div className="border-t"><Table><TableHeader className="bg-muted/50"><TableRow><TableHead className="pl-4">Заказ</TableHead><TableHead>Клиент</TableHead><TableHead>Статус</TableHead><TableHead className="pr-4 text-right">Сумма</TableHead></TableRow></TableHeader><TableBody>{orders.map(order => <TableRow key={order.id}><TableCell className="pl-4"><Button variant="link" className="h-auto p-0" onClick={() => onOpenOrder(order.id)}>№{order.orderNumber}</Button><span className="mt-0.5 block text-xs text-muted-foreground">{dateLabel(order.createdAt)}</span></TableCell><TableCell className="max-w-48 truncate">{order.customerName || "Без имени"}</TableCell><TableCell><Badge variant="outline">{statusNames[order.status]}</Badge></TableCell><TableCell className="pr-4 text-right tabular-nums">{money(order.total)}</TableCell></TableRow>)}{!orders.length && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">{loading ? "Загружаем заказы…" : "Заказов пока нет."}</TableCell></TableRow>}</TableBody></Table></div>
    </Card>}
  </div>;
}
