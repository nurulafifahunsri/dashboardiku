"use client";
import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Lock } from "lucide-react";

interface Props {
  token: string;
  onBackToLogin: () => void;
}

const ResetPasswordView: React.FC<Props> = ({ token, onBackToLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mereset password");
      }
      setMessage(data.message || "Password berhasil diperbarui");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_5%,rgba(23,98,74,0.2),transparent_28%),radial-gradient(circle_at_85%_90%,rgba(206,123,52,0.2),transparent_30%),linear-gradient(180deg,#f6faf4_0%,#edf4ff_100%)]" />
      <div className="surface-card w-full max-w-xl rounded-3xl p-7 shadow-[var(--shadow-strong)] sm:p-9">
        <button
          type="button"
          onClick={onBackToLogin}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]"
        >
          <ArrowLeft size={16} />
          Kembali ke Login
        </button>

        <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Reset Password</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Masukkan password baru Anda. Pastikan kombinasi kuat dan mudah Anda ingat.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{message}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Password Baru</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                <KeyRound size={17} />
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-3 text-sm font-medium text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Konfirmasi Password Baru</span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                <Lock size={17} />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-3 text-sm font-medium text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-800 disabled:opacity-70"
          >
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordView;
