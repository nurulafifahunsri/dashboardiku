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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { ChartColorConfig, IKUData, IKUDocument, Year, SasaranProgram } from "../types";
import { Trophy, TrendingUp, CheckCircle2, BarChart3, AlertCircle, X } from "lucide-react";
import ModalShell from "./ModalShell";
import DocumentPreview from "./DocumentPreview";
import { defaultChartColors } from "@/lib/chartColors";
import { getDocumentForYear } from "@/lib/ikuYearlyDocuments";

interface Props {
  year: Year;
  data: IKUData[];
  availableYears: Year[];
  chartColors?: ChartColorConfig;
}

const MIN_RADAR_IKU_COUNT = 3;
const linkDocumentType = "text/uri-list";

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

type SummaryKey = "total" | "achieved" | "rate" | "year";

type SelectedIndicatorDocument = {
  document: IKUDocument;
  label: string;
};

const formatDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const isLinkDocument = (document?: IKUDocument) =>
  document?.documentType === linkDocumentType || Boolean(document?.documentUrl && /^https?:\/\//i.test(document.documentUrl));

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

const achievementStatusMeta = (status: boolean | null) => {
  if (status === true) {
    return {
      label: "Tercapai",
      className: "border-emerald-200 bg-emerald-100 text-emerald-700",
    };
  }
  if (status === false) {
    return {
      label: "Belum Tercapai",
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }
  return {
    label: "Belum Lengkap",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  };
};

const ikuOrder = (ikuNum: string) => {
  const parsed = Number(ikuNum.replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 999;
};

const splitLongWord = (word: string, maxLength = 14) => {
  if (word.length <= maxLength) return [word];
  const chunks: string[] = [];
  let remaining = word;

  while (remaining.length > maxLength) {
    const safeLimit = Math.min(maxLength, Math.max(4, remaining.length - 3));
    const vowelBreak = remaining
      .slice(4, safeLimit)
      .split("")
      .map((char, index) => ({ char, index: index + 4 }))
      .reverse()
      .find(({ char }) => /[aiueoAIUEO]/.test(char));
    const breakAt = vowelBreak ? vowelBreak.index + 1 : safeLimit;

    chunks.push(`${remaining.slice(0, breakAt)}-`);
    remaining = remaining.slice(breakAt);
  }
  chunks.push(remaining);
  return chunks;
};

const wrapIndicatorLabel = (label: string, maxLineLength = 14, maxLines = 5) => {
  const words = label.split(/\s+/).flatMap((word) => splitLongWord(word));
  const lines: string[] = [];

  words.forEach((word) => {
    if (!lines.length) {
      lines.push(word);
      return;
    }

    const current = lines[lines.length - 1] || "";
    if (current.endsWith("-")) {
      lines.push(word);
      return;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLineLength) {
      lines[lines.length - 1] = next;
    } else {
      lines.push(word);
    }
  });

  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/\.*$/, "")}...`;
  return visible;
};

const ModalIndicatorTick = ({ x = 0, y = 0, payload }: any) => {
  const lines = wrapIndicatorLabel(String(payload?.value || ""));

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="#495a4f" fontSize={10} fontWeight={700}>
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 12 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
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

const RadarIndicatorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as DistributionRow | undefined;
  if (!row) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--ink)] shadow-[var(--shadow-soft)]">
      <p className="font-bold">{label}</p>
      <p className="mt-1 text-[var(--muted)]">{row.indicatorCount} indikator</p>
    </div>
  );
};

const DashboardView: React.FC<Props> = ({ year, data, availableYears, chartColors = defaultChartColors }) => {
  const [selectedDistribution, setSelectedDistribution] = useState<DistributionRow | null>(null);
  const [summaryModal, setSummaryModal] = useState<SummaryKey | null>(null);
  const [selectedIndicatorDocument, setSelectedIndicatorDocument] = useState<SelectedIndicatorDocument | null>(null);
  const categoryColors = chartColors.categories;

  const yearIndicators = useMemo(() => data.filter((item) => hasYearEntry(item, year)), [data, year]);
  const achievedCount = yearIndicators.filter((item) => compareAchievement(item, year) === true).length;
  const performanceRate = yearIndicators.length > 0 ? Math.round((achievedCount / yearIndicators.length) * 100) : 0;
  const uniqueIkuCount = new Set(data.map((item) => item.ikuNum)).size;

  const summary: Array<{ key: SummaryKey; title: string; value: string; icon: React.ElementType; tone: string }> = [
    { key: "total", title: "Total IKU", value: String(uniqueIkuCount), icon: Trophy, tone: "bg-emerald-100 text-emerald-800" },
    {
      key: "achieved",
      title: `Indikator Tercapai (${year})`,
      value: yearIndicators.length > 0 ? `${achievedCount}/${yearIndicators.length}` : "Tidak ada data",
      icon: CheckCircle2,
      tone: achievedCount < yearIndicators.length / 2 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
    },
    {
      key: "rate",
      title: "Tingkat Keberhasilan",
      value: yearIndicators.length > 0 ? `${performanceRate}%` : "N/A",
      icon: TrendingUp,
      tone: performanceRate < 50 ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700",
    },
    { key: "year", title: "Tahun Aktif", value: year, icon: BarChart3, tone: "bg-amber-100 text-amber-700" },
  ];

  const achievementRows = useMemo(
    () =>
      yearIndicators
        .map((item) => ({
          item,
          status: compareAchievement(item, year),
          target: formatMetricValue(item.targets[year], item.unit),
          realization: formatMetricValue(item.achievements?.[year], item.unit),
        }))
        .sort((a, b) => {
          const categoryDiff = String(a.item.category).localeCompare(String(b.item.category), "id");
          if (categoryDiff !== 0) return categoryDiff;
          const ikuDiff = ikuOrder(a.item.ikuNum) - ikuOrder(b.item.ikuNum);
          if (ikuDiff !== 0) return ikuDiff;
          return String(a.item.indicator).localeCompare(String(b.item.indicator), "id");
        }),
    [yearIndicators, year]
  );

  const totalIkuRows = useMemo(() => {
    return Object.values(SasaranProgram).flatMap((category) => {
      const grouped = data
        .filter((item) => item.category === category)
        .reduce<Record<string, IKUData[]>>((acc, item) => {
          acc[item.ikuNum] = [...(acc[item.ikuNum] || []), item];
          return acc;
        }, {});

      return Object.entries(grouped)
        .sort((a, b) => ikuOrder(a[0]) - ikuOrder(b[0]))
        .map(([ikuNum, indicators]) => ({
          category,
          ikuNum,
          indicatorCount: indicators.length,
          yearIndicatorCount: indicators.filter((item) => hasYearEntry(item, year)).length,
        }));
    });
  }, [data, year]);

  const performanceBreakdown = useMemo(() => {
    return Object.values(SasaranProgram).map((category) => {
      const categoryItems = data.filter((item) => item.category === category && hasYearEntry(item, year));
      const achieved = categoryItems.filter((item) => compareAchievement(item, year) === true).length;
      const notAchieved = categoryItems.filter((item) => compareAchievement(item, year) === false).length;
      const incomplete = categoryItems.filter((item) => compareAchievement(item, year) === null).length;
      const rate = categoryItems.length ? Math.round((achieved / categoryItems.length) * 100) : 0;

      return {
        category,
        total: categoryItems.length,
        achieved,
        notAchieved,
        incomplete,
        rate,
      };
    });
  }, [data, year]);

  const yearRows = useMemo(() => {
    return availableYears.map((currentYear) => {
      const items = data.filter((item) => hasYearEntry(item, currentYear));
      const achieved = items.filter((item) => compareAchievement(item, currentYear) === true).length;
      const rate = items.length ? Math.round((achieved / items.length) * 100) : 0;

      return {
        year: currentYear,
        uniqueIku: new Set(items.map((item) => item.ikuNum)).size,
        indicators: items.length,
        achieved,
        rate,
      };
    });
  }, [availableYears, data]);

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
  }, [categoryColors, data, year]);

  const trendYears = useMemo(() => {
    const selectedIndex = availableYears.indexOf(year);
    const previousYear = selectedIndex > 0 ? availableYears[selectedIndex - 1] : undefined;
    return [previousYear, year].filter(Boolean) as Year[];
  }, [availableYears, year]);

  const radarDistributions = useMemo(
    () => distributionByCategory.filter((distribution) => distribution.rows.length >= MIN_RADAR_IKU_COUNT),
    [distributionByCategory]
  );

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
        document: getDocumentForYear(item, year),
        documentLabel: item.indicator,
      };
    });
  }, [selectedDistribution, year]);

  const openIndicatorDocument = (entry: any) => {
    const payload = entry?.payload;
    const document = payload?.document as IKUDocument | undefined;
    if (!document?.documentUrl) return;

    if (isLinkDocument(document)) {
      window.open(document.documentUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setSelectedIndicatorDocument({
      document,
      label: payload?.documentLabel || payload?.indicator || "Dokumen indikator",
    });
  };

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
        {summary.map((item) => {
          const content = (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{item.title}</p>
                <span className={`rounded-xl p-2 ${item.tone}`}>
                  <item.icon size={18} />
                </span>
              </div>
              <h3 className="display-font mt-2 text-3xl font-bold text-[var(--ink)]">{item.value}</h3>
            </>
          );

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSummaryModal(item.key)}
              className="surface-card metric-card stagger-in rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              aria-haspopup="dialog"
            >
              {content}
            </button>
          );
        })}
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

      {radarDistributions.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="display-font mb-2 text-lg font-bold text-[var(--ink)]">Radar Jumlah Indikator per IKU</h3>
            <p className="text-sm text-[var(--muted)]">
              Ditampilkan per sasaran pada tahun {year}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {radarDistributions.map((distribution) => (
              <article key={`radar-${distribution.category}`} className="surface-card panel-in rounded-3xl p-5 sm:p-6">
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

                <div className="h-[330px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={distribution.rows} outerRadius="72%">
                      <PolarGrid stroke="#dbe8de" />
                      <PolarAngleAxis dataKey="ikuNum" tick={{ fontSize: 11, fontWeight: 700, fill: "#495a4f" }} />
                      <PolarRadiusAxis angle={30} allowDecimals={false} tick={{ fontSize: 10, fill: "#63756b" }} />
                      <Tooltip content={<RadarIndicatorTooltip />} />
                      <Radar
                        name="Jumlah Indikator"
                        dataKey="indicatorCount"
                        stroke={distribution.color}
                        fill={distribution.color}
                        fillOpacity={0.24}
                        dot={{ r: 3, fill: distribution.color }}
                      />
                      <Legend verticalAlign="bottom" height={24} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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
          className="surface-card flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl"
        >
          <div className="flex flex-none items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
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

          <div className="min-h-0 flex-1 overflow-auto px-5 py-5 sm:px-6">
            <div
              className="h-full min-h-[560px] min-w-[860px]"
              style={{ width: Math.max(860, modalChartData.length * 170) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modalChartData} margin={{ left: 18, right: 24, top: 18, bottom: 14 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe8de" />
                  <XAxis
                    dataKey="indicator"
                    interval={0}
                    height={86}
                    tick={<ModalIndicatorTick />}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#63756b" }} axisLine={false} tickLine={false}>
                    <Label value="Jumlah" angle={-90} position="insideLeft" fill="#5a6c62" fontSize={12} />
                  </YAxis>
                  <Tooltip content={<TargetRealizationTooltip />} />
                  <Legend verticalAlign="top" height={32} />
                  <Bar
                    dataKey="target"
                    name="Target"
                    fill={chartColors.target}
                    radius={[8, 8, 0, 0]}
                    minPointSize={2}
                    cursor="pointer"
                    onClick={openIndicatorDocument}
                  />
                  <Bar
                    dataKey="realization"
                    name="Realisasi"
                    fill={chartColors.realization}
                    radius={[8, 8, 0, 0]}
                    minPointSize={2}
                    cursor="pointer"
                    onClick={openIndicatorDocument}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ModalShell>
      )}

      {selectedIndicatorDocument && (
        <DocumentPreview
          url={selectedIndicatorDocument.document.documentUrl}
          name={selectedIndicatorDocument.document.documentName || selectedIndicatorDocument.label}
          type={selectedIndicatorDocument.document.documentType}
          hideTrigger
          openByDefault
          onClose={() => setSelectedIndicatorDocument(null)}
        />
      )}

      {summaryModal && (
        <ModalShell
          onClose={() => setSummaryModal(null)}
          labelledBy="summary-detail-title"
          className="surface-card max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div>
              <h3 id="summary-detail-title" className="display-font text-xl font-bold text-[var(--ink)]">
                {summaryModal === "total" && "Total IKU"}
                {summaryModal === "achieved" && `Indikator Tercapai ${year}`}
                {summaryModal === "rate" && `Tingkat Keberhasilan ${year}`}
                {summaryModal === "year" && "Tahun Aktif"}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {summaryModal === "total" && `${uniqueIkuCount} IKU unik dan ${data.length} indikator di seluruh data.`}
                {summaryModal === "achieved" && (yearIndicators.length ? `${achievedCount}/${yearIndicators.length} indikator tercapai` : "Tidak ada data indikator")}
                {summaryModal === "rate" && `Rekap capaian setiap sasaran pada tahun ${year}.`}
                {summaryModal === "year" && `Ringkasan tahun evaluasi yang aktif di dashboard.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSummaryModal(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(92vh-86px)] overflow-auto p-5 sm:p-6">
            {summaryModal === "total" && (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">IKU</th>
                    <th className="px-3 py-3 text-center">Indikator Total</th>
                    <th className="px-3 py-3 text-center">Indikator {year}</th>
                  </tr>
                </thead>
                <tbody>
                  {totalIkuRows.map((row) => (
                    <tr key={`${row.category}-${row.ikuNum}`} className="border-b border-[var(--border)] last:border-none">
                      <td className="px-3 py-3 align-top font-semibold text-[var(--ink)]">{row.category}</td>
                      <td className="px-3 py-3 align-top font-bold text-[var(--ink)]">{row.ikuNum}</td>
                      <td className="px-3 py-3 text-center font-semibold text-[var(--ink)]">{row.indicatorCount}</td>
                      <td className="px-3 py-3 text-center font-semibold text-emerald-700">{row.yearIndicatorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {summaryModal === "achieved" && (
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                    <th className="px-3 py-3">IKU</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Indikator</th>
                    <th className="px-3 py-3">Target</th>
                    <th className="px-3 py-3">Realisasi</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {achievementRows.map(({ item, status, target, realization }) => {
                    const meta = achievementStatusMeta(status);
                    return (
                      <tr key={item.id} className="border-b border-[var(--border)] last:border-none">
                        <td className="px-3 py-3 align-top font-bold text-[var(--ink)]">{item.ikuNum}</td>
                        <td className="px-3 py-3 align-top text-[var(--muted)]">{item.category}</td>
                        <td className="px-3 py-3 align-top font-semibold leading-snug text-[var(--ink)]">{item.indicator}</td>
                        <td className="px-3 py-3 align-top font-semibold text-indigo-700">{target}</td>
                        <td className="px-3 py-3 align-top font-semibold text-emerald-700">{realization}</td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${meta.className}`}>
                              {status === true ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                              {meta.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {achievementRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--muted)]">
                        Tidak ada indikator pada tahun {year}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {summaryModal === "rate" && (
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                    <th className="px-3 py-3">Sasaran</th>
                    <th className="px-3 py-3 text-center">Tercapai</th>
                    <th className="px-3 py-3 text-center">Belum</th>
                    <th className="px-3 py-3 text-center">Belum Lengkap</th>
                    <th className="px-3 py-3 text-center">Total</th>
                    <th className="px-3 py-3 text-center">Keberhasilan</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceBreakdown.map((row) => (
                    <tr key={row.category} className="border-b border-[var(--border)] last:border-none">
                      <td className="px-3 py-3 align-top font-bold text-[var(--ink)]">{row.category}</td>
                      <td className="px-3 py-3 text-center font-semibold text-emerald-700">{row.achieved}</td>
                      <td className="px-3 py-3 text-center font-semibold text-rose-700">{row.notAchieved}</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-600">{row.incomplete}</td>
                      <td className="px-3 py-3 text-center font-semibold text-[var(--ink)]">{row.total}</td>
                      <td className="px-3 py-3 text-center font-bold text-sky-700">{row.total ? `${row.rate}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {summaryModal === "year" && (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                    <th className="px-3 py-3">Tahun</th>
                    <th className="px-3 py-3 text-center">IKU</th>
                    <th className="px-3 py-3 text-center">Indikator</th>
                    <th className="px-3 py-3 text-center">Tercapai</th>
                    <th className="px-3 py-3 text-center">Keberhasilan</th>
                  </tr>
                </thead>
                <tbody>
                  {yearRows.map((row) => (
                    <tr key={row.year} className="border-b border-[var(--border)] last:border-none">
                      <td className="px-3 py-3 align-top font-bold text-[var(--ink)]">
                        <span className="inline-flex items-center gap-2">
                          {row.year}
                          {row.year === year && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">Aktif</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-[var(--ink)]">{row.uniqueIku}</td>
                      <td className="px-3 py-3 text-center font-semibold text-[var(--ink)]">{row.indicators}</td>
                      <td className="px-3 py-3 text-center font-semibold text-emerald-700">{row.achieved}</td>
                      <td className="px-3 py-3 text-center font-bold text-sky-700">{row.indicators ? `${row.rate}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default DashboardView;
