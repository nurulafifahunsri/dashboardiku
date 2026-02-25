import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  Globe,
  Settings,
  TrendingUp,
  ChevronRight,
  CalendarClock,
  LogOut,
  Database
} from 'lucide-react';
import { ikuDataset } from './data';
import { IKUData, SasaranProgram, Year } from './types';
import DashboardView from './components/DashboardView';
import CategoryView from './components/CategoryView';
import LoginView from './components/LoginView';
import IkuManagementView from './components/IkuManagementView';
import { ikuApi } from './services/ikuApi';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<SasaranProgram | 'Dashboard' | 'Manajemen Data'>('Dashboard');
  const [selectedYear, setSelectedYear] = useState<Year>('2026');
  const [ikuData, setIkuData] = useState<IKUData[]>(ikuDataset);
  const [dataSource, setDataSource] = useState<'mysql' | 'local'>('local');

  useEffect(() => {
    const session = localStorage.getItem('iku_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const refreshIkuData = async () => {
    try {
      const serverData = await ikuApi.fetchAll();
      setIkuData(serverData);
      setDataSource('mysql');
    } catch {
      setIkuData(ikuDataset);
      setDataSource('local');
    }
  };

  useEffect(() => {
    refreshIkuData();
  }, []);

  const handleLogin = (username: string, pass: string) => {
    if (username === 'adminFasilkom' && pass === '123456') {
      setIsAuthenticated(true);
      setLoginError('');
      localStorage.setItem('iku_auth', 'true');
    } else {
      setLoginError('Kredensial tidak valid. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('iku_auth');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: SasaranProgram.Talenta, icon: Users },
    { name: SasaranProgram.Inovasi, icon: Lightbulb },
    { name: SasaranProgram.Kontribusi, icon: Globe },
    { name: SasaranProgram.Masyarakat, icon: TrendingUp },
    { name: SasaranProgram.TataKelola, icon: Settings },
    { name: 'Manajemen Data', icon: Database },
  ];

  const filteredData = useMemo(() => {
    if (activeTab === 'Dashboard' || activeTab === 'Manajemen Data') return ikuData;
    return ikuData.filter(item => item.category === activeTab);
  }, [activeTab, ikuData]);

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-[1450px] gap-4 lg:gap-6">
        <aside className="glass-surface hidden w-[280px] flex-shrink-0 rounded-3xl border border-[var(--border)] p-4 shadow-[var(--shadow-soft)] md:flex md:flex-col">
          <div className="rounded-2xl bg-[var(--primary)] p-5 text-white">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <span className="display-font text-sm">IKU</span>
            </div>
            <h1 className="display-font text-xl font-bold">Dashboard IKU Fasilkom</h1>
            <p className="mt-1 text-xs text-emerald-100/85">Monitoring Kinerja Utama Fakultas</p>
            <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
              dataSource === 'mysql' ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {dataSource === 'mysql' ? 'MySQL Connected' : 'Local Fallback'}
            </p>
          </div>

          <nav className="mt-5 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name as SasaranProgram | 'Dashboard' | 'Manajemen Data')}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.name
                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-emerald-950/20'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                }`}
              >
                <item.icon
                  size={18}
                  className={`${activeTab === item.name ? 'text-white' : 'text-emerald-700/80 group-hover:text-emerald-700'}`}
                />
                <span>{item.name}</span>
                {activeTab === item.name && <ChevronRight size={14} className="ml-auto opacity-85" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-3 pt-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <CalendarClock size={14} />
                Tahun Evaluasi
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as Year)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)] outline-none transition-all focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="2025">2025 (Baseline)</option>
                <option value="2026">2026 (Target)</option>
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-50 hover:text-rose-800"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="glass-surface mb-4 rounded-2xl border border-[var(--border)] px-4 py-3 shadow-[var(--shadow-soft)] md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="display-font text-base font-bold text-[var(--ink)]">IKU Fasilkom</p>
                <p className="text-xs text-[var(--muted)]">KPI Monitoring System</p>
              </div>
              <button onClick={handleLogout} className="text-xs font-semibold text-rose-700">
                Logout
              </button>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as Year)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--ink)]"
            >
              <option value="2025">Target 2025</option>
              <option value="2026">Target 2026</option>
            </select>
          </header>

          {activeTab === 'Dashboard' ? (
            <DashboardView year={selectedYear} data={ikuData} />
          ) : activeTab === 'Manajemen Data' ? (
            <IkuManagementView data={ikuData} onDataChanged={refreshIkuData} source={dataSource} />
          ) : (
            <CategoryView category={activeTab as SasaranProgram} data={filteredData} year={selectedYear} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
