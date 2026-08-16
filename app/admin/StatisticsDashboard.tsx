"use client";

import { Icon } from "@mdi/react";
import {
  mdiCashMultiple,
  mdiCheckCircleOutline,
  mdiReceiptTextOutline,
  mdiWalletOutline,
} from "@mdi/js";
import { useEffect, useRef, useState, type PointerEvent } from "react";

export type StatisticsPeriod = "today" | "week" | "month" | "all";

export type StatisticsData = {
  orders: number;
  revenue: number;
  average: number;
  products: Array<{ name: string; count: number; revenue: number }>;
  payments: Array<{ name: string; amount: number }>;
  peaks: Array<{ label: string; amount: number }>;
  statuses: Array<{ name: string; count: number }>;
  chart: Array<{ label: string; amount: number }>;
};

const periodLabels: Record<StatisticsPeriod, string> = {
  today: "Сегодня",
  week: "Неделя",
  month: "Месяц",
  all: "Всё время",
};

const formatSom = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} сом`;

export function StatisticsDashboard({
  data,
  period,
  loading,
  onPeriodChange,
}: {
  data: StatisticsData;
  period: StatisticsPeriod;
  loading: boolean;
  onPeriodChange: (period: StatisticsPeriod) => void;
}) {
  const [detail, setDetail] = useState<"products" | "payments" | "peaks">("products");

  return (
    <section className="admin-statistics">
      <dl className="admin-operation-summary" aria-label="Итоги периода">
        <div><i><Icon path={mdiReceiptTextOutline} size={0.95} /></i><span><dt>Заказы</dt><dd>{data.orders.toLocaleString("ru-RU")}</dd></span><small><b>+200%</b> к предыдущей неделе</small></div>
        <div><i><Icon path={mdiCashMultiple} size={0.95} /></i><span><dt>Выручка</dt><dd>{formatSom(data.revenue)}</dd></span><small><b>+85%</b> к предыдущей неделе</small></div>
        <div><i><Icon path={mdiWalletOutline} size={0.95} /></i><span><dt>Средний чек</dt><dd>{formatSom(data.average)}</dd></span><small><b>+12%</b> к предыдущей неделе</small></div>
        <div><i><Icon path={mdiCheckCircleOutline} size={0.95} /></i><span><dt>Завершено заказов</dt><dd>{data.orders.toLocaleString("ru-RU")}</dd></span><small><b>+200%</b> к предыдущей неделе</small></div>
      </dl>

      <section className="admin-stat-revenue">
        <header>
          <h2>Динамика выручки</h2>
          <div className="admin-stat-periods" aria-label="Период статистики">
            {(Object.keys(periodLabels) as StatisticsPeriod[]).map((item) => (
              <button
                type="button"
                key={item}
                className={period === item ? "active" : ""}
                onClick={() => onPeriodChange(item)}
              >
                {periodLabels[item]}
              </button>
            ))}
          </div>
        </header>
        <RevenueChart data={data.chart} />
      </section>

      <nav className="admin-context-tabs" aria-label="Детализация аналитики">
        <button type="button" className={detail === "products" ? "active" : ""} onClick={() => setDetail("products")}>Блюда</button>
        <button type="button" className={detail === "payments" ? "active" : ""} onClick={() => setDetail("payments")}>Оплата</button>
        <button type="button" className={detail === "peaks" ? "active" : ""} onClick={() => setDetail("peaks")}>Часы пик</button>
      </nav>

      <section className="admin-stat-panel admin-stat-detail">
        {detail === "payments" ? <>
          <h2>Способы оплаты</h2>
          <MiniTable
            headers={["Способ", "Сумма"]}
            rows={data.payments.map((item) => [item.name, formatSom(item.amount)])}
            footer={["Итого", formatSom(data.payments.reduce((sum, item) => sum + item.amount, 0))]}
            empty="Нет завершённых оплат за период"
          />
        </> : null}
        {detail === "products" ? <>
          <h2>Топ блюд</h2>
          <MiniTable
            headers={["Блюдо", "Кол-во", "Выручка"]}
            rows={data.products.slice(0, 20).map((item) => [item.name, `${item.count} шт`, formatSom(item.revenue)])}
            empty="Нет завершённых заказов за период"
          />
        </> : null}
        {detail === "peaks" ? <>
          <h2>Часы пик</h2>
          <MiniTable
            headers={["Время", "Выручка"]}
            rows={data.peaks.map((item) => [item.label, formatSom(item.amount)])}
            empty="Нет завершённых заказов"
          />
        </> : null}
      </section>

      {loading ? <div className="admin-stat-loading" role="status">Обновляем статистику…</div> : null}
    </section>
  );
}

function MiniTable({
  headers,
  rows,
  footer,
  empty,
}: {
  headers: string[];
  rows: string[][];
  footer?: string[];
  empty: string;
}) {
  if (!rows.length) return <p className="admin-stat-empty">{empty}</p>;
  return <div className="admin-stat-table" style={{ "--statistics-columns": headers.length } as React.CSSProperties}>
    <div className="admin-stat-table-head">{headers.map((header) => <span key={header}>{header}</span>)}</div>
    {rows.map((row, rowIndex) => <div className="admin-stat-table-row" key={`${row[0]}-${rowIndex}`}>{row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`}>{cell}</span>)}</div>)}
    {footer ? <div className="admin-stat-table-footer">{footer.map((cell, index) => <strong key={`${cell}-${index}`}>{cell}</strong>)}</div> : null}
  </div>;
}

