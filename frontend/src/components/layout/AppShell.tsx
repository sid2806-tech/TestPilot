import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Plus, Play, Bug, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Crosshair, Bell, Menu, X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/projects', label: 'Projects', icon: FolderOpen },
  { to: '/app/new-test', label: 'New Test', icon: Plus },
  { to: '/app/runs', label: 'Test Runs', icon: Play },
  { to: '/app/bugs', label: 'Failures', icon: Bug },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div
      className={`flex flex-col h-full bg-navy-900 border-r border-navy-700/60 transition-all duration-300
        ${mobile ? 'w-64' : collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-navy-700/60 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Crosshair size={16} className="text-cyan-400" />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <div className="text-sm font-semibold text-white">TestPilot AI</div>
            <div className="text-xs text-cyan-400/60 font-mono">v1.0</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
               ${collapsed && !mobile ? 'justify-center' : ''}
               ${isActive
                 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                 : 'text-slate-400 hover:text-white hover:bg-navy-700/50'
               }`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className={`p-3 border-t border-navy-700/60 ${collapsed && !mobile ? 'flex justify-center' : ''}`}>
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400 font-semibold flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.displayName || 'User'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign out">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col relative">
        <Sidebar />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-navy-700/60 bg-navy-900/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="telemetry-label hidden sm:block">Mission Control</div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-white transition-colors" title="Notifications">
              <Bell size={16} />
            </button>
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400 font-semibold">
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-grid">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
