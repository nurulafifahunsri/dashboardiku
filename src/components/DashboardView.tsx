"use client";
import React from 'react';
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
  Cell
} from 'recharts';
import { IKUData, Year, SasaranProgram } from '../types';
import { Trophy, TrendingUp, CheckCircle2, BarChart3, AlertCircle } from 'lucide-react';

interface Props {
  year: Year;
  data: IKUData[];
}

const availableYears: Year[] = ['2025', '2026', '2027', '2028', '2029', '2030'];

const calculateAchievementRate = (items: IKUData[], targetYear: Year): number => {
  const validItems = items.filter(d => d.achievements?.[targetYear] !== undefined);
  if (!validItems.length) return 0;

  let achCount = 0;
  validItems.forEach(d => {
    const ach = d.achievements![targetYear];
    const tgt = d.targets[targetYear];
    if (typeof ach === 'number' && typeof tgt === 'number') {
      if (ach >= tgt) achCount++;
    } else if (typeof ach === 'string' && !isNaN(parseFloat(ach))) {
      if (parseFloat(ach) >= parseFloat(tgt as string)) achCount++;
    } else if (d.ikuNum === 'IKU 11') {
      if (d.indicator.includes('Opini') && ach === 'WTP') achCount++;
      else if (d.indicator.includes('SAKIP') && (ach === 'A' || ach === 'AA')) achCount++;
      else if (ach === tgt) achCount++;
    } else {
      if (ach === tgt) achCount++;
    }
  });
  return Math.round((achCount / validItems.length) * 100);
};

const DashboardView: React.FC<Props> = ({ year, data }) => {
  const categoryColors: Record<string, string> = {
    [SasaranProgram.Talenta]: '#17624a',
    [SasaranProgram.Inovasi]: '#ce7b34',
    [SasaranProgram.Kontribusi]: '#197a9a',
    [SasaranProgram.Masyarakat]: '#4f46e5',
    [SasaranProgram.TataKelola]: '#b23b6b',
  };

  const indicatorsWithData = data.filter((d) => d.achievements?.[year] !== undefined);
  const achievedCount = indicatorsWithData.filter((d) => {
    const achieved = d.achievements![year];
    const target = d.targets[year];
    if (typeof achieved === 'number' && typeof target === 'number') return achieved >= target;
    if (typeof achieved === 'string' && !isNaN(parseFloat(achieved))) return parseFloat(achieved) >= parseFloat(target as string);
    if (d.ikuNum === 'IKU 11') {
      if (d.indicator.includes('Opini')) return achieved === 'WTP';
      if (d.indicator.includes('SAKIP')) return achieved === 'A' || achieved === 'AA';
    }
    return achieved === target;
  }).length;

  const performanceRate = indicatorsWithData.length > 0
    ? Math.round((achievedCount / indicatorsWithData.length) * 100)
    : 0;

  const uniqueIkuCount = new Set(data.map((d) => d.ikuNum)).size;

  const summary = [
    { title: 'Total IKU', value: String(uniqueIkuCount), icon: Trophy, tone: 'bg-emerald-100 text-emerald-800' },
    {
      title: `Indikator Tercapai (${year})`,
      value: indicatorsWithData.length > 0 ? `${achievedCount}/${indicatorsWithData.length}` : 'No Data',
      icon: CheckCircle2,
      tone: achievedCount < indicatorsWithData.length / 2 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Tingkat Keberhasilan',
      value: indicatorsWithData.length > 0 ? `${performanceRate}%` : 'N/A',
      icon: TrendingUp,
      tone: performanceRate < 50 ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
    },
    { title: 'Tahun Aktif', value: year, icon: BarChart3, tone: 'bg-amber-100 text-amber-700' },
  ];

  const categoryDistribution = Object.values(SasaranProgram).map((cat) => ({
    name: cat,
    count: data.filter((d) => d.category === cat).length,
    color: categoryColors[cat] || '#17624a'
  }));

  const overallTrend = availableYears.map(y => {
    const valid = data.filter(d => d.targets[y] !== undefined && d.targets[y] !== '');
    const rate = calculateAchievementRate(data, y);
    return {
      year: y,
      rate,
      activeIKUs: valid.length
    };
  });

  const underperforming = data
    .filter((d) => {
      const achieved = d.achievements?.[year];
      const target = d.targets[year];
      if (achieved === undefined) return false;
      if (typeof achieved === 'number' && typeof target === 'number') return achieved < target;
      if (typeof achieved === 'string' && !isNaN(parseFloat(achieved))) return parseFloat(achieved) < parseFloat(target as string);
      return achieved !== target;
    })
    .slice(0, 5);

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="glass-surface panel-in rounded-3xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Executive Summary</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Gambaran ringkas performa indikator Fasilkom untuk tahun {year}.
            </p>
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
        {summary.map((s, i) => (
          <article key={s.title} className="surface-card metric-card stagger-in rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{s.title}</p>
              <span className={`rounded-xl p-2 ${s.tone}`}>
                <s.icon size={18} />
              </span>
            </div>
            <h3 className="display-font mt-2 text-3xl font-bold text-[var(--ink)]">{s.value}</h3>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <article className="surface-card panel-in rounded-3xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h3 className="display-font text-lg font-bold text-[var(--ink)]">Distribusi Indikator per Sasaran</h3>
            <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">Program Goals</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical" margin={{ left: 24, right: 22, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#dbe8de" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={108}
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#495a4f' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f2f7f3' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #dbe8de', boxShadow: 'var(--shadow-soft)' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={30}>
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card panel-in rounded-3xl p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h3 className="display-font text-lg font-bold text-[var(--ink)]">Tren Tingkat Keberhasilan (%)</h3>
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[#9d5f2d]">All Years</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallTrend}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ce7b34" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#ce7b34" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe8de" />
                <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 700, fill: '#495a4f' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#63756b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dbe8de', boxShadow: 'var(--shadow-soft)' }} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Keberhasilan (%)"
                  stroke="#ce7b34"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#rateGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Capaian</p>
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
          {underperforming.length === 0 && (
            <p className="py-4 text-center text-sm text-[var(--muted)]">
              Semua indikator yang memiliki data sudah memenuhi target.
            </p>
          )}
        </div>
      </section>

      <section className="panel-in relative overflow-hidden rounded-3xl border border-emerald-800/35 bg-gradient-to-br from-emerald-900 to-emerald-700 p-6 text-white">
        <div className="absolute right-[-20px] top-[-30px] h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-50">
            Priority Note
          </span>
          <h3 className="display-font mt-4 text-2xl font-bold">Action Required</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-50">
            Tingkat keberhasilan saat ini berada di <strong>{performanceRate}%</strong>. Fokuskan intervensi awal pada
            indikator dengan selisih tertinggi terhadap target tahunan agar perbaikan kinerja lebih terarah.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
