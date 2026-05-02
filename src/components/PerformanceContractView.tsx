"use client";

import React, { useMemo } from "react";
import { Download, FileText } from "lucide-react";
import { IKUData, Year } from "@/types";
import { buildPerformanceContractRows } from "@/lib/performanceContract";

interface Props {
  data: IKUData[];
  year: Year;
}

const PerformanceContractView: React.FC<Props> = ({ data, year }) => {
  const rows = useMemo(() => buildPerformanceContractRows(data, year), [data, year]);

  const exportPdf = () => {
    window.open(`/api/performance-contract/export?year=${year}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <header className="glass-surface panel-in rounded-3xl border border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[var(--primary)] p-2.5 text-white">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Kontrak Kinerja</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Format kontrak kinerja tahun {year} dengan kolom target dan realisasi mengikuti tahun aktif.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-800"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </header>

      <section className="surface-card panel-in overflow-hidden rounded-3xl">
        <div className="border-b border-[var(--border)] px-5 py-4 text-center">
          <h3 className="display-font text-lg font-bold text-[var(--ink)]">Kontrak Kinerja</h3>
          <p className="text-sm font-bold text-[var(--ink)]">Tahun {year}</p>
          <p className="text-sm font-bold text-[var(--ink)]">Dekan Fakultas Ilmu Komputer</p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)] text-center text-xs font-bold uppercase tracking-[0.08em] text-[var(--ink)]">
                <th className="border border-slate-400 px-2 py-2">No</th>
                <th className="border border-slate-400 px-3 py-2">Sasaran Program</th>
                <th className="border border-slate-400 px-3 py-2" colSpan={2}>Indikator Kinerja Utama Wajib</th>
                <th className="border border-slate-400 px-3 py-2">Satuan</th>
                <th className="border border-slate-400 px-3 py-2">Target</th>
                <th className="border border-slate-400 px-3 py-2">Realisasi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  {row.showCategory && (
                    <>
                      <td rowSpan={row.categoryRowSpan} className="border border-slate-400 px-2 py-2 text-center text-sm font-bold align-middle">
                        {row.categoryNo}
                      </td>
                      <td rowSpan={row.categoryRowSpan} className="border border-slate-400 px-3 py-2 text-center text-sm font-extrabold uppercase leading-snug align-middle">
                        {row.category}
                      </td>
                    </>
                  )}
                  {row.showIku && (
                    <td rowSpan={row.ikuRowSpan} className="w-20 border border-slate-400 px-2 py-2 text-center text-sm font-extrabold align-middle">
                      {row.ikuNum}
                    </td>
                  )}
                  <td className="border border-slate-400 px-3 py-2 font-semibold leading-snug">{row.indicator}</td>
                  <td className="border border-slate-400 px-3 py-2 text-center font-semibold">{row.unit}</td>
                  <td className="border border-slate-400 px-3 py-2 text-center font-semibold">{row.target}</td>
                  <td className="border border-slate-400 px-3 py-2 text-center font-semibold">{row.realization}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="border border-slate-400 px-3 py-8 text-center text-sm text-[var(--muted)]">
                    Tidak ada indikator untuk tahun {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PerformanceContractView;
