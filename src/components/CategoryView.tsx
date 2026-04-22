"use client";
import React, { useMemo, useState } from 'react';
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
  Scale,
  Search,
  ArrowDownAZ,
  ArrowUpAZ
} from 'lucide-react';

interface Props {
  category: SasaranProgram;
  data: IKUData[];
  year: Year;
}

const CategoryView: React.FC<Props> = ({ category, data, year }) => {
  const [search, setSearch] = useState('');
  const [ikuFilter, setIkuFilter] = useState('semua');
  const [sortKey, setSortKey] = useState<'ikuNum' | 'indicator' | 'unit'>('ikuNum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const formatValue = (val: string | number | undefined) => {
    if (val === undefined) return '-';
    return val;
  };

  const ikuOptions = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.ikuNum))).sort((a, b) => a.localeCompare(b, 'id'));
  }, [data]);

  const filteredRows = useMemo(() => {
    const loweredSearch = search.toLowerCase().trim();
    return data.filter((item) => {
      const matchesSearch =
        !loweredSearch ||
        item.indicator.toLowerCase().includes(loweredSearch) ||
        item.ikuNum.toLowerCase().includes(loweredSearch) ||
        item.unit.toLowerCase().includes(loweredSearch);
      const matchesIku = ikuFilter === 'semua' || item.ikuNum === ikuFilter;
      return matchesSearch && matchesIku;
    });
  }, [data, search, ikuFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) => {
      const aValue = String(a[sortKey] || '').toLowerCase();
      const bValue = String(b[sortKey] || '').toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [filteredRows, sortKey, sortDirection]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const pagedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (key: 'ikuNum' | 'indicator' | 'unit') => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
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
        <div className="border-b border-[var(--border)] px-5 py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Cari Data</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                  <Search size={15} />
                </span>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari indikator, IKU, atau satuan..."
                  className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm"
                />
              </div>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Filter IKU</span>
              <select
                value={ikuFilter}
                onChange={(e) => {
                  setIkuFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
              >
                <option value="semua">Semua IKU</option>
                {ikuOptions.map((iku) => (
                  <option key={iku} value={iku}>
                    {iku}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              Menampilkan <strong>{totalRows === 0 ? 0 : startIndex + 1}</strong>-<strong>{endIndex}</strong> dari <strong>{totalRows}</strong> data.
            </p>
            <label className="text-sm">
              <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Data/Halaman</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
                  <button type="button" onClick={() => handleSort('ikuNum')} className="inline-flex items-center gap-1">
                    IKU {sortKey === 'ikuNum' && (sortDirection === 'asc' ? <ArrowDownAZ size={13} /> : <ArrowUpAZ size={13} />)}
                  </button>
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
                  <button type="button" onClick={() => handleSort('indicator')} className="inline-flex items-center gap-1">
                    Indikator {sortKey === 'indicator' && (sortDirection === 'asc' ? <ArrowDownAZ size={13} /> : <ArrowUpAZ size={13} />)}
                  </button>
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-indigo-700">Target {year}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-700">Capaian {year}</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
                  <button type="button" onClick={() => handleSort('unit')} className="inline-flex items-center gap-1">
                    Satuan {sortKey === 'unit' && (sortDirection === 'asc' ? <ArrowDownAZ size={13} /> : <ArrowUpAZ size={13} />)}
                  </button>
                </th>
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((item) => {
                const targetValue = item.targets[year];
                const achievementValue = item.achievements ? item.achievements[year] : undefined;
                const info = getStatusInfo(achievementValue, targetValue);

                return (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-none hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-4 align-top text-sm font-semibold text-[var(--ink)]">{item.ikuNum}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5">{getIcon(item.ikuNum)}</span>
                        <span className="text-sm font-semibold leading-snug text-[var(--ink)]">{item.indicator}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top text-sm font-bold text-indigo-700">{formatValue(targetValue)}</td>
                    <td className="px-5 py-4 align-top text-sm font-bold text-emerald-700">{formatValue(achievementValue)}</td>
                    <td className="px-5 py-4 align-top text-sm text-[var(--ink)]">{item.unit}</td>
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
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-sm text-[var(--muted)]">
                    Tidak ada data sesuai pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
          <p className="text-sm text-[var(--muted)]">
            Halaman <strong>{safeCurrentPage}</strong> dari <strong>{totalPages}</strong>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sortedRows.slice(0, 4).map((item, idx) => {
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
                  <span>Progres</span>
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
