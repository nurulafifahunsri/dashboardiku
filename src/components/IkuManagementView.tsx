"use client";
import React, { useMemo, useState } from 'react';
import { IKUData, SasaranProgram, Year } from '../types';
import { ikuApi } from '../services/ikuApi';

interface Props {
  data: IKUData[];
  onDataChanged: () => Promise<void>;
}

const years: Year[] = ['2025', '2026', '2027', '2028', '2029', '2030'];

const emptyForm = (): IKUData => ({
  id: '',
  category: SasaranProgram.Talenta,
  ikuNum: 'IKU 1',
  indicator: '',
  unit: '%',
  targets: {
    '2025': '',
    '2026': '',
    '2027': '',
    '2028': '',
    '2029': '',
    '2030': '',
  },
  achievements: {
    '2025': '',
    '2026': '',
    '2027': '',
    '2028': '',
    '2029': '',
    '2030': '',
  },
});

const IkuManagementView: React.FC<Props> = ({ data, onDataChanged }) => {
  const [form, setForm] = useState<IKUData>(emptyForm());
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const byCategory = Object.values(SasaranProgram).map((category) => ({
      category,
      total: data.filter((item) => item.category === category).length,
    }));
    return byCategory;
  }, [data]);

  const updateFormField = (field: keyof IKUData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateYearField = (kind: 'targets' | 'achievements', year: Year, value: string) => {
    setForm((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        [year]: value,
      },
    }));
  };

  const resetState = () => {
    setForm(emptyForm());
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      if (isEditing && form.id) {
        await ikuApi.update(form.id, form);
        setMessage('Data berhasil diperbarui.');
      } else {
        await ikuApi.create(form);
        setMessage('Data berhasil ditambahkan.');
      }
      resetState();
      await onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: IKUData) => {
    setError('');
    setMessage('');
    setForm({
      ...item,
      targets: {
        ...emptyForm().targets,
        ...item.targets,
      },
      achievements: {
        ...emptyForm().achievements,
        ...item.achievements,
      },
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Hapus data ini?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await ikuApi.remove(id);
      setMessage('Data berhasil dihapus.');
      await onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await ikuApi.importExcel(file);
      setMessage(`${result.message}. Total baris: ${result.imported}`);
      await onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal import Excel');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Manajemen Data IKU</h2>
            <p className="text-sm text-[var(--muted)]">CRUD + Import/Export Excel (MySQL + Sequelize).</p>
          </div>
          <div className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
            Data source: MySQL
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {totals.map((item) => (
            <div key={item.category} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{item.category}</p>
              <p className="text-xl font-bold text-[var(--ink)]">{item.total}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]">
            Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button
            type="button"
            onClick={() => ikuApi.exportExcel()}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => onDataChanged()}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Refresh
          </button>
        </div>

        {message && <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Kategori</span>
              <select
                value={form.category}
                onChange={(e) => updateFormField('category', e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              >
                {Object.values(SasaranProgram).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">IKU</span>
              <input
                value={form.ikuNum}
                onChange={(e) => updateFormField('ikuNum', e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
                required
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Indikator</span>
            <input
              value={form.indicator}
              onChange={(e) => updateFormField('indicator', e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              required
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Satuan</span>
            <input
              value={form.unit}
              onChange={(e) => updateFormField('unit', e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2"
              required
            />
          </label>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="mb-2 text-sm font-bold text-[var(--ink)]">Target</p>
              <div className="grid grid-cols-2 gap-2">
                {years.map((year) => (
                  <label key={`target-${year}`} className="text-xs">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">{year}</span>
                    <input
                      value={String(form.targets[year] ?? '')}
                      onChange={(e) => updateYearField('targets', year, e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="mb-2 text-sm font-bold text-[var(--ink)]">Capaian</p>
              <div className="grid grid-cols-2 gap-2">
                {years.map((year) => (
                  <label key={`ach-${year}`} className="text-xs">
                    <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">{year}</span>
                    <input
                      value={String(form.achievements?.[year] ?? '')}
                      onChange={(e) => updateYearField('achievements', year, e.target.value)}
                      className="w-full rounded-md border border-[var(--border)] px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={loading}
              type="submit"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isEditing ? 'Update Data' : 'Tambah Data'}
            </button>
            <button
              type="button"
              onClick={resetState}
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-3 py-2 text-xs">IKU</th>
                <th className="px-3 py-2 text-xs">Kategori</th>
                <th className="px-3 py-2 text-xs">Indikator</th>
                <th className="px-3 py-2 text-xs">Unit</th>
                <th className="px-3 py-2 text-xs">Target 2026</th>
                <th className="px-3 py-2 text-xs">Capaian 2026</th>
                <th className="px-3 py-2 text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-sm font-semibold">{item.ikuNum}</td>
                  <td className="px-3 py-2 text-sm">{item.category}</td>
                  <td className="px-3 py-2 text-sm">{item.indicator}</td>
                  <td className="px-3 py-2 text-sm">{item.unit}</td>
                  <td className="px-3 py-2 text-sm">{item.targets['2026']}</td>
                  <td className="px-3 py-2 text-sm">{item.achievements?.['2026'] ?? '-'}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default IkuManagementView;
