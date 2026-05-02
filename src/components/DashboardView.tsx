"use client";
import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  LabelList,
  Label,
  Legend,
} from "recharts";
import { IKUData, Year, SasaranProgram } from "../types";
import { Trophy, TrendingUp, CheckCircle2, BarChart3, AlertCircle, X } from "lucide-react";

interface Props {
  year: Year;
  data: IKUData[];
  availableYears: Year[];
}

type TrendMode = "tahun" | "bulan";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const categoryColors: Record<SasaranProgram, string> = {
  [SasaranProgram.Talenta]: "#17624a",
  [SasaranProgram.Inovasi]: "#ce7b34",
  [SasaranProgram.Kontribusi]: "#197a9a",
  [SasaranProgram.TataKelola]: "#b23b6b",
};

type DistributionRow = {
  category: SasaranProgram;
  ikuNum: string;
  indicatorCount: number;
  indicatorNames: string[];
  indicators: IKUData[];
  color: string;
};

const formatDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const compareAchievement = (item: IKUData, targetYear: Year): boolean | null => {
  const achieved = item.achievements?.[targetYear];
  const target = item.targets[targetYear];
  if (achieved === undefined || achieved === null || achieved === "") return null;
  if (target === undefined || target === null || target === "") return null;

  if (typeof achieved === "number" && typeof target === "number") return achieved >= target;
  if (typeof achieved === "string" && !Number.isNaN(Number(achieved)) && !Number.isNaN(Number(target))) {
    return Number(achieved) >= Number(target);
  }
  if (item.ikuNum === "IKU 11") {
    if (item.indicator.includes("Opini")) return String(achieved).toUpperCase() === "WTP";
    if (item.indicator.includes("SAKIP")) return ["A", "AA"].includes(String(achieved).toUpperCase());
  }
  return String(achieved) === String(target);
};

const calculateAchievementRate = (items: IKUData[], targetYear: Year): number => {
  const scored = items
    .map((item) => compareAchievement(item, targetYear))
    .filter((value) => value !== null) as boolean[];
  if (!scored.length) return 0;
  const achieved = scored.filter(Boolean).length;
  return Math.round((achieved / scored.length) * 100);
};

const toNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/%/g, "").replace(",", ".").trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

const IndicatorListTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const indicatorNames = payload[0]?.payload?.indicatorNames as string[] | undefined;
  if (!indicatorNames?.length) return null;

  return (
    <div className="max-w-sm rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]">
      <div className="space-y-1">
        {indicatorNames.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </div>
    </div>
  );
};

const TargetRealizationTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;

  return (
    <div className="max-w-xs rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--ink)] shadow-[var(--shadow-soft)]">
      <p className="mb-2 font-bold leading-snug">{label}</p>
      <p>
        <span className="font-semibold text-[var(--muted)]">Target:</span> {row?.targetRaw ?? "-"}
      </p>
      <p>
        <span className="font-semibold text-[var(--muted)]">Realisasi:</span> {row?.realizationRaw ?? "-"}
      </p>
    </div>
  );
};

