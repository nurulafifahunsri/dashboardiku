"use client";
import React, { useState, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    name: string;
    role: string;
    createdAt: string;
}

const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({ id: '', username: '', name: '', password: '', role: 'viewer' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Gagal mengambil data user');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setForm({ id: '', username: '', name: '', password: '', role: 'viewer' });
        setIsEditing(false);
        setError('');
        setMessage('');
    };

    const handleEdit = (u: User) => {
        setForm({ id: u.id, username: u.username, name: u.name, password: '', role: u.role });
        setIsEditing(true);
        setError('');
        setMessage('');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus user ini?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');
            setMessage('User berhasil dihapus');
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const url = isEditing && form.id ? `/api/users/${form.id}` : '/api/users';
            const method = isEditing && form.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Gagal menyimpan user');

            setMessage(`User berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`);
            resetForm();
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error submitting form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className="surface-card p-5 sm:p-6 rounded-3xl">
                <h2 className="text-2xl font-bold text-[var(--ink)] display-font">Manajemen User (Admin)</h2>
                <p className="text-sm text-[var(--muted)]">Kelola akun pengguna, ubah role, dan atur kredensial akses.</p>

                {message && <p className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 mt-4">{message}</p>}
                {error && <p className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 mt-4">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 mt-6">
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="block text-sm">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Username</span>
                            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-3 py-2" required />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Nama Lengkap</span>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-3 py-2" required />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Password {isEditing && <span className="lowercase text-amber-600 font-normal">(kosongkan jika tak diubah)</span>}</span>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-3 py-2" required={!isEditing} />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Role</span>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--ink)] bg-white">
                                <option value="admin">Admin</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button disabled={loading} type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {isEditing ? 'Simpan Perubahan' : 'Tambah User Baru'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="surface-card p-5 sm:p-6 rounded-3xl overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                            <th className="px-3 py-2 text-xs">Username</th>
                            <th className="px-3 py-2 text-xs">Nama Lengkap</th>
                            <th className="px-3 py-2 text-xs">Role</th>
                            <th className="px-3 py-2 text-xs text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-[var(--border)]">
                                <td className="px-3 py-2 text-sm font-semibold">{u.username}</td>
                                <td className="px-3 py-2 text-sm">{u.name}</td>
                                <td className="px-3 py-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                                </td>
                                <td className="px-3 py-2 text-sm text-right">
                                    <button onClick={() => handleEdit(u)} className="mr-2 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold">Edit</button>
                                    <button onClick={() => handleDelete(u.id)} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">Hapus</button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan={4} className="p-4 text-center text-sm text-[var(--muted)]">Belum ada user</td></tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default UserManagementView;
