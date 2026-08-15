"use client";

import {
  StatisticsDashboard,
  type StatisticsData,
  type StatisticsPeriod,
} from "./StatisticsDashboard";

type Props = {
  regionName: string;
  data: StatisticsData;
  period: StatisticsPeriod;
  loading: boolean;
  onPeriodChange: (period: StatisticsPeriod) => void;
};

export function AdminOverview({
  regionName,
  data,
  period,
  loading,
  onPeriodChange,
}: Props) {
  return <div className="admin-crm-page admin-overview-page">
    <header className="admin-page-command">
      <span><small>Филиал: {regionName}</small></span>
      <span className="admin-page-command-total">{data.orders.toLocaleString("ru-RU")} завершено</span>
    </header>
    <StatisticsDashboard data={data} period={period} loading={loading} onPeriodChange={onPeriodChange} />
  </div>;
}
