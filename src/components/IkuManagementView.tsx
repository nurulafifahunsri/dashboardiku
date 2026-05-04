"use client";
import React, { useMemo, useState } from "react";
import { IKUData, IKUDocument, MasterYear, SasaranProgram, Year } from "../types";
import { ikuApi } from "../services/ikuApi";
import { ArrowDownAZ, ArrowUpAZ, Plus, Search, UploadCloud, X } from "lucide-react";
import DocumentPreview from "./DocumentPreview";
import ModalShell from "./ModalShell";
import { getDocumentForYear } from "@/lib/ikuYearlyDocuments";

interface Props {
  data: IKUData[];
  onDataChanged: () => Promise<void>;
  years: MasterYear[];
  year: Year;
}

type SortKey = "ikuNum" | "category" | "indicator" | "unit";
type SortDirection = "asc" | "desc";
type FormErrors = Record<string, string>;

const maxDocumentSize = 10 * 1024 * 1024;
const allowedDocumentTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp", "text/csv", "application/csv", "application/vnd.ms-excel"]);
const allowedDocumentExtensions = /\.(pdf|png|jpe?g|gif|webp|csv)$/i;

const emptyForm = (): IKUData => ({
  id: "",
  category: SasaranProgram.Talenta,
  ikuNum: "IKU 1",
  indicator: "",
  unit: "%",
  targets: {},
  achievements: {},
  documents: {},
  documentUrl: "",
  documentName: "",
  documentType: "",
});

const toComparableValue = (value: unknown) => String(value || "").toLowerCase();

