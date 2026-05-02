"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, FileText, Image as ImageIcon, Share2, X } from "lucide-react";
import ModalShell from "./ModalShell";

interface Props {
  url?: string;
  name?: string;
  type?: string;
  emptyLabel?: string;
}

const documentPath = (url?: string, name?: string) => `${url || ""} ${name || ""}`.split("?")[0];

const isImageDocument = (url?: string, type?: string, name?: string) =>
  Boolean(type?.startsWith("image/")) || /\.(png|jpe?g|gif|webp)$/i.test(documentPath(url, name));

const isPdfDocument = (url?: string, type?: string, name?: string) =>
  type === "application/pdf" || /\.pdf$/i.test(documentPath(url, name));

const isCsvDocument = (url?: string, type?: string, name?: string) =>
  type === "text/csv" ||
  type === "application/csv" ||
  type === "application/vnd.ms-excel" ||
  /\.csv$/i.test(documentPath(url, name));

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
};

const DocumentPreview: React.FC<Props> = ({ url, name, type, emptyLabel = "Belum ada dokumen" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState("");

  const image = isImageDocument(url, type, name);
  const pdf = isPdfDocument(url, type, name);
  const csv = isCsvDocument(url, type, name);
  const label = name || "Dokumen indikator";
  const canShare = Boolean(url && !url.startsWith("blob:"));
  const shareLink = useMemo(() => {
    if (!url) return "";
    if (typeof window === "undefined") return url;
    return new URL(url, window.location.origin).toString();
  }, [url]);

  useEffect(() => {
    if (!isOpen || !url || !csv) return;

    let cancelled = false;
    setCsvRows([]);
    setCsvError("");
    setCsvLoading(true);

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat CSV");
        return response.text();
      })
      .then((text) => {
        if (!cancelled) setCsvRows(parseCsv(text));
      })
      .catch((error) => {
        if (!cancelled) setCsvError(error instanceof Error ? error.message : "Gagal memuat CSV");
      })
      .finally(() => {
        if (!cancelled) setCsvLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [csv, isOpen, url]);

  const csvColumnCount = useMemo(() => Math.max(0, ...csvRows.map((row) => row.length)), [csvRows]);

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareStatus("Link disalin");
    } catch {
      setShareStatus("Gagal menyalin link");
    }
  };

  if (!url) {
    return <span className="text-xs text-[var(--muted)]">{emptyLabel}</span>;
  }

  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
        >
          {image ? <ImageIcon size={14} /> : <FileText size={14} />}
          Preview
        </button>
        {canShare && (
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
          >
            {shareStatus === "Link disalin" ? <Check size={14} /> : <Share2 size={14} />}
            Share Link
          </button>
        )}
        {shareStatus && <span className="text-xs font-semibold text-[var(--muted)]">{shareStatus}</span>}
      </span>

      {isOpen && (
        <ModalShell
          onClose={() => setIsOpen(false)}
          ariaLabel={label}
          className="surface-card max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Preview Dokumen</p>
              <h3 className="display-font mt-1 truncate text-lg font-bold text-[var(--ink)]">{label}</h3>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {canShare && (
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
                >
                  <Copy size={14} />
                  Share
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                aria-label="Tutup preview"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="max-h-[calc(92vh-86px)] overflow-auto bg-[var(--surface-2)] p-4">
            {image && (
              <img src={url} alt={label} className="mx-auto max-h-[72vh] max-w-full rounded-xl border border-[var(--border)] bg-white object-contain" />
            )}
            {pdf && (
              <iframe title={label} src={url} className="h-[72vh] w-full rounded-xl border border-[var(--border)] bg-white" />
            )}
            {csv && (
              <div className="rounded-xl border border-[var(--border)] bg-white">
                {csvLoading && <p className="p-4 text-sm font-semibold text-[var(--muted)]">Memuat preview CSV...</p>}
                {csvError && <p className="p-4 text-sm font-semibold text-rose-700">{csvError}</p>}
                {!csvLoading && !csvError && csvRows.length > 0 && (
                  <div className="max-h-[72vh] overflow-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                      <tbody>
                        {csvRows.slice(0, 100).map((row, rowIndex) => (
                          <tr key={`csv-row-${rowIndex}`} className={rowIndex === 0 ? "bg-[var(--surface-2)] font-bold text-[var(--ink)]" : "border-t border-[var(--border)]"}>
                            {Array.from({ length: csvColumnCount }).map((_, columnIndex) => (
                              <td key={`csv-cell-${rowIndex}-${columnIndex}`} className="border-r border-[var(--border)] px-3 py-2 last:border-r-0">
                                {row[columnIndex] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 100 && (
                      <p className="border-t border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                        Preview menampilkan 100 baris pertama dari {csvRows.length} baris.
                      </p>
                    )}
                  </div>
                )}
                {!csvLoading && !csvError && csvRows.length === 0 && (
                  <p className="p-4 text-sm font-semibold text-[var(--muted)]">CSV kosong atau tidak memiliki baris data.</p>
                )}
              </div>
            )}
            {!image && !pdf && !csv && (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white text-center">
                <FileText size={36} className="text-[var(--muted)]" />
                <p className="text-sm font-semibold text-[var(--ink)]">Format dokumen tidak dapat dipreview langsung.</p>
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white">
                  <Eye size={14} />
                  Buka Dokumen
                </a>
              </div>
            )}
            </div>
        </ModalShell>
      )}
    </>
  );
};

export default DocumentPreview;
