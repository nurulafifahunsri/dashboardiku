"use client";
import React, { useState } from 'react';

interface Props {
    user: {
        username: string;
        name: string;
    };
    onRefreshSession: () => void;
}

const ProfileSettingsView: React.FC<Props> = ({ user, onRefreshSession }) => {
    const [profileForm, setProfileForm] = useState({ name: user.name, username: user.username });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });

    const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
    const [passMsg, setPassMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setProfileMsg({ text: '', type: '' });

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
        setLoading(true);
        setPassMsg({ text: '', type: '' });

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

    return (
        <div className="space-y-6 max-w-4xl">
            <section className="surface-card p-5 sm:p-7 rounded-3xl">
                <h2 className="text-2xl font-bold text-[var(--ink)] display-font">Pengaturan Profil</h2>
                <p className="text-sm text-[var(--muted)] mb-6">Perbarui detail akun dan kredensial akses Anda.</p>

                <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                    <h3 className="font-bold text-lg border-b border-[var(--border)] pb-2 mb-4">Informasi Akun</h3>
                    {profileMsg.text && (
                        <div className={`p-3 rounded-xl text-sm font-semibold ${profileMsg.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {profileMsg.text}
                        </div>
                    )}
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Username</span>
                        <input value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm" required />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Nama Lengkap</span>
                        <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm" required />
                    </label>
                    <div className="pt-2">
                        <button disabled={loading} type="submit" className="rounded-xl bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-black/80">Simpan Profil</button>
                    </div>
                </form>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-12 max-w-md">
                    <h3 className="font-bold text-lg border-b border-[var(--border)] pb-2 mb-4">Ubah Password</h3>
                    {passMsg.text && (
                        <div className={`p-3 rounded-xl text-sm font-semibold ${passMsg.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {passMsg.text}
                        </div>
                    )}
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Password Saat Ini</span>
                        <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm" required />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Password Baru</span>
                        <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm" required />
                    </label>
                    <div className="pt-2">
                        <button disabled={loading} type="submit" className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-800">Perbarui Password</button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default ProfileSettingsView;
