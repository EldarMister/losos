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
  return <div className="admin-crm-page admin-overview-page" aria-label={`Аналитика филиала ${regionName}`}>
    <StatisticsDashboard data={data} period={period} loading={loading} onPeriodChange={onPeriodChange} />
  </div>;
}