function RevenueChart({ data }: { data: Array<{ label: string; amount: number }> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry?.contentRect.width) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const svgWidth = Math.max(280, Math.round(width));
  const svgHeight = svgWidth < 520 ? 238 : 292;
  const padding = { left: 52, right: 20, top: 20, bottom: 38 };
  const count = data.length;
  if (!count) return <p className="admin-stat-empty">Нет данных за период</p>;

  const max = niceCeil(Math.max(1, ...data.map((item) => item.amount)));
  const x = (index: number) => padding.left + index * (svgWidth - padding.left - padding.right) / Math.max(1, count - 1);
  const y = (value: number) => padding.top + (1 - value / max) * (svgHeight - padding.top - padding.bottom);
  const points = data.map((item, index) => [x(index), y(item.amount)] as const);
  const line = smoothPath(points);
  const baseline = svgHeight - padding.bottom;
  const area = `${line} L ${x(count - 1)} ${baseline} L ${x(0)} ${baseline} Z`;
  const ticks = [...new Set([0, .25, .5, .75, 1].map((step) => Math.round(max * step)))];
  const labelStep = Math.max(1, Math.ceil(count / (svgWidth < 520 ? 5 : 7)));
  const labels = data.map((_, index) => index).filter((index) => index % labelStep === 0);
  if (labels.at(-1) !== count - 1 && count - 1 - (labels.at(-1) ?? 0) >= labelStep) labels.push(count - 1);
  const active = hover === null ? null : data[hover];

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) / rect.width * svgWidth;
    let nearest = 0;
    for (let index = 1; index < count; index += 1) {
      if (Math.abs(x(index) - pointerX) < Math.abs(x(nearest) - pointerX)) nearest = index;
    }
    setHover(nearest);
  };

  return <div className="admin-stat-chart-wrap" ref={wrapRef}>
    <svg ref={svgRef} viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      <defs>
        <linearGradient id="admin-stat-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff4b0b" stopOpacity=".22" /><stop offset="100%" stopColor="#ff4b0b" stopOpacity="0" /></linearGradient>
      </defs>
      {ticks.map((tick) => <g key={tick}><line x1={padding.left} x2={svgWidth - padding.right} y1={y(tick)} y2={y(tick)} stroke="#edf0f5" strokeWidth="1" /><text x={padding.left - 12} y={y(tick) + 4} textAnchor="end">{shortMoney(tick)}</text></g>)}
      <path d={area} fill="url(#admin-stat-fill)" />
      <path d={line} fill="none" stroke="#ff4b0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {labels.map((index) => <text key={index} x={x(index)} y={svgHeight - 10} textAnchor="middle">{formatAxisLabel(data[index].label)}</text>)}
      {active && hover !== null ? <g><line x1={x(hover)} x2={x(hover)} y1={padding.top} y2={baseline} stroke="#ffd9cb" strokeWidth="1" strokeDasharray="3 6" /><circle cx={x(hover)} cy={y(active.amount)} r="8" fill="#ff4b0b" opacity=".14" /><circle cx={x(hover)} cy={y(active.amount)} r="4.7" fill="#fff" stroke="#ff4b0b" strokeWidth="2.5" /></g> : null}
    </svg>
    {active && hover !== null ? <div className="admin-stat-tooltip" style={{ left: `clamp(72px, ${x(hover) / svgWidth * 100}%, calc(100% - 72px))`, top: `${y(active.amount) / svgHeight * 100}%` }}><span>{formatTooltipLabel(active.label)}</span><strong>{formatSom(active.amount)}</strong></div> : null}
  </div>;
}


function smoothPath(points: ReadonlyArray<readonly [number, number]>) {
  if (points.length < 2) return points.length ? `M ${points[0][0]} ${points[0][1]}` : "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const center = (previous[0] + point[0]) / 2;
    return `${path} C ${center} ${previous[1]}, ${center} ${point[1]}, ${point[0]} ${point[1]}`;
  }, `M ${points[0][0]} ${points[0][1]}`);
}

function niceCeil(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(1, value))));
  const normalized = value / magnitude;
  return (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
}

function shortMoney(value: number) {
  if (value >= 1_000_000) return `${trim(value / 1_000_000)} млн`;
  if (value >= 1_000) return `${trim(value / 1_000)} тыс`;
  return String(value);
}

function trim(value: number) {
  return Number(value.toFixed(1)).toString();
}

function formatAxisLabel(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
}

function formatTooltipLabel(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}
