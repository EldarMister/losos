"use client";
import { translateAdmin as t, adminLocale } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { useEffect, useState } from "react";
import { Download, TrendingUp, TrendingDown, LoaderCircle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "./ui/button";
import { AdminPeriodControl } from "./AdminPeriodControl";
import { presetPeriod } from "./admin-period";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter } from "./ui/card";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "./ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { useAdminAccess } from "./admin-access";
import type { AdminRequest } from "./admin-types";
type Metric = {
    orders: number;
    completed: number;
    revenue: number;
    average: number;
    cancelled: number;
    newCustomers: number;
    repeatCustomers: number;
};
type Ranking = {
    name: string;
    count: number;
    revenue?: number;
};
type Report = {
    employees?: {
        recordedSince: string | null;
        items: {
            name: string;
            statusChanges: number;
            completions: number;
        }[];
    } | null;
    current: Metric;
    previous: Metric;
    period: {
        from: string;
        to: string;
        previousFrom: string;
        previousTo: string;
    };
    days: {
        label: string;
        revenue: number;
        count: number;
    }[];
    hours: {
        hour: number;
        count: number;
        revenue: number;
    }[];
    statuses: {
        status: string;
        count: number;
    }[];
    products: Ranking[];
    categories: Ranking[];
    modifiers: Ranking[];
    kits: Ranking[];
};
const money = (value: number) => t("{0} сом", { "0": Math.round(value).toLocaleString(adminLocale()) });
const statusNames: Record<string, string> = { get new() {
        return t("Новые");
    }, get confirmed() {
        return t("Подтверждены");
    }, get preparing() {
        return t("Готовятся");
    }, get ready() {
        return t("Готовы");
    }, get delivering() {
        return t("В пути");
    }, get completed() {
        return t("Завершены");
    }, get cancelled() {
        return t("Отменены");
    } };
