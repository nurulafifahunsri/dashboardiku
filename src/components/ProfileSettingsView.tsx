"use client";
import React, { useEffect, useState } from 'react';

interface Props {
    user: {
        username: string;
        name: string;
        email: string;
        totpEnabled: boolean;
    };
    onRefreshSession: () => void;
}

const ProfileSettingsView: React.FC<Props> = ({ user, onRefreshSession }) => {
    const [profileForm, setProfileForm] = useState({ name: user.name, username: user.username, email: user.email });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [totpEnabled, setTotpEnabled] = useState(Boolean(user.totpEnabled));
    const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
    const [totpCode, setTotpCode] = useState('');

    const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
    const [passMsg, setPassMsg] = useState({ text: '', type: '' });
    const [totpMsg, setTotpMsg] = useState({ text: '', type: '' });
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [totpErrors, setTotpErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setProfileForm({ name: user.name, username: user.username, email: user.email });
        setTotpEnabled(Boolean(user.totpEnabled));
    }, [user.email, user.name, user.totpEnabled, user.username]);

    const inputClass = (errors: Record<string, string>, key: string) =>
        `w-full rounded-lg border px-4 py-2.5 text-sm ${errors[key] ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100' : 'border-[var(--border)]'}`;

    const fieldError = (errors: Record<string, string>, key: string) =>
        errors[key] ? <p className="mt-1 text-xs font-semibold text-rose-600">{errors[key]}</p> : null;

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg({ text: '', type: '' });
        const errors: Record<string, string> = {};
        if (!profileForm.username.trim()) errors.username = 'Username wajib diisi.';
        if (!profileForm.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
        if (!profileForm.email.trim()) errors.email = 'Email wajib diisi.';
        else if (!/\S+@\S+\.\S+/.test(profileForm.email)) errors.email = 'Format email tidak valid.';
        setProfileErrors(errors);
        if (Object.keys(errors).length) return;

        setLoading(true);

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProfileMsg({ text: 'Profil berhasil diperbarui', type: 'success' });
            onRefreshSession();
        } catch (err) {
            setProfileMsg({ text: err instanceof Error ? err.message : 'Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg({ text: '', type: '' });
        const errors: Record<string, string> = {};
        if (!passwordForm.currentPassword.trim()) errors.currentPassword = 'Password saat ini wajib diisi.';
        if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password baru minimal 8 karakter.';
        setPasswordErrors(errors);
        if (Object.keys(errors).length) return;

        setLoading(true);

        try {
            const res = await fetch('/api/users/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPassMsg({ text: 'Password berhasil diubah', type: 'success' });
            setPasswordForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setPassMsg({ text: err instanceof Error ? err.message : 'Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTotpSetup = async () => {
        setTotpMsg({ text: '', type: '' });
        setTotpErrors({});
        setLoading(true);

        try {
            const res = await fetch('/api/users/totp/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal membuat secret authenticator');

            setTotpSetup({ secret: data.secret, otpauthUrl: data.otpauthUrl });
            setTotpCode('');
            setTotpEnabled(false);
            setTotpMsg({ text: 'Secret dibuat. Masukkan kode 6 digit dari Google Authenticator untuk mengaktifkan.', type: 'success' });
        } catch (err) {
            setTotpMsg({ text: err instanceof Error ? err.message : 'Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTotpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setTotpMsg({ text: '', type: '' });
        const normalizedCode = totpCode.replace(/\s/g, '');
        const errors: Record<string, string> = {};
        if (!/^\d{6}$/.test(normalizedCode)) errors.code = 'Kode Google Authenticator wajib 6 digit.';
        setTotpErrors(errors);
        if (Object.keys(errors).length) return;

        setLoading(true);

        try {
            const res = await fetch('/api/users/totp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kode tidak valid');

            setTotpEnabled(true);
            setTotpSetup(null);
            setTotpCode('');
            setTotpMsg({ text: 'Google Authenticator berhasil diaktifkan.', type: 'success' });
            onRefreshSession();
        } catch (err) {
            setTotpMsg({ text: err instanceof Error ? err.message : 'Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTotpDisable = async () => {
        if (!window.confirm('Nonaktifkan Google Authenticator untuk akun ini?')) return;
        setTotpMsg({ text: '', type: '' });
        setLoading(true);

        try {
            const res = await fetch('/api/users/totp', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Gagal menonaktifkan authenticator');

            setTotpEnabled(false);
            setTotpSetup(null);
            setTotpCode('');
            setTotpMsg({ text: 'Google Authenticator dinonaktifkan.', type: 'success' });
            onRefreshSession();
        } catch (err) {
            setTotpMsg({ text: err instanceof Error ? err.message : 'Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <section className="surface-card p-5 sm:p-7 rounded-3xl">
                <h2 className="text-2xl font-bold text-[var(--ink)] display-font">Pengaturan Profil</h2>
                <p className="text-sm text-[var(--muted)] mb-6">Perbarui detail akun dan kredensial akses Anda.</p>

                <form onSubmit={handleProfileSubmit} noValidate className="space-y-4 max-w-md">
                    <h3 className="font-bold text-lg border-b border-[var(--border)] pb-2 mb-4">Informasi Akun</h3>
                    {profileMsg.text && (
                        <div className={`p-3 rounded-xl text-sm font-semibold ${profileMsg.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {profileMsg.text}
                        </div>
                    )}
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Username</span>
                        <input
                            value={profileForm.username}
                            onChange={e => {
                                setProfileForm({ ...profileForm, username: e.target.value });
                                setProfileErrors((prev) => ({ ...prev, username: '' }));
                            }}
                            aria-invalid={Boolean(profileErrors.username)}
                            className={inputClass(profileErrors, 'username')}
                        />
                        {fieldError(profileErrors, 'username')}
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Nama Lengkap</span>
                        <input
                            value={profileForm.name}
                            onChange={e => {
                                setProfileForm({ ...profileForm, name: e.target.value });
                                setProfileErrors((prev) => ({ ...prev, name: '' }));
                            }}
                            aria-invalid={Boolean(profileErrors.name)}
                            className={inputClass(profileErrors, 'name')}
                        />
                        {fieldError(profileErrors, 'name')}
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Email</span>
                        <input
                            type="email"
                            value={profileForm.email}
                            onChange={e => {
                                setProfileForm({ ...profileForm, email: e.target.value });
                                setProfileErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            aria-invalid={Boolean(profileErrors.email)}
                            className={inputClass(profileErrors, 'email')}
                        />
                        {fieldError(profileErrors, 'email')}
                    </label>
                    <div className="pt-2">
                        <button disabled={loading} type="submit" className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-black/80">Simpan Profil</button>
                    </div>
                </form>

                <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 mt-12 max-w-md">
                    <h3 className="font-bold text-lg border-b border-[var(--border)] pb-2 mb-4">Ubah Password</h3>
                    {passMsg.text && (
                        <div className={`p-3 rounded-xl text-sm font-semibold ${passMsg.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {passMsg.text}
                        </div>
                    )}
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Password Saat Ini</span>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={e => {
                                setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                                setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                            }}
                            aria-invalid={Boolean(passwordErrors.currentPassword)}
                            className={inputClass(passwordErrors, 'currentPassword')}
                        />
                        {fieldError(passwordErrors, 'currentPassword')}
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Password Baru</span>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => {
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                                setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                            }}
                            aria-invalid={Boolean(passwordErrors.newPassword)}
                            className={inputClass(passwordErrors, 'newPassword')}
                        />
                        {fieldError(passwordErrors, 'newPassword')}
                    </label>
                    <div className="pt-2">
                        <button disabled={loading} type="submit" className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-800">Perbarui Password</button>
                    </div>
                </form>

                <section className="mt-12 max-w-2xl">
                    <div className="mb-4 border-b border-[var(--border)] pb-2">
                        <h3 className="text-lg font-bold">Google Authenticator</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            Status: <span className={totpEnabled ? 'font-bold text-emerald-700' : 'font-bold text-amber-700'}>{totpEnabled ? 'Aktif' : 'Nonaktif'}</span>
                        </p>
                    </div>

                    {totpMsg.text && (
                        <div className={`mb-4 rounded-xl p-3 text-sm font-semibold ${totpMsg.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {totpMsg.text}
                        </div>
                    )}

                    {!totpSetup && (
                        <div className="flex flex-wrap gap-2">
                            {!totpEnabled && (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleTotpSetup}
                                    className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-800 disabled:opacity-60"
                                >
                                    Aktifkan Authenticator
                                </button>
                            )}
                            {totpEnabled && (
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleTotpDisable}
                                    className="rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 transition-all hover:bg-rose-50 disabled:opacity-60"
                                >
                                    Nonaktifkan
                                </button>
                            )}
                        </div>
                    )}

                    {totpSetup && (
                        <form onSubmit={handleTotpVerify} noValidate className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Manual Key</p>
                                <p className="mt-2 break-all font-mono text-sm font-bold text-[var(--ink)]">{totpSetup.secret}</p>
                                <a href={totpSetup.otpauthUrl} className="mt-3 inline-flex text-sm font-semibold text-emerald-700">
                                    Buka di aplikasi authenticator
                                </a>
                            </div>

                            <label className="block max-w-xs">
                                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Kode 6 Digit</span>
                                <input
                                    inputMode="numeric"
                                    value={totpCode}
                                    onChange={(e) => {
                                        setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setTotpErrors((prev) => ({ ...prev, code: '' }));
                                    }}
                                    placeholder="123456"
                                    aria-invalid={Boolean(totpErrors.code)}
                                    className={inputClass(totpErrors, 'code')}
                                />
                                {fieldError(totpErrors, 'code')}
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <button disabled={loading} type="submit" className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-800 disabled:opacity-60">
                                    Verifikasi dan Aktifkan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTotpSetup(null);
                                        setTotpCode('');
                                        setTotpErrors({});
                                    }}
                                    className="rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)]"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </section>
        </div>
    );
};

export default ProfileSettingsView;
