"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  createdAt: string;
}

type SortKey = "username" | "name" | "email" | "role";
type SortDirection = "asc" | "desc";

const UserManagementView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("semua");
  const [sortKey, setSortKey] = useState<SortKey>("username");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [form, setForm] = useState({ id: "", username: "", name: "", email: "", password: "", role: "viewer" });
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal mengambil data user");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({ id: "", username: "", name: "", email: "", password: "", role: "viewer" });
    setIsEditing(false);
    setError("");
    setMessage("");
  };

  const handleEdit = (user: User) => {
    setForm({ id: user.id, username: user.username, name: user.name, email: user.email, password: "", role: user.role });
    setIsEditing(true);
    setError("");
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus user ini?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus user");
      setMessage("User berhasil dihapus.");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const url = isEditing && form.id ? `/api/users/${form.id}` : "/api/users";
      const method = isEditing && form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan user");

      setMessage(`User berhasil ${isEditing ? "diperbarui" : "ditambahkan"}.`);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const loweredSearch = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !loweredSearch ||
        user.username.toLowerCase().includes(loweredSearch) ||
        user.name.toLowerCase().includes(loweredSearch) ||
        user.email.toLowerCase().includes(loweredSearch);
      const matchesRole = roleFilter === "semua" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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
        <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Manajemen User (Admin)</h2>
        <p className="text-sm text-[var(--muted)]">Kelola akun pengguna, email, role, dan kredensial akses.</p>

        {message && <p className="mt-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Username</span>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5" required />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Nama Lengkap</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5" required />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5" required />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Password {isEditing && <span className="normal-case text-amber-600">(kosongkan jika tidak diubah)</span>}
              </span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5" required={!isEditing} />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Role</span>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[var(--ink)]">
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button disabled={loading} type="submit" className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {isEditing ? "Simpan Perubahan" : "Tambah User Baru"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                Batal
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="surface-card rounded-3xl p-5 sm:p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Cari User</span>
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
                placeholder="Cari username, nama, email..."
                className="w-full rounded-lg border border-[var(--border)] bg-white py-2.5 pl-9 pr-3 text-sm"
              />
            </div>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Filter Role</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm"
            >
              <option value="semua">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--muted)]">
            Menampilkan <strong>{totalRows === 0 ? 0 : startIndex + 1}</strong>-<strong>{endIndex}</strong> dari <strong>{totalRows}</strong> data (total data sumber: <strong>{users.length}</strong>).
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
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("username")} className="inline-flex items-center gap-1 font-semibold">
                    Username {sortKey === "username" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("name")} className="inline-flex items-center gap-1 font-semibold">
                    Nama Lengkap {sortKey === "name" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("email")} className="inline-flex items-center gap-1 font-semibold">
                    Email {sortKey === "email" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs">
                  <button type="button" onClick={() => handleSort("role")} className="inline-flex items-center gap-1 font-semibold">
                    Role {sortKey === "role" && (sortDirection === "asc" ? <ArrowDownAZ size={14} /> : <ArrowUpAZ size={14} />)}
                  </button>
                </th>
                <th className="px-3 py-2 text-xs text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border)]">
                  <td className="px-3 py-2 text-sm font-semibold">{user.username}</td>
                  <td className="px-3 py-2 text-sm">{user.name}</td>
                  <td className="px-3 py-2 text-sm">{user.email}</td>
                  <td className="px-3 py-2 text-sm uppercase">{user.role}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleEdit(user)} className="mr-2 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {pagedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-sm text-[var(--muted)]">
                    Tidak ada data user.
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

export default UserManagementView;
