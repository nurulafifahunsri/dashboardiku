"use client";

import React, { useState } from "react";
import { Eye, FileText, Image as ImageIcon, X } from "lucide-react";

interface Props {
  url?: string;
  name?: string;
  type?: string;
  emptyLabel?: string;
}

const isImageDocument = (url?: string, type?: string) =>
  Boolean(type?.startsWith("image/")) || Boolean(url && /\.(png|jpe?g|gif|webp)$/i.test(url));

const isPdfDocument = (url?: string, type?: string) =>
  type === "application/pdf" || Boolean(url && /\.pdf$/i.test(url));

const DocumentPreview: React.FC<Props> = ({ url, name, type, emptyLabel = "Belum ada dokumen" }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!url) {
    return <span className="text-xs text-[var(--muted)]">{emptyLabel}</span>;
  }

  const image = isImageDocument(url, type);
  const pdf = isPdfDocument(url, type);
  const label = name || "Dokumen indikator";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
      >
        {image ? <ImageIcon size={14} /> : <FileText size={14} />}
        Preview
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={() => setIsOpen(false)}
        >
          <div className="surface-card max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Preview Dokumen</p>
                <h3 className="display-font mt-1 truncate text-lg font-bold text-[var(--ink)]">{label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink)]"
                aria-label="Tutup preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-86px)] overflow-auto bg-[var(--surface-2)] p-4">
              {image && (
                <img src={url} alt={label} className="mx-auto max-h-[72vh] max-w-full rounded-xl border border-[var(--border)] bg-white object-contain" />
              )}
              {pdf && (
                <iframe title={label} src={url} className="h-[72vh] w-full rounded-xl border border-[var(--border)] bg-white" />
              )}
              {!image && !pdf && (
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
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentPreview;
