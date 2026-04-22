"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  Globe,
  Settings,
  ChevronRight,
  CalendarClock,
  LogOut,
  Database,
  User,
  KeyRound,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { IKUData, MasterYear, SasaranProgram, Year } from "../types";
import DashboardView from "../components/DashboardView";
import CategoryView from "../components/CategoryView";
import LoginView from "../components/LoginView";
import IkuManagementView from "../components/IkuManagementView";
import UserManagementView from "../components/UserManagementView";
import ProfileSettingsView from "../components/ProfileSettingsView";
import ForgotPasswordView from "../components/ForgotPasswordView";
import ResetPasswordView from "../components/ResetPasswordView";
import MasterYearManagementView from "../components/MasterYearManagementView";
import { ikuApi } from "../services/ikuApi";

type MenuKey =
  | "dashboard"
  | "talenta"
  | "inovasi"
  | "kontribusi"
  | "tata-kelola"
  | "manajemen-data"
  | "manajemen-user"
  | "master-tahun"
  | "profil"
  | "login"
  | "lupa-password"
  | "reset-password";

interface UserSession {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
}

const PUBLIC_MENUS: MenuKey[] = [
  "dashboard",
  "talenta",
  "inovasi",
  "kontribusi",
  "tata-kelola",
  "login",
  "lupa-password",
  "reset-password",
];

const PRIVATE_MENUS: MenuKey[] = ["manajemen-data", "manajemen-user", "master-tahun", "profil"];

const menuLabels: Record<MenuKey, string> = {
  dashboard: "Dasbor",
  talenta: SasaranProgram.Talenta,
  inovasi: SasaranProgram.Inovasi,
  kontribusi: SasaranProgram.Kontribusi,
  "tata-kelola": SasaranProgram.TataKelola,
  "manajemen-data": "Manajemen Data",
  "manajemen-user": "Manajemen User",
  "master-tahun": "Daftar Tahun",
  profil: "Profil",
  login: "Masuk",
  "lupa-password": "Lupa Password",
  "reset-password": "Reset Password",
};

const menuIcons: Partial<Record<MenuKey, React.ElementType>> = {
  dashboard: LayoutDashboard,
  talenta: Users,
  inovasi: Lightbulb,
  kontribusi: Globe,
  "tata-kelola": Settings,
  "manajemen-data": Database,
  "manajemen-user": Users,
  "master-tahun": CalendarClock,
  profil: User,
};

const toValidMenu = (value: string | null): MenuKey => {
  const normalized = (value || "dashboard") as MenuKey;
  if (Object.keys(menuLabels).includes(normalized)) {
    return normalized;
  }
  return "dashboard";
};

const isPrivateMenu = (menu: MenuKey) => PRIVATE_MENUS.includes(menu);

