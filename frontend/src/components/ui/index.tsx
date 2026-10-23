// Reusable UI components
import React from 'react';

// ── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium status-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status.toUpperCase()}
    </span>
  );
}

// ── Loading Spinner ─────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <div className={`${s} border-2 border-cyan-500 border-t-transparent rounded-full animate-spin`} />
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-xl bg-navy-800 border border-navy-600/60 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────────
export function MetricCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-4 ${accent ? 'border-cyan-500/30 glow-cyan-sm' : ''}`}>
      <div className="telemetry-label mb-2">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-cyan-400' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────────────────────
export function Alert({
  type,
  message,
}: {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
}) {
  const styles = {
    error: 'bg-red-900/20 border-red-700/40 text-red-400',
    success: 'bg-emerald-900/20 border-emerald-700/40 text-emerald-400',
    warning: 'bg-amber-900/20 border-amber-700/40 text-amber-400',
    info: 'bg-blue-900/20 border-blue-700/40 text-blue-400',
  };
  return (
    <div className={`border rounded-md px-4 py-3 text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}
