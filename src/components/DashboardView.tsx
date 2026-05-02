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
  Cell,
  LabelList,
  Label,
  Legend,
} from "recharts";
import { IKUData, Year, SasaranProgram } from "../types";
import { Trophy, TrendingUp, CheckCircle2, BarChart3, AlertCircle, X } from "lucide-react";
import ModalShell from "./ModalShell";

interface Props {
  year: Year;
  data: IKUData[];
  availableYears: Year[];
}

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
  indicators: IKUData[];
  color: string;
};

type CategoryTrendDetail = {
  category: SasaranProgram;
  achieved: number;
  total: number;
  score: number;
};

const formatDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const hasMetricValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  const normalized = String(value).trim();
  return normalized !== "" && normalized !== "-";
};

const toNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const normalized = value.replace(/%/g, "").replace(/\s/g, "").trim();
    const dotCount = (normalized.match(/\./g) || []).length;
    const cleaned = normalized.includes(",")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : dotCount > 1
        ? normalized.replace(/\./g, "")
        : normalized;
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
};

const formatMetricValue = (value: unknown, unit?: string) => {
  const raw = formatDisplayValue(value);
  if (raw === "-") return raw;
  if (unit === "%" && !raw.includes("%")) return `${raw}%`;
  return raw;
};

const hasYearEntry = (item: IKUData, targetYear: Year) =>
  item.targets[targetYear] !== undefined || item.achievements?.[targetYear] !== undefined;

const compareAchievement = (item: IKUData, targetYear: Year): boolean | null => {
  const achieved = item.achievements?.[targetYear];
  const target = item.targets[targetYear];
  if (!hasMetricValue(achieved)) return null;
  if (!hasMetricValue(target)) return null;

  const achievedNumber = toNumericValue(achieved);
  const targetNumber = toNumericValue(target);
  if (achievedNumber !== null && targetNumber !== null) return achievedNumber >= targetNumber;

  if (item.ikuNum === "IKU 11") {
    if (item.indicator.includes("Opini")) return String(achieved).toUpperCase() === "WTP";
    if (item.indicator.includes("SAKIP")) return ["A", "AA"].includes(String(achieved).toUpperCase());
  }
  return String(achieved) === String(target);
};

const calculateAchievementRate = (items: IKUData[], targetYear: Year): number => {
  const yearItems = items.filter((item) => hasYearEntry(item, targetYear));
  if (!yearItems.length) return 0;
  const achieved = yearItems.filter((item) => compareAchievement(item, targetYear) === true).length;
  return Math.round((achieved / yearItems.length) * 100);
};

