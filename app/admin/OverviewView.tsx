"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Clock3, Wallet, CircleCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import type { AdminRequest, AdminSection } from "./admin-types";

type Overview = {
  orders: { newOrders: number; activeOrders: number } | null;
  analytics: { revenue: number; completed: number; average: number } | null;
};

export function OverviewView({ request, region, refresh }: {
  request: AdminRequest; region: string; refresh: number; onSelect: (section: AdminSection) => void;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void request<Overview>(`/admin/overview?region=${encodeURIComponent(region)}`)
      .then(value => { if (active) { setData(value); setError(""); } })
      .catch(error => { if (active) { setError(error instanceof Error ? error.message : "Не удалось загрузить обзор"); setData(null); } });
    return () => { active = false; };
  }, [request, region, refresh]);

  const metrics = [
    ...(data?.orders ? [
      { label: "Новые заказы", value: data.orders.newOrders, icon: ShoppingBag },
      { label: "В работе", value: data.orders.activeOrders, icon: Clock3 },
    ] : []),
    ...(data?.analytics ? [
      { label: "Выручка сегодня", value: `${data.analytics.revenue.toLocaleString("ru-RU")} сом`, icon: Wallet },
      { label: "Завершено сегодня", value: data.analytics.completed, icon: CircleCheck },
    ] : []),
  ];

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(metric => <Card key={metric.label}>
        <CardHeader className="flex items-center justify-between">
          <CardDescription>{metric.label}</CardDescription>
          <metric.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent><div className="text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</div></CardContent>
      </Card>)}
      {!data && !error && <Card className="sm:col-span-2 xl:col-span-4"><CardContent role="status">Загружаем показатели…</CardContent></Card>}
    </div>
  </div>;
}
