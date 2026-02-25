import React, { useState } from 'react';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (username: string, pass: string) => void;
  error?: string;
}

const LoginView: React.FC<Props> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_5%,rgba(23,98,74,0.2),transparent_28%),radial-gradient(circle_at_85%_90%,rgba(206,123,52,0.2),transparent_30%),linear-gradient(180deg,#f6faf4_0%,#edf4ff_100%)]" />
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className="surface-card panel-in rounded-3xl p-7 sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="display-font text-2xl font-bold text-[var(--ink)]">IKU Fasilkom</h1>
              <p className="text-sm text-[var(--muted)]">Performance Control Center</p>
            </div>
          </div>

          <h2 className="display-font max-w-sm text-3xl font-bold leading-tight text-[var(--ink)]">
            Pantau capaian target strategis secara lebih presisi.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Dashboard ini menyatukan metrik IKU, perbandingan target, dan area prioritas agar keputusan
            program bisa dieksekusi lebih cepat.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Akses</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Internal Fakultas</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Mode</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Target Monitoring</p>
            </div>
          </div>
        </section>

        <section className="surface-card panel-in rounded-3xl p-7 shadow-[var(--shadow-strong)] sm:p-9">
          <h3 className="display-font text-xl font-bold text-[var(--ink)]">Dashboard IKU Fasilkom</h3>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="animate-shake flex items-center gap-2 rounded-xl border border-rose-200 bg-[var(--danger-soft)] px-3 py-2.5 text-sm font-semibold text-[var(--danger)]">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Username</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                  <User size={17} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="adminFasilkom"
                  className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-3 text-sm font-medium text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Password</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-700">
                  <Lock size={17} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-3 text-sm font-medium text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition-all hover:translate-y-[-1px] hover:bg-emerald-800"
            >
              Sign In
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default LoginView;