const IndicatorListTooltip = ({ active, payload, year }: any) => {
  if (!active || !payload?.length) return null;
  const indicators = payload[0]?.payload?.indicators as IKUData[] | undefined;
  if (!indicators?.length) return null;

  return (
    <div className="max-w-md rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--ink)] shadow-[var(--shadow-soft)]">
      <div className="space-y-1.5">
        {indicators.map((indicator, index) => (
          <p key={indicator.id} className="font-semibold leading-snug">
            {index + 1}. {indicator.indicator}{" "}
            <span className="whitespace-nowrap text-[var(--muted)]">
              ({formatMetricValue(indicator.achievements?.[year as Year], indicator.unit)}/{formatMetricValue(indicator.targets[year as Year], indicator.unit)})
            </span>
          </p>
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

const WeightedTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const details = payload[0]?.payload?.details as CategoryTrendDetail[] | undefined;
  const totalScore = payload[0]?.payload?.totalScore ?? 0;
  if (!details?.length) return null;

  return (
    <div className="max-w-sm rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--ink)] shadow-[var(--shadow-soft)]">
      <p className="mb-2 font-bold">Tahun {label}: {totalScore}%</p>
      <div className="space-y-1.5">
        {details.map((item) => (
          <div key={item.category} className="flex items-center justify-between gap-4">
            <span className="font-semibold">{item.category}</span>
            <span className="whitespace-nowrap text-[var(--muted)]">{item.achieved}/{item.total} indikator, {item.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardView: React.FC<Props> = ({ year, data, availableYears }) => {
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionRow | null>(null);

  const yearIndicators = data.filter((item) => hasYearEntry(item, year));
  const achievedCount = yearIndicators.filter((item) => compareAchievement(item, year) === true).length;
  const performanceRate = yearIndicators.length > 0 ? Math.round((achievedCount / yearIndicators.length) * 100) : 0;
  const uniqueIkuCount = new Set(data.map((item) => item.ikuNum)).size;

  const summary = [
    { title: "Total IKU", value: String(uniqueIkuCount), icon: Trophy, tone: "bg-emerald-100 text-emerald-800" },
    {
      title: `Indikator Tercapai (${year})`,
      value: yearIndicators.length > 0 ? `${achievedCount}/${yearIndicators.length}` : "Tidak ada data",
      icon: CheckCircle2,
      tone: achievedCount < yearIndicators.length / 2 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Tingkat Keberhasilan",
      value: yearIndicators.length > 0 ? `${performanceRate}%` : "N/A",
      icon: TrendingUp,
      tone: performanceRate < 50 ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
    },
    { title: "Tahun Aktif", value: year, icon: BarChart3, tone: "bg-amber-100 text-amber-700" },
  ];

  const distributionByCategory = useMemo(() => {
    return Object.values(SasaranProgram).map((category) => {
      const categoryItems = data.filter((item) => item.category === category && hasYearEntry(item, year));
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
          indicators,
          color: categoryColors[category],
        }));

      return {
        category,
        color: categoryColors[category],
        rows,
      };
    });
  }, [data, year]);

  const trendYears = useMemo(() => {
    const selectedIndex = availableYears.indexOf(year);
    const previousYear = selectedIndex > 0 ? availableYears[selectedIndex - 1] : undefined;
    return [previousYear, year].filter(Boolean) as Year[];
  }, [availableYears, year]);

  const weightedTrend = useMemo(
    () =>
      trendYears.map((currentYear) => {
        const details = Object.values(SasaranProgram).map((category) => {
          const categoryItems = data.filter((item) => item.category === category && hasYearEntry(item, currentYear));
          const achieved = categoryItems.filter((item) => compareAchievement(item, currentYear) === true).length;
          const score = categoryItems.length ? Number(((achieved / categoryItems.length) * 25).toFixed(1)) : 0;
          return {
            category,
            achieved,
            total: categoryItems.length,
            score,
          };
        });
        const totalScore = Number(details.reduce((sum, item) => sum + item.score, 0).toFixed(1));

        return {
          label: currentYear,
          totalScore,
          details,
          [SasaranProgram.Talenta]: details.find((item) => item.category === SasaranProgram.Talenta)?.score ?? 0,
          [SasaranProgram.Inovasi]: details.find((item) => item.category === SasaranProgram.Inovasi)?.score ?? 0,
          [SasaranProgram.Kontribusi]: details.find((item) => item.category === SasaranProgram.Kontribusi)?.score ?? 0,
          [SasaranProgram.TataKelola]: details.find((item) => item.category === SasaranProgram.TataKelola)?.score ?? 0,
        };
      }),
    [data, trendYears]
  );

  const modalChartData = useMemo(() => {
    if (!selectedDistribution) return [];

    return selectedDistribution.indicators.map((item, index) => {
      const targetRaw = item.targets[year];
      const realizationRaw = item.achievements?.[year];

      return {
        indicator: `${index + 1}. ${item.indicator}`,
        target: toNumericValue(targetRaw),
        realization: toNumericValue(realizationRaw),
        targetRaw: formatMetricValue(targetRaw, item.unit),
        realizationRaw: formatMetricValue(realizationRaw, item.unit),
      };
    });
  }, [selectedDistribution, year]);

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="glass-surface panel-in rounded-3xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Dasbor</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Performa indikator per tahun {year}.</p>
          </div>
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
                    <Tooltip cursor={{ fill: "#f2f7f3" }} content={<IndicatorListTooltip year={year} />} />
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
        <div className="mb-5">
          <h3 className="display-font text-lg font-bold text-[var(--ink)]">Tren Tingkat Keberhasilan (%)</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Setiap sasaran bernilai maksimal 25%. Total 100% tercapai jika Talenta, Inovasi, Kontribusi Keilmuan, dan Tata Kelola Institusi seluruhnya memenuhi target.
          </p>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weightedTrend} margin={{ left: 8, right: 24, top: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe8de" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 700, fill: "#495a4f" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#63756b" }} axisLine={false} tickLine={false} domain={[0, 100]}>
                <Label value="Skor (%)" angle={-90} position="insideLeft" fill="#5a6c62" fontSize={12} />
              </YAxis>
              <Tooltip content={<WeightedTrendTooltip />} />
              <Legend verticalAlign="top" height={32} />
              {Object.values(SasaranProgram).map((category, index, categories) => (
                <Bar
                  key={category}
                  dataKey={category}
                  name={category}
                  stackId="year"
                  fill={categoryColors[category]}
                  radius={index === categories.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                >
                  {index === categories.length - 1 && <LabelList dataKey="totalScore" position="top" fill="#1f352a" fontSize={12} fontWeight={700} />}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {selectedDistribution && (
        <ModalShell
          onClose={() => setSelectedDistribution(null)}
          labelledBy="distribution-detail-title"
          className="surface-card max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl"
        >
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
                  <Bar dataKey="target" name="Target" fill="#ce7b34" radius={[8, 8, 0, 0]} minPointSize={2} />
                  <Bar dataKey="realization" name="Realisasi" fill="#17624a" radius={[8, 8, 0, 0]} minPointSize={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default DashboardView;
