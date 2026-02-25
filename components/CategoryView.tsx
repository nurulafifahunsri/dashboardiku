import React from 'react';
import { IKUData, SasaranProgram, Year } from '../types';
import {
  CheckCircle,
  Target,
  FileText,
  Award,
  Building,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Scale
} from 'lucide-react';

interface Props {
  category: SasaranProgram;
  data: IKUData[];
  year: Year;
}

const CategoryView: React.FC<Props> = ({ category, data, year }) => {
  const formatValue = (val: string | number | undefined) => {
    if (val === undefined) return '-';
    return val;
  };

  const getIcon = (num: string) => {
    if (num === 'IKU 1') return <CheckCircle className="text-emerald-700" size={18} />;
    if (num === 'IKU 6') return <FileText className="text-sky-700" size={18} />;
    if (num === 'IKU 11' || num === 'IKU 4') return <Award className="text-amber-600" size={18} />;
    return <Building className="text-indigo-700" size={18} />;
  };

  const getStatusInfo = (achieved: string | number | undefined, target: string | number) => {
    if (achieved === undefined) {
      return {
        label: 'Tidak Ada Data',
        color: 'text-slate-500 bg-slate-100 border-slate-200',
        icon: <MinusCircle size={14} />
      };
    }

    let isAchieved = false;
    let isWarning = false;

    if (typeof achieved === 'string' && typeof target === 'string' && isNaN(parseFloat(achieved))) {
      if (achieved === target) isAchieved = true;
      else if (achieved === 'WDP' && target === 'WTP') isWarning = true;
      else if (achieved === 'B' && target === 'A') isWarning = true;
      else if (achieved === '801-1000' && target === '601-800') isWarning = true;
    } else {
      const aNum = parseFloat(achieved as string);
      const tNum = parseFloat(target as string);
      if (!isNaN(aNum) && !isNaN(tNum)) {
        if (aNum >= tNum) isAchieved = true;
        else if (aNum >= tNum * 0.9) isWarning = true;
      }
    }

    if (isAchieved) {
      return {
        label: 'Tercapai',
        color: 'text-emerald-700 bg-emerald-100 border-emerald-200',
        icon: <CheckCircle2 size={14} />
      };
    }
    if (isWarning) {
      return {
        label: 'Hampir Tercapai',
        color: 'text-amber-700 bg-amber-100 border-amber-200',
        icon: <MinusCircle size={14} />
      };
    }
    return {
      label: 'Belum Tercapai',
      color: 'text-rose-700 bg-rose-100 border-rose-200',
      icon: <XCircle size={14} />
    };
  };

  return (
    <div className="space-y-5">
      <header className="glass-surface panel-in rounded-3xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[var(--primary)] p-2.5 text-white">
            <Target size={18} />
          </div>
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">{category}</h2>
            <p className="mt-0.5 text-sm text-[var(--muted)]">Detail indikator, target, dan capaian tahun {year}.</p>
          </div>
        </div>
      </header>

      <section className="surface-card panel-in overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">IKU</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">Indikator</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-indigo-700">Target {year}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-700">Capaian {year}</th>
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const targetValue = item.targets[year];
                const achievementValue = item.achievements ? item.achievements[year] : undefined;
                const info = getStatusInfo(achievementValue, targetValue);

                return (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-4 align-top">
                      <span className="inline-flex rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                        {item.ikuNum}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5">{getIcon(item.ikuNum)}</span>
                        <span className="text-sm font-semibold leading-snug text-[var(--ink)]">{item.indicator}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-bold text-indigo-700">{formatValue(targetValue)}</td>
                    <td className="px-5 py-4 align-top text-sm font-bold text-emerald-700">{formatValue(achievementValue)}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${info.color}`}>
                          {info.icon}
                          {info.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.slice(0, 4).map((item, idx) => {
          const targetValue = item.targets[year];
          const achievementValue = item.achievements ? item.achievements[year] : undefined;
          const info = getStatusInfo(achievementValue, targetValue);
          const percentage =
            achievementValue !== undefined &&
            !isNaN(parseFloat(achievementValue as string)) &&
            !isNaN(parseFloat(targetValue as string))
              ? Math.min(100, (parseFloat(achievementValue as string) / parseFloat(targetValue as string)) * 100)
              : 0;

          return (
            <article key={`card-${item.id}`} className="surface-card metric-card stagger-in rounded-2xl p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-emerald-700">{item.ikuNum}</p>
                  <h4 className="mt-1 text-sm font-bold leading-snug text-[var(--ink)]">{item.indicator}</h4>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.11em] ${info.color}`}>
                  {info.icon}
                  {info.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Capaian</p>
                  <p className="mt-1 text-xl font-bold text-[var(--ink)]">{achievementValue ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Target</p>
                  <p className="mt-1 text-xl font-bold text-indigo-700">{targetValue}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--muted)]">
                  <span>Progress</span>
                  <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`${percentage >= 100 ? 'bg-emerald-600' : percentage >= 90 ? 'bg-amber-500' : 'bg-rose-500'} h-full transition-all duration-700`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                  <Scale size={13} />
                  <span>Prioritas #{idx + 1} untuk kategori {category}</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default CategoryView;