const IkuManagementView: React.FC<Props> = ({ data, onDataChanged, years, year }) => {
  const availableYears = useMemo(
    () =>
      years
        .filter((year) => year.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.year) - Number(b.year))
        .map((year) => year.year),
    [years]
  );

  const currentYear = (availableYears.includes(year) ? year : availableYears[0] || "2026") as Year;

  const [form, setForm] = useState<IKUData>(emptyForm());
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [documentFiles, setDocumentFiles] = useState<Partial<Record<Year, File>>>({});
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState<Partial<Record<Year, string>>>({});
  const [documentInputKeys, setDocumentInputKeys] = useState<Record<Year, number>>({});

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("semua");
  const [ikuFilter, setIkuFilter] = useState<string>("semua");
  const [sortKey, setSortKey] = useState<SortKey>("ikuNum");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totals = useMemo(() => {
    return Object.values(SasaranProgram).map((category) => ({
      category,
      total: data.filter((item) => item.category === category).length,
    }));
  }, [data]);

  const ikuOptions = useMemo(() => {
    return Array.from(new Set(data.map((item) => item.ikuNum))).sort((a, b) => a.localeCompare(b, "id"));
  }, [data]);

  const filteredRows = useMemo(() => {
    const loweredSearch = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        !loweredSearch ||
        item.indicator.toLowerCase().includes(loweredSearch) ||
        item.ikuNum.toLowerCase().includes(loweredSearch) ||
        item.category.toLowerCase().includes(loweredSearch) ||
        item.unit.toLowerCase().includes(loweredSearch);

      const matchesCategory = categoryFilter === "semua" || item.category === categoryFilter;
      const matchesIku = ikuFilter === "semua" || item.ikuNum === ikuFilter;
      return matchesSearch && matchesCategory && matchesIku;
    });
  }, [data, search, categoryFilter, ikuFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];
    rows.sort((a, b) => {
      const aValue = toComparableValue(a[sortKey]);
      const bValue = toComparableValue(b[sortKey]);
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

  const updateFormField = (field: keyof IKUData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const updateYearField = (kind: "targets" | "achievements", year: Year, value: string) => {
    setForm((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        [year]: value,
      },
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[`${kind}.${year}`];
      return next;
    });
  };

  const fieldClass = (key: string, base: string) =>
    `${base} ${formErrors[key] ? "border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" : ""}`;

  const fieldError = (key: string) =>
    formErrors[key] ? <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors[key]}</p> : null;

  const validateForm = (payload: IKUData, files: Partial<Record<Year, File>>) => {
    const errors: FormErrors = {};
    if (!payload.category?.trim()) errors.category = "Kategori wajib dipilih.";
    if (!payload.ikuNum?.trim()) errors.ikuNum = "IKU wajib diisi.";
    if (!payload.indicator?.trim()) errors.indicator = "Indikator wajib diisi.";
    if (!payload.unit?.trim()) errors.unit = "Satuan wajib diisi.";

    availableYears.forEach((year) => {
      const target = String(payload.targets?.[year] ?? "");
      const realization = String(payload.achievements?.[year] ?? "");
      if (target.length > 64) errors[`targets.${year}`] = "Target maksimal 64 karakter.";
      if (realization.length > 64) errors[`achievements.${year}`] = "Realisasi maksimal 64 karakter.";
    });

    (Object.entries(files) as [Year, File][]).forEach(([documentYear, file]) => {
      if (!allowedDocumentTypes.has(file.type) && !allowedDocumentExtensions.test(file.name)) errors[`documents.${documentYear}`] = "Dokumen harus berupa PDF, gambar, atau CSV.";
      if (file.size > maxDocumentSize) errors[`documents.${documentYear}`] = "Ukuran dokumen maksimal 10MB.";
    });

    return errors;
  };

  const revokePreviewUrl = (url?: string) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const handleDocumentChange = (documentYear: Year, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    revokePreviewUrl(documentPreviewUrls[documentYear]);
    setDocumentFiles((prev) => {
      const next = { ...prev };
      if (file) next[documentYear] = file;
      else delete next[documentYear];
      return next;
    });
    setDocumentPreviewUrls((prev) => {
      const next = { ...prev };
      if (file) next[documentYear] = URL.createObjectURL(file);
      else delete next[documentYear];
      return next;
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.document;
      delete next[`documents.${documentYear}`];
      return next;
    });
  };

  const clearSelectedDocument = (documentYear?: Year) => {
    if (documentYear) {
      revokePreviewUrl(documentPreviewUrls[documentYear]);
      setDocumentFiles((prev) => {
        const next = { ...prev };
        delete next[documentYear];
        return next;
      });
      setDocumentPreviewUrls((prev) => {
        const next = { ...prev };
        delete next[documentYear];
        return next;
      });
      setDocumentInputKeys((prev) => ({ ...prev, [documentYear]: prev[documentYear] + 1 }));
      return;
    }

    Object.values(documentPreviewUrls).forEach(revokePreviewUrl);
    setDocumentFiles({});
    setDocumentPreviewUrls({});
    setDocumentInputKeys({});
  };

  const resetState = () => {
    clearSelectedDocument();
    setForm(emptyForm());
    setIsEditing(false);
    setIsFormOpen(false);
    setFormErrors({});
  };

  const openCreateForm = () => {
    setError("");
    setMessage("");
    clearSelectedDocument();
    setForm(emptyForm());
    setIsEditing(false);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const validationErrors = validateForm(form, documentFiles);
    if (Object.keys(validationErrors).length) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      const uploadedDocuments: Partial<Record<Year, IKUDocument>> = { ...(form.documents || {}) };

      for (const documentYear of availableYears) {
        const file = documentFiles[documentYear];
        if (file) uploadedDocuments[documentYear] = await ikuApi.uploadDocument(file);
      }

      const payload = { ...form, documents: uploadedDocuments };

      if (isEditing && form.id) {
        await ikuApi.update(form.id, payload);
        setMessage("Data berhasil diperbarui.");
      } else {
        await ikuApi.create(payload);
        setMessage("Data berhasil ditambahkan.");
      }
      resetState();
      await onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: IKUData) => {
    setError("");
    setMessage("");
    clearSelectedDocument();
    setFormErrors({});
    setForm({
      ...item,
      targets: { ...emptyForm().targets, ...item.targets },
      achievements: { ...emptyForm().achievements, ...item.achievements },
      documents: { ...item.documents },
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Hapus data ini?");
    if (!confirmed) return;

    try {
      setLoading(true);
      await ikuApi.remove(id);
      setMessage("Data berhasil dihapus.");
      await onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus data");
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
      setError(err instanceof Error ? err.message : "Gagal import Excel");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleSort = (key: SortKey) => {
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Manajemen Data IKU</h2>
            <p className="text-sm text-[var(--muted)]">Kelola data IKU, import/export Excel, dan pantau rekap indikator.</p>
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
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]">
            Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <button type="button" onClick={() => ikuApi.exportExcel()} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]">
            Export Excel
          </button>
          <button type="button" onClick={() => onDataChanged()} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]">
            Refresh
          </button>
          <button type="button" onClick={openCreateForm} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-bold text-white">
            <Plus size={16} />
            Tambah Data
          </button>
        </div>

        {message && <p className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="mb-4 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        {isFormOpen && (
          <ModalShell
            onClose={resetState}
            labelledBy="iku-form-title"
            className="surface-card max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div>
                <h3 id="iku-form-title" className="display-font text-xl font-bold text-[var(--ink)]">{isEditing ? "Edit Data IKU" : "Tambah Data IKU"}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">Isi indikator, target, realisasi, dan dokumen pendukung.</p>
              </div>
              <button
                type="button"
                onClick={resetState}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                aria-label="Tutup form"
              >
                <X size={18} />
              </button>
            </div>

        <form onSubmit={handleSubmit} noValidate className="max-h-[calc(92vh-86px)] space-y-5 overflow-auto bg-[var(--surface-2)] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Kategori</span>
              <select
                value={form.category}
                onChange={(e) => updateFormField("category", e.target.value)}
                aria-invalid={Boolean(formErrors.category)}
                className={fieldClass("category", "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5")}
              >
                {Object.values(SasaranProgram).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {fieldError("category")}
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">IKU</span>
              <input
                value={form.ikuNum}
                onChange={(e) => updateFormField("ikuNum", e.target.value)}
                aria-invalid={Boolean(formErrors.ikuNum)}
                className={fieldClass("ikuNum", "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5")}
              />
              {fieldError("ikuNum")}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Indikator</span>
              <input
                value={form.indicator}
                onChange={(e) => updateFormField("indicator", e.target.value)}
                aria-invalid={Boolean(formErrors.indicator)}
                className={fieldClass("indicator", "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5")}
              />
              {fieldError("indicator")}
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Satuan</span>
              <input
                value={form.unit}
                onChange={(e) => updateFormField("unit", e.target.value)}
                aria-invalid={Boolean(formErrors.unit)}
                className={fieldClass("unit", "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5")}
              />
              {fieldError("unit")}
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3 sm:p-4">
              <p className="mb-3 text-sm font-bold text-[var(--ink)]">Target</p>
              <div className="grid grid-cols-2 gap-3">
                {availableYears.map((year) => (
                  <label key={`target-${year}`} className="text-xs">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[var(--muted)]">{year}</span>
                    <input
                      value={String(form.targets[year as Year] ?? "")}
                      onChange={(e) => updateYearField("targets", year as Year, e.target.value)}
                      aria-invalid={Boolean(formErrors[`targets.${year}`])}
                      className={fieldClass(`targets.${year}`, "w-full rounded-md border border-[var(--border)] px-2.5 py-2")}
                    />
                    {fieldError(`targets.${year}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-3 sm:p-4">
              <p className="mb-3 text-sm font-bold text-[var(--ink)]">Realisasi</p>
              <div className="grid grid-cols-2 gap-3">
                {availableYears.map((year) => (
                  <label key={`achievement-${year}`} className="text-xs">
                    <span className="mb-1.5 block text-[11px] font-semibold text-[var(--muted)]">{year}</span>
                    <input
                      value={String(form.achievements?.[year as Year] ?? "")}
                      onChange={(e) => updateYearField("achievements", year as Year, e.target.value)}
                      aria-invalid={Boolean(formErrors[`achievements.${year}`])}
                      className={fieldClass(`achievements.${year}`, "w-full rounded-md border border-[var(--border)] px-2.5 py-2")}
                    />
                    {fieldError(`achievements.${year}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-3 sm:p-4">
            <p className="mb-3 text-sm font-bold text-[var(--ink)]">Dokumen Pendukung per Tahun</p>
            <div className="grid gap-3 md:grid-cols-2">
              {availableYears.map((documentYear) => {
                const selectedFile = documentFiles[documentYear];
                const previewUrl = documentPreviewUrls[documentYear];
                const document = getDocumentForYear(form, documentYear);
                const hasPreview = Boolean(previewUrl || document.documentUrl);

                return (
                  <div key={`document-${documentYear}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{documentYear}</p>
                      {selectedFile && (
                        <button type="button" onClick={() => clearSelectedDocument(documentYear)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-700">
                          <X size={12} />
                          Batalkan
                        </button>
                      )}
                    </div>
                    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-3 text-center ${formErrors[`documents.${documentYear}`] ? "border-rose-400 bg-rose-50" : "border-[var(--border)] bg-white"}`}>
                      <UploadCloud size={18} className="text-emerald-700" />
                      <span className="text-xs font-semibold text-[var(--ink)]">Unggah dokumen</span>
                      <input
                        key={documentInputKeys[documentYear] ?? 0}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/gif,image/webp,text/csv,application/csv,application/vnd.ms-excel,.csv"
                        className="hidden"
                        onChange={(event) => handleDocumentChange(documentYear, event)}
                        aria-invalid={Boolean(formErrors[`documents.${documentYear}`])}
                      />
                    </label>
                    {fieldError(`documents.${documentYear}`)}
                    {hasPreview && (
                      <div className="mt-2">
                        <DocumentPreview
                          url={previewUrl || document.documentUrl}
                          name={selectedFile?.name || document.documentName}
                          type={selectedFile?.type || document.documentType}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button disabled={loading} type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {isEditing ? "Simpan Perubahan" : "Tambah Data"}
            </button>
            <button type="button" onClick={resetState} className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]">
              Batal
            </button>
          </div>
        </form>
          </ModalShell>
        )}
      </section>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
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
                placeholder="Cari indikator, IKU, kategori..."
                className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Filter Kategori</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            >
              <option value="semua">Semua Kategori</option>
              {Object.values(SasaranProgram).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
              <option value="semua">Semua</option>
              {ikuOptions.map((iku) => (
                <option key={iku} value={iku}>
                  {iku}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Data per Halaman</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <p className="mb-3 text-sm text-[var(--muted)]">
          Menampilkan <strong>{totalRows === 0 ? 0 : startIndex + 1}</strong>-<strong>{endIndex}</strong> dari <strong>{totalRows}</strong> data (total data sumber: <strong>{data.length}</strong>).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("ikuNum")} className="inline-flex items-center gap-1 font-semibold">
                    IKU {sortKey === "ikuNum" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("category")} className="inline-flex items-center gap-1 font-semibold">
                    Kategori {sortKey === "category" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("indicator")} className="inline-flex items-center gap-1 font-semibold">
                    Indikator {sortKey === "indicator" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("unit")} className="inline-flex items-center gap-1 font-semibold">
                    Satuan {sortKey === "unit" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">Target {currentYear}</th>
                <th className="px-3 py-2 text-xs">Realisasi {currentYear}</th>
                <th className="px-3 py-2 text-xs">Dokumen {currentYear}</th>
                <th className="px-3 py-2 text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((item) => {
                const document = getDocumentForYear(item, currentYear);

                return (
                  <tr key={item.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 text-sm font-semibold">{item.ikuNum}</td>
                    <td className="px-3 py-2 text-sm">{item.category}</td>
                    <td className="px-3 py-2 text-sm">{item.indicator}</td>
                    <td className="px-3 py-2 text-sm">{item.unit}</td>
                    <td className="px-3 py-2 text-sm">{item.targets[currentYear] ?? "-"}</td>
                    <td className="px-3 py-2 text-sm">{item.achievements?.[currentYear] ?? "-"}</td>
                    <td className="px-3 py-2 text-sm">
                      <DocumentPreview url={document.documentUrl} name={document.documentName} type={document.documentType} emptyLabel="-" />
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(item)} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id)} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                    Tidak ada data sesuai filter.
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

export default IkuManagementView;