const DashboardView: React.FC<Props> = ({ year, data, availableYears }) => {
  const [trendMode, setTrendMode] = useState<TrendMode>("tahun");
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionRow | null>(null);

  const indicatorsWithData = data.filter((item) => compareAchievement(item, year) !== null);
  const achievedCount = indicatorsWithData.filter((item) => compareAchievement(item, year)).length;
  const performanceRate = indicatorsWithData.length > 0 ? Math.round((achievedCount / indicatorsWithData.length) * 100) : 0;
  const uniqueIkuCount = new Set(data.map((item) => item.ikuNum)).size;

  const summary = [
    { title: "Total IKU", value: String(uniqueIkuCount), icon: Trophy, tone: "bg-emerald-100 text-emerald-800" },
    {
      title: `Indikator Tercapai (${year})`,
      value: indicatorsWithData.length > 0 ? `${achievedCount}/${indicatorsWithData.length}` : "Tidak ada data",
      icon: CheckCircle2,
      tone: achievedCount < indicatorsWithData.length / 2 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Tingkat Keberhasilan",
      value: indicatorsWithData.length > 0 ? `${performanceRate}%` : "N/A",
      icon: TrendingUp,
      tone: performanceRate < 50 ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
    },
    { title: "Tahun Aktif", value: year, icon: BarChart3, tone: "bg-amber-100 text-amber-700" },
  ];

  const distributionByCategory = useMemo(() => {
    return Object.values(SasaranProgram).map((category) => {
      const categoryItems = data.filter((item) => item.category === category);
      const groupedChild = categoryItems
        .reduce<Record<string, IKUData[]>>((acc, item) => {
          acc[item.ikuNum] = [...(acc[item.ikuNum] || []), item];
          return acc;
        }, {});

      const rows = Object.entries(groupedChild)
        .sort((a, b) => {
          const aNum = Number(a[0].replace(/\D/g, ""));
          const bNum = Number(b[0].replace(/\D/g, ""));
          return aNum - bNum;
        })
        .map(([ikuNum, indicators]) => ({
            category,
            ikuNum,
            indicatorCount: indicators.length,
            indicatorNames: indicators.map((item) => item.indicator),
            indicators,
            color: categoryColors[category],
        }));

      return {
        category,
        color: categoryColors[category],
        rows,
      };
    });
  }, [data]);

  const yearlyTrend = useMemo(
    () =>
      availableYears.map((currentYear) => ({
        label: currentYear,
        rate: calculateAchievementRate(data, currentYear),
        totalData: data.filter((item) => compareAchievement(item, currentYear) !== null).length,
      })),
    [availableYears, data]
  );

  const monthlyTrend = useMemo(() => {
    const annualRate = calculateAchievementRate(data, year);
    return monthLabels.map((label, monthIndex) => {
      const monthlyItems = data.filter((item) => {
        if (!item.updatedAt) return false;
        const date = new Date(item.updatedAt);
        return !Number.isNaN(date.getTime()) && String(date.getFullYear()) === year && date.getMonth() <= monthIndex;
      });

      const fallbackRate = Math.round(((monthIndex + 1) / 12) * annualRate);
      const computedRate = monthlyItems.length ? calculateAchievementRate(monthlyItems, year) : fallbackRate;
      return {
        label,
        rate: computedRate,
        totalData: monthlyItems.length,
      };
    });
  }, [data, year]);

  const activeTrend = trendMode === "tahun" ? yearlyTrend : monthlyTrend;

  const underperforming = data
    .filter((item) => compareAchievement(item, year) === false)
    .slice(0, 5);

  const modalChartData = useMemo(() => {
    if (!selectedDistribution) return [];

    return selectedDistribution.indicators.map((item) => {
      const targetRaw = item.targets[year];
      const realizationRaw = item.achievements?.[year];

      return {
        indicator: item.indicator,
        target: toNumericValue(targetRaw),
        realization: toNumericValue(realizationRaw),
        targetRaw: formatDisplayValue(targetRaw),
        realizationRaw: formatDisplayValue(realizationRaw),
      };
    });
  }, [selectedDistribution, year]);

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="glass-surface panel-in rounded-3xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Ringkasan Eksekutif</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Gambaran performa indikator Fasilkom untuk tahun {year}.</p>
          </div>
          {indicatorsWithData.length > 0 && achievedCount < indicatorsWithData.length && (
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Area kritis perlu tindak lanjut
            </div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.title} className="surface-card metric-card stagger-in rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.title}</p>
              <span className={`rounded-xl p-2 ${item.tone}`}>
                <item.icon size={18} />
              </span>
            </div>
            <h3 className="display-font mt-2 text-3xl font-bold text-[var(--ink)]">{item.value}</h3>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="display-font mb-5 text-lg font-bold text-[var(--ink)]">Distribusi Indikator per Sasaran</h3>
          <p className="text-sm text-[var(--muted)]">
            Menampilkan jumlah indikator pada setiap IKU di masing-masing sasaran.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {distributionByCategory.map((distribution) => (
            <article key={distribution.category} className="surface-card panel-in rounded-3xl p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="display-font text-base font-bold text-[var(--ink)]">{distribution.category}</h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {distribution.rows.length} IKU
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Indikator</p>
                  <p className="text-sm font-bold" style={{ color: distribution.color }}>
                    {distribution.rows.reduce((total, row) => total + row.indicatorCount, 0)}
                  </p>
                </div>
              </div>

              <div style={{ height: Math.max(220, distribution.rows.length * 58 + 88) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution.rows} layout="vertical" margin={{ left: 8, right: 32, top: 8, bottom: 10 }} barCategoryGap={12}>
                    <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#dbe8de" />
                    <XAxis type="number" allowDecimals={false} domain={[0, (dataMax: number) => Math.max(1, dataMax)]} tick={{ fontSize: 11, fill: "#63756b" }} axisLine={false} tickLine={false}>
                      <Label value="Jumlah Indikator" position="insideBottom" offset={-6} fill="#5a6c62" fontSize={11} />
                    </XAxis>
                    <YAxis dataKey="ikuNum" type="category" width={84} tick={{ fontSize: 12, fontWeight: 700, fill: "#495a4f" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f2f7f3" }} content={<IndicatorListTooltip />} />
                    <Bar
                      dataKey="indicatorCount"
                      name="Jumlah Indikator"
                      radius={[0, 8, 8, 0]}
                      minPointSize={3}
                      onClick={(entry: any) => {
                        const payload = entry?.payload as DistributionRow | undefined;
                        if (payload) setSelectedDistribution(payload);
                      }}
                      cursor="pointer"
                    >
                      {distribution.rows.map((entry, index) => (
                        <Cell key={`indicator-cell-${distribution.category}-${index}`} fill={entry.color} fillOpacity={0.88} />
                      ))}
                      <LabelList dataKey="indicatorCount" position="right" fill="#1f352a" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card panel-in rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h3 className="display-font text-lg font-bold text-[var(--ink)]">Tren Tingkat Keberhasilan (%)</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTrendMode("tahun")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${trendMode === "tahun" ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--ink)]"}`}
            >
              Per Tahun
            </button>
            <button
              type="button"
              onClick={() => setTrendMode("bulan")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${trendMode === "bulan" ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--ink)]"}`}
            >
              Per Bulan ({year})
            </button>
          </div>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeTrend}>
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ce7b34" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ce7b34" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe8de" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 700, fill: "#495a4f" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#63756b" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dbe8de", boxShadow: "var(--shadow-soft)" }} />
              <Area type="monotone" dataKey="rate" name="Keberhasilan (%)" stroke="#ce7b34" strokeWidth={3} fillOpacity={1} fill="url(#rateGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {trendMode === "bulan" && (
          <p className="mt-2 text-xs text-[var(--muted)]">Mode bulanan menampilkan 12 bulan penuh dari Januari sampai Desember untuk tahun {year}.</p>
        )}
      </section>

      <section className="surface-card panel-in rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-600" />
          <h3 className="display-font text-lg font-bold text-[var(--ink)]">Indikator Perlu Perhatian ({year})</h3>
        </div>
        <div className="space-y-3">
          {underperforming.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-emerald-700">{item.ikuNum}</p>
                  <p className="truncate text-sm font-semibold text-[var(--ink)]">{item.indicator}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Realisasi</p>
                    <p className="font-bold text-rose-700">{item.achievements?.[year]}</p>
                  </div>
                  <div className="h-8 w-px bg-[var(--border)]" />
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Target</p>
                    <p className="font-bold text-[var(--ink)]">{item.targets[year]}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {underperforming.length === 0 && <p className="py-4 text-center text-sm text-[var(--muted)]">Semua indikator yang memiliki data sudah memenuhi target.</p>}
        </div>
      </section>

      {selectedDistribution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="distribution-detail-title"
          onClick={() => setSelectedDistribution(null)}
        >
          <div className="surface-card max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div>
                <h3 id="distribution-detail-title" className="display-font text-xl font-bold text-[var(--ink)]">
                  {selectedDistribution.category} - {selectedDistribution.ikuNum}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{selectedDistribution.indicatorCount} indikator</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDistribution(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-86px)] overflow-auto px-5 py-5 sm:px-6">
              <div className="min-w-[760px]" style={{ width: Math.max(760, modalChartData.length * 190), height: Math.max(360, modalChartData.length * 28 + 260) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modalChartData} margin={{ left: 18, right: 24, top: 18, bottom: 98 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe8de" />
                    <XAxis
                      dataKey="indicator"
                      interval={0}
                      angle={-24}
                      textAnchor="end"
                      height={112}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "#495a4f" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#63756b" }} axisLine={false} tickLine={false}>
                      <Label value="Jumlah / Persentase" angle={-90} position="insideLeft" fill="#5a6c62" fontSize={12} />
                    </YAxis>
                    <Tooltip content={<TargetRealizationTooltip />} />
                    <Legend verticalAlign="top" height={32} />
                    <Bar dataKey="target" name="Target" fill="#7a8e85" radius={[8, 8, 0, 0]} minPointSize={2} />
                    <Bar dataKey="realization" name="Realisasi" fill={selectedDistribution.color} radius={[8, 8, 0, 0]} minPointSize={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