export function AnalyticsView({ region, request }: {
    region: string;
    request: AdminRequest;
}) {
    useAdminLanguage();
    const { can } = useAdminAccess();
    const [period, setPeriod] = useState(() => presetPeriod("week"));
    const { from, to } = period;
    const [loadedQuery, setLoadedQuery] = useState("");
    const [data, setData] = useState<Report | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    const [exporting, setExporting] = useState(false);
    const query = `region=${encodeURIComponent(region)}&from=${from}&to=${to}`;
    useEffect(() => { let active = true; const timer = setTimeout(() => { setLoading(true); setError(""); void request<Report>(`/admin/reports?${query}`).then(result => { if (active) {
        setData(result);
        setLoadedQuery(query);
    } }).catch(e => { if (active) {
        setError(e instanceof Error ? e.message : t("Не удалось загрузить отчёт"));
        setData(null);
    } }).finally(() => { if (active)
        setLoading(false); }); }, 150); return () => { active = false; clearTimeout(timer); }; }, [query, request, retry]);
    async function exportReport() { setExporting(true); try {
        const value = await request<{
            filename: string;
            csv: string;
        }>(`/admin/reports/export?${query}`);
        const url = URL.createObjectURL(new Blob([value.csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = value.filename;
        link.click();
        URL.revokeObjectURL(url);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : t("Не удалось экспортировать отчёт"));
    }
    finally {
        setExporting(false);
    } }
    const updating = loading || (!error && loadedQuery !== query);
    return <div className="flex flex-col gap-4 md:gap-6" aria-busy={updating}>
 <div className="flex flex-wrap items-end gap-3">
   <div className="w-full sm:w-auto"><AdminPeriodControl value={period} onChange={setPeriod} allowAll={false} maxDays={366}/></div>
   {updating && data && <span className="inline-flex items-center gap-2 self-center text-xs text-muted-foreground" role="status"><LoaderCircle className="size-3 animate-spin"/>{t("Обновляем\u2026")}</span>}
   {can("analytics.export") && <Button className="sm:ml-auto" variant="outline" disabled={exporting || updating || !data} onClick={() => void exportReport()}>{exporting ? <LoaderCircle className="size-4 animate-spin"/> : <Download data-icon="inline-start"/>}{exporting ? t("Подготовка\u2026") : t("Экспорт CSV")}</Button>}
 </div>
 {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}<Button variant="outline" size="sm" onClick={() => setRetry(previous => previous + 1)}>{t("Повторить")}</Button></div>}
 {loading && !data && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Card key={index}><CardHeader><Skeleton className="h-4 w-24"/><Skeleton className="mt-3 h-8 w-32"/></CardHeader><CardContent><Skeleton className="h-4 w-40"/></CardContent></Card>)}</div><Skeleton className="h-80 w-full rounded-xl"/></>}
 {data && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">{([{ key: "orders", label: t("Заказов создано"), hint: t("Все статусы") }, { key: "revenue", label: t("Выручка"), hint: t("Завершённые заказы") }, { key: "average", label: t("Средний чек"), hint: t("По завершённым заказам") }, { key: "completed", label: t("Заказов завершено"), hint: t("По времени завершения") }] as const).map(metric => { const value = data.current[metric.key], previous = data.previous[metric.key]; const change = previous ? Math.round((value - previous) / previous * 100) : null; return <Card key={metric.key} className="@container/card"><CardHeader><CardDescription>{metric.label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{metric.key === "revenue" || metric.key === "average" ? money(value) : value}</CardTitle>{change !== null && <CardAction><Badge variant="outline">{change >= 0 ? <TrendingUp className="size-3"/> : <TrendingDown className="size-3"/>}{change > 0 ? "+" : ""}{change}%</Badge></CardAction>}</CardHeader><CardFooter className="flex-col items-start gap-1 border-t-0 bg-transparent pt-0 text-sm"><span className="font-medium">{metric.hint}</span><span className="text-xs text-muted-foreground">{change === null ? t("В предыдущем периоде \u2014 0") : t("Сравнение с предыдущим периодом")}</span></CardFooter></Card>; })}</div>
 <p className="text-xs text-muted-foreground">{t("Сравнение с")}{data.period.previousFrom} — {data.period.previousTo}{t(". Часовой пояс: Бишкек (UTC+6).")}</p>
 <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]"><Card><CardHeader><CardTitle>{t("Динамика выручки")}</CardTitle><CardDescription>{t("Сумма завершённых заказов по дням")}</CardDescription></CardHeader><CardContent><div className="h-72 min-w-0" role="img" aria-label={t("Выручка по дням")}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.days} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={.35}/><stop offset="100%" stopColor="var(--primary)" stopOpacity={.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="label" tickFormatter={s => String(s).slice(5)} axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "var(--muted-foreground)" }}/><YAxis width={55} axisLine={false} tickLine={false} fontSize={12} tick={{ fill: "var(--muted-foreground)" }}/><Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 10 }} formatter={value => [money(Number(value)), t("Выручка")]}/><Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenue-fill)"/></AreaChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>{t("Статусы заказов")}</CardTitle><CardDescription>{t("Заказы, созданные за выбранный период")}</CardDescription></CardHeader><CardContent className="space-y-4">{data.statuses.length ? data.statuses.map(item => <div key={item.status}><div className="mb-1.5 flex justify-between text-sm"><span>{statusNames[item.status] || t("Другой статус")}</span><strong>{item.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${data.current.orders ? item.count / data.current.orders * 100 : 0}%` }}/></div></div>) : <p className="py-12 text-center text-sm text-muted-foreground">{t("Заказов за этот период нет.")}</p>}</CardContent></Card></div>
 <div className="grid gap-6 lg:grid-cols-3"><Card className="lg:col-span-2"><CardHeader><CardTitle>{t("Завершение заказов по часам")}</CardTitle></CardHeader><CardContent><div className="h-48" role="img" aria-label={t("Завершённые заказы по часам")}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.hours}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--muted-foreground)" }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} fontSize={12} tick={{ fill: "var(--muted-foreground)" }}/><Tooltip contentStyle={{ background: "var(--popover)", borderColor: "var(--border)" }}/><Bar name={t("Заказов")} dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]}/></BarChart></ResponsiveContainer></div></CardContent></Card><Card><CardHeader><CardTitle>{t("Клиенты и отмены")}</CardTitle></CardHeader><CardContent className="space-y-4">{[[t("Новые клиенты"), data.current.newCustomers], [t("Повторные клиенты"), data.current.repeatCustomers], [t("Отменённые заказы"), data.current.cancelled]].map(([label, value]) => <div key={label} className="flex justify-between border-b pb-3 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>)}<p className="text-xs text-muted-foreground">{t("Возвраты и себестоимость не учитываются в текущей системе.")}</p></CardContent></Card></div>
 <Card><CardHeader><CardTitle>{t("Что выбирают гости")}</CardTitle><CardDescription>{t("До 50 самых популярных позиций. Суммы позиций включают доплаты, до общей скидки заказа.")}</CardDescription></CardHeader><CardContent><Tabs defaultValue="products"><TabsList className="mb-4 w-full justify-start overflow-x-auto">{[["products", t("Товары")], ["categories", t("Категории")], ["modifiers", t("Модификаторы")], ["kits", t("Комплектации")]].map(([value, label]) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}</TabsList>{(["products", "categories", "modifiers", "kits"] as const).map(key => <TabsContent key={key} value={key}><Table><TableHeader><TableRow><TableHead>{t("Название")}</TableHead><TableHead className="text-right">{t("Количество")}</TableHead>{key !== "kits" && <TableHead className="text-right">{t("Сумма")}</TableHead>}</TableRow></TableHeader><TableBody>{data[key].map((item, index) => <TableRow key={`${item.name}-${index}`}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right">{item.count}</TableCell>{key !== "kits" && <TableCell className="text-right">{money(item.revenue || 0)}</TableCell>}</TableRow>)}{!data[key].length && <TableRow><TableCell colSpan={3} className="h-28 text-center text-muted-foreground">{t("Нет продаж за этот период.")}</TableCell></TableRow>}</TableBody></Table>{key === "categories" && <p className="mt-4 text-xs text-muted-foreground">{t("Категории сохраняются в новых заказах после обновления. Для старых заказов категория не восстанавливается по текущему каталогу.")}</p>}</TabsContent>)}</Tabs></CardContent></Card>
 {data.employees && <Card><CardHeader><CardTitle>{t("Работа команды")}</CardTitle><CardDescription>{data.employees.recordedSince ? t("Учёт с {0}", { "0": new Date(data.employees.recordedSince).toLocaleDateString(adminLocale(), { timeZone: "Asia/Bishkek" }) }) : t("Учёт действий только начат")}{t(". Только подтверждённые действия сотрудников.")}</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>{t("Сотрудник")}</TableHead><TableHead className="text-right">{t("Смены статуса")}</TableHead><TableHead className="text-right">{t("Завершено вручную")}</TableHead></TableRow></TableHeader><TableBody>{data.employees.items.map((item, index) => <TableRow key={`${item.name}-${index}`}><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.statusChanges}</TableCell><TableCell className="text-right">{item.completions}</TableCell></TableRow>)}{!data.employees.items.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t("Действий за этот период нет.")}</TableCell></TableRow>}</TableBody></Table><p className="mt-3 text-xs text-muted-foreground">{t("Автоматические изменения кухни не приписываются сотрудникам. История до включения журнала не восстанавливается.")}</p></CardContent></Card>}
 <details className="rounded-xl border bg-card p-4 text-sm"><summary className="cursor-pointer font-medium">{t("Как считаются показатели")}</summary><div className="mt-3 space-y-2 text-muted-foreground"><p>{t("Выручка \u2014 сумма итогов завершённых заказов по времени завершения. Итог берётся из сохранённого заказа; отмены не включаются. Для старых записей без времени завершения используется время последнего обновления.")}</p><p>{t("Средний чек \u2014 выручка / число завершённых заказов. Количество созданных заказов и распределение статусов считаются по дате создания, поэтому могут отличаться от числа завершённых.")}</p><p>{t("Новый клиент \u2014 номер телефона с первым заказом в выбранном городе за период. Повторный \u2014 первый заказ был раньше периода. Возвраты и прибыль не рассчитываются: отдельных данных для них нет.")}</p></div></details>
 </>}
 </div>;
}
