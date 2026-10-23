import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Plus, Play, Bug, BarChart3,
  Settings, LogOut, Crosshair, Bell, Menu, X, Sparkles, Terminal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PinkDiamond } from '@/components/ui';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', num: '01', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', num: '02', icon: FolderOpen },
  { to: '/app/new-test', label: 'New Test', num: '03', icon: Plus },
  { to: '/app/runs', label: 'Runs', num: '04', icon: Play },
  { to: '/app/bugs', label: 'Failures', num: '05', icon: Bug },
  { to: '/app/analytics', label: 'Analytics', num: '06', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', num: '07', icon: Settings },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-[#090c15] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Room & Mission Header (Hamza Desk Room Style) */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0d101e]/90 backdrop-blur-md flex-shrink-0 z-30">
        {/* Left: Brand + Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg bg-navy-800 border border-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <NavLink to="/app" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(255,112,166,0.2)] group-hover:border-rose-400 transition-colors">
              <Crosshair size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white font-display">TESTPILOT AI</span>
                <span className="hidden sm:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">v1.0</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <PinkDiamond className="w-1.5 h-1.5" />
                <span>MISSION CONTROL · LIVE</span>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Center: Live Room Clock & Status */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-navy-850 border border-white/10 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">ONLINE</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span>{time}</span>
            <span className="text-slate-500 text-[10px]">LOCAL</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="text-rose-400 flex items-center gap-1">
            <Sparkles size={12} />
            <span>AI AGENT READY</span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-rose-400/50 object-cover shadow-[0_0_8px_rgba(255,112,166,0.3)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-xs text-rose-300 font-semibold font-mono">
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user?.displayName || 'Active Pilot'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-navy-850 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Page */}
      <main className="flex-1 overflow-y-auto bg-grid pb-24 md:pb-28">
        <Outlet />
      </main>

      {/* Floating Capsule Dock Navigation (Hamza Desk Signature) */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
        <nav className="dock-capsule shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.1)]">
          {NAV_ITEMS.map(({ to, label, num, end }) => {
            const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={`dock-item ${isActive ? 'dock-item-active' : ''}`}
              >
                <span className="dock-num">{num}</span>
                <span className="tracking-wide">{label.toUpperCase()}</span>
                {isActive && <PinkDiamond className="w-1.5 h-1.5 ml-0.5 bg-white shadow-none" />}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-[#090c15]/95 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <span className="font-display font-bold text-white text-base">NAVIGATION</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-navy-800 text-slate-400"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 py-6 space-y-2 overflow-y-auto">
            {NAV_ITEMS.map(({ to, label, num, icon: Icon, end }) => {
              const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-rose-500 text-white font-semibold shadow-neon-rose'
                      : 'bg-navy-850/60 text-slate-300 hover:bg-navy-800 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                  <span className="font-mono text-xs opacity-75">{num}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