function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [ikuData, setIkuData] = useState<IKUData[]>([]);
  const [masterYears, setMasterYears] = useState<MasterYear[]>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menu = toValidMenu(searchParams.get("menu"));
  const nextMenu = toValidMenu(searchParams.get("next"));
  const resetToken = searchParams.get("token") || "";
  const yearParam = searchParams.get("year");

  const activeYears = useMemo(
    () =>
      masterYears
        .filter((year) => year.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || Number(a.year) - Number(b.year)),
    [masterYears]
  );

  const fallbackYear = activeYears[0]?.year || "2026";
  const isYearValid = Boolean(yearParam && activeYears.find((year) => year.year === yearParam));
  const selectedYear = (yearParam && activeYears.find((year) => year.year === yearParam)?.year) || fallbackYear;

  const currentMenuLabel = menuLabels[menu];

  const pushUrl = (targetMenu: MenuKey, extras?: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("menu", targetMenu);
    if (selectedYear) params.set("year", selectedYear);
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      });
    }
    router.push(`/?${params.toString()}`);
  };

  const goToMenu = (targetMenu: MenuKey) => {
    if (!isAuthenticated && isPrivateMenu(targetMenu)) {
      pushUrl("login", { next: targetMenu });
      return;
    }
    pushUrl(targetMenu, { next: null, token: targetMenu === "reset-password" ? resetToken : null });
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const refreshIkuData = async () => {
    try {
      const serverData = await ikuApi.fetchAll();
      setIkuData(serverData);
    } catch {
      setIkuData([]);
    }
  };

  const refreshMasterYears = async () => {
    setIsLoadingYears(true);
    try {
      const res = await fetch("/api/master-years");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMasterYears(data);
      } else {
        setMasterYears([]);
      }
    } catch {
      setMasterYears([]);
    } finally {
      setIsLoadingYears(false);
    }
  };

  useEffect(() => {
    checkSession();
    refreshIkuData();
    refreshMasterYears();
  }, []);

  useEffect(() => {
    if (!isLoadingYears && fallbackYear && (!yearParam || !isYearValid)) {
      pushUrl(menu, { year: fallbackYear });
    }
  }, [isLoadingYears, yearParam, isYearValid, fallbackYear, menu]);

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated && isPrivateMenu(menu)) {
      pushUrl("login", { next: menu });
    }
  }, [isCheckingAuth, isAuthenticated, menu]);

  const handleLoginSuccess = async () => {
    await checkSession();
    const target = nextMenu && isPrivateMenu(nextMenu) ? nextMenu : "dashboard";
    pushUrl(target, { next: null });
  };

  const confirmLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setUser(null);
    setShowLogoutModal(false);
    pushUrl("dashboard", { next: null });
  };

  const publicNavMenus: MenuKey[] = ["dashboard", "talenta", "inovasi", "kontribusi", "tata-kelola"];
  const privateNavMenus: MenuKey[] = isAuthenticated
    ? [
        "manajemen-data",
        ...(user?.role === "admin" ? (["manajemen-user", "master-tahun"] as MenuKey[]) : []),
        "profil",
      ]
    : [];

  const currentCategory = useMemo(() => {
    if (menu === "talenta") return SasaranProgram.Talenta;
    if (menu === "inovasi") return SasaranProgram.Inovasi;
    if (menu === "kontribusi") return SasaranProgram.Kontribusi;
    if (menu === "tata-kelola") return SasaranProgram.TataKelola;
    return null;
  }, [menu]);

  if (isCheckingAuth || isLoadingYears) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-bold">Memuat data...</div>
      </div>
    );
  }

  const renderMainContent = () => {
    if (menu === "login" && !isAuthenticated) {
      return (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => pushUrl("lupa-password", { next: null })}
          onBackToDashboard={() => pushUrl("dashboard", { next: null })}
        />
      );
    }

    if (menu === "lupa-password") {
      return <ForgotPasswordView onBack={() => pushUrl("login", { next: null })} />;
    }

    if (menu === "reset-password") {
      if (!resetToken) {
        return (
          <div className="surface-card mx-auto mt-8 max-w-xl rounded-3xl p-6 text-center">
            <h2 className="display-font text-2xl font-bold text-[var(--ink)]">Token Reset Tidak Ditemukan</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tautan reset password tidak valid. Silakan ulangi proses lupa password.
            </p>
            <button
              type="button"
              onClick={() => pushUrl("lupa-password", { token: null })}
              className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white"
            >
              Ke Halaman Lupa Password
            </button>
          </div>
        );
      }
      return <ResetPasswordView token={resetToken} onBackToLogin={() => pushUrl("login", { token: null, next: null })} />;
    }

    if (menu === "dashboard") {
      return <DashboardView year={selectedYear as Year} data={ikuData} availableYears={activeYears.map((item) => item.year)} />;
    }

    if (currentCategory) {
      const filteredData = ikuData.filter((item) => item.category === currentCategory);
      return <CategoryView category={currentCategory} data={filteredData} year={selectedYear as Year} />;
    }

    if (!isAuthenticated && isPrivateMenu(menu)) {
      return (
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onForgotPassword={() => pushUrl("lupa-password", { next: null })}
          onBackToDashboard={() => pushUrl("dashboard", { next: null })}
        />
      );
    }

    if (menu === "manajemen-data") {
      return <IkuManagementView data={ikuData} onDataChanged={refreshIkuData} years={activeYears} />;
    }

    if (menu === "manajemen-user") {
      if (user?.role !== "admin") {
        return (
          <div className="surface-card rounded-3xl p-6">
            <h2 className="display-font text-xl font-bold text-[var(--ink)]">Akses Ditolak</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Menu ini hanya dapat diakses oleh admin.</p>
          </div>
        );
      }
      return <UserManagementView />;
    }

    if (menu === "master-tahun") {
      if (user?.role !== "admin") {
        return (
          <div className="surface-card rounded-3xl p-6">
            <h2 className="display-font text-xl font-bold text-[var(--ink)]">Akses Ditolak</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Menu ini hanya dapat diakses oleh admin.</p>
          </div>
        );
      }
      return <MasterYearManagementView years={masterYears} onRefresh={refreshMasterYears} />;
    }

    if (menu === "profil") {
      return <ProfileSettingsView user={user!} onRefreshSession={checkSession} />;
    }

    return <DashboardView year={selectedYear as Year} data={ikuData} availableYears={activeYears.map((item) => item.year)} />;
  };

  const isAuthPage = menu === "login" || menu === "lupa-password" || menu === "reset-password";
  if (isAuthPage && !isAuthenticated) {
    return <>{renderMainContent()}</>;
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1450px] gap-4 lg:gap-6">
        <aside className="glass-surface sticky top-4 hidden h-fit w-[300px] flex-shrink-0 self-start rounded-3xl border border-[var(--border)] p-4 shadow-[var(--shadow-soft)] md:flex md:flex-col">
          <div className="rounded-2xl bg-[var(--primary)] p-5 text-white">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <span className="display-font text-sm">IKU</span>
            </div>
            <h1 className="display-font text-xl font-bold">Dasbor IKU Fasilkom</h1>
            <p className="mt-1 text-xs text-emerald-100/90">
              {isAuthenticated ? `Halo, ${user?.name}` : "Dasbor publik terbuka untuk semua pengunjung"}
            </p>
            {isAuthenticated && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em]">{user?.role}</p>}
          </div>

          <nav className="mt-5 space-y-1.5 pr-2">
            {publicNavMenus.map((item) => {
              const Icon = menuIcons[item]!;
              return (
                <button
                  key={item}
                  onClick={() => goToMenu(item)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                    menu === item
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-emerald-950/20"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                  }`}
                >
                  <Icon size={18} className={menu === item ? "text-white" : "text-emerald-700/80 group-hover:text-emerald-700"} />
                  <span>{menuLabels[item]}</span>
                  {menu === item && <ChevronRight size={14} className="ml-auto opacity-85" />}
                </button>
              );
            })}

            {isAuthenticated && (
              <div className="my-3 border-t border-[var(--border)] pt-3">
                {privateNavMenus.map((menuKey) => {
                  const Icon = menuIcons[menuKey]!;
                  return (
                    <button
                      key={menuKey}
                      onClick={() => goToMenu(menuKey)}
                      className={`group mb-1.5 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                        menu === menuKey
                          ? "bg-[var(--primary)] text-white shadow-lg shadow-emerald-950/20"
                          : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <Icon size={18} className={menu === menuKey ? "text-white" : "text-emerald-700/80 group-hover:text-emerald-700"} />
                      <span>{menuLabels[menuKey]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="space-y-3 pt-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <CalendarClock size={14} />
                Tahun Evaluasi
              </div>
              <select
                value={selectedYear}
                onChange={(e) => pushUrl(menu, { year: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
              >
                {activeYears.map((year) => (
                  <option key={year.id} value={year.year}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-50 hover:text-rose-800"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <button
                onClick={() => pushUrl("login", { next: null })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ShieldCheck size={16} />
                Login untuk Menu Internal
              </button>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="glass-surface mb-4 rounded-2xl border border-[var(--border)] px-4 py-3 shadow-[var(--shadow-soft)] md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="display-font text-base font-bold text-[var(--ink)]">IKU Fasilkom</p>
                <p className="text-xs text-[var(--muted)]">{currentMenuLabel}</p>
              </div>
              {isAuthenticated ? (
                <button onClick={() => setShowLogoutModal(true)} className="text-xs font-semibold text-rose-700">
                  Logout
                </button>
              ) : (
                <button onClick={() => pushUrl("login", { next: null })} className="text-xs font-semibold text-emerald-700">
                  Login
                </button>
              )}
            </div>
            <select
              value={selectedYear}
              onChange={(e) => pushUrl(menu, { year: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)]"
            >
              {activeYears.map((year) => (
                <option key={year.id} value={year.year}>
                  {year.label}
                </option>
              ))}
            </select>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {publicNavMenus.map((item) => (
                <button
                  key={item}
                  onClick={() => goToMenu(item)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    menu === item ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--ink)]"
                  }`}
                >
                  {menuLabels[item]}
                </button>
              ))}
            </div>
          </header>

          {renderMainContent()}
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="surface-card w-full max-w-md rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-strong)]">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <TriangleAlert size={18} />
            </div>
            <h3 className="display-font text-xl font-bold text-[var(--ink)]">Konfirmasi Logout</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Anda yakin ingin keluar dari sesi sekarang?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-pulse font-bold">Memuat data...</div>
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
