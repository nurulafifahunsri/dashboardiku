"use client";
import React, { useMemo, useState } from "react";
import { MasterYear, SUPPORTED_YEARS } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Props {
  years: MasterYear[];
  onRefresh: () => Promise<void>;
}

interface FormState {
  id: string;
  year: MasterYear["year"];
  label: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: FormState = {
  id: "",
  year: SUPPORTED_YEARS[0],
  label: "",
  isActive: true,
  sortOrder: Number(SUPPORTED_YEARS[0]),
};

const MasterYearManagementView: React.FC<Props> = ({ years, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [sortKey, setSortKey] = useState<"year" | "label" | "sortOrder">("year");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState<FormState>(defaultForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const usedYears = useMemo(() => new Set(years.map((y) => y.year)), [years]);
  const filteredRows = useMemo(() => {
    const lowered = search.toLowerCase().trim();
    return years.filter((item) => {
      const matchesSearch =
        !lowered ||
        item.year.toLowerCase().includes(lowered) ||
        item.label.toLowerCase().includes(lowered);
      const matchesStatus =
        statusFilter === "semua" ||
        (statusFilter === "aktif" ? item.isActive : !item.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [years, search, statusFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) => {
      const aValue = String(a[sortKey]).toLowerCase();
      const bValue = String(b[sortKey]).toLowerCase();
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
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

  const resetForm = () => {
    setForm(defaultForm);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = isEditing ? `/api/master-years/${form.id}` : "/api/master-years";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: form.year,
          label: form.label || `Tahun ${form.year}`,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan master tahun");
      }

      setMessage(isEditing ? "Master tahun berhasil diperbarui." : "Master tahun berhasil ditambahkan.");
      resetForm();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus tahun ini?")) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/master-years/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus master tahun");
      }
      setMessage("Master tahun berhasil dihapus.");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (year: MasterYear) => {
    setForm({
      id: year.id,
      year: year.year,
      label: year.label,
      isActive: year.isActive,
      sortOrder: year.sortOrder,
    });
    setIsEditing(true);
    setError("");
    setMessage("");
  };

  const handleSort = (key: "year" | "label" | "sortOrder") => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className="space-y-5">
      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Daftar Tahun</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Kelola daftar tahun untuk seluruh dashboard dan modul manajemen data.
        </p>

        {message && <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Tahun</span>
              <select
                value={form.year}
                onChange={(e) => {
                  const selected = e.target.value as MasterYear["year"];
                  setForm((prev) => ({ ...prev, year: selected, sortOrder: Number(selected) }));
                }}
                disabled={isEditing}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
              >
                {SUPPORTED_YEARS.map((year) => (
                  <option
                    key={year}
                    value={year}
                    disabled={!isEditing && usedYears.has(year)}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Label Tahun</span>
              <input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder={`Tahun ${form.year}`}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Urutan</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="flex items-end text-sm">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                <span className="font-medium text-[var(--ink)]">Aktif</span>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              <Plus size={16} />
              {isEditing ? "Simpan Perubahan" : "Tambah Tahun"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Cari Tahun</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari tahun atau label..."
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Filter Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "semua" | "aktif" | "nonaktif");
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            >
              <option value="semua">Semua</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("year")} className="font-semibold">
                    Tahun
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("label")} className="font-semibold">
                    Label
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">Status</th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("sortOrder")} className="font-semibold">
                    Urutan
                  </button>
                </th>
                <th className="px-3 py-2 text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((year) => (
                <tr key={year.id} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-sm font-semibold">{year.year}</td>
                  <td className="px-3 py-2 text-sm">{year.label}</td>
                  <td className="px-3 py-2 text-sm">{year.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="px-3 py-2 text-sm">{year.sortOrder}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(year)}
                      className="mr-2 inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(year.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      <Trash2 size={13} />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-[var(--muted)]">
                    Tidak ada data tahun sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
    </div>
  );
};

export default MasterYearManagementView;
