// Reusable UI components — Hamza Desk Theme
import React from 'react';

// ── Pink Diamond Marker (Hamza Signature) ───────────────────────────────────
export function PinkDiamond({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block w-2 h-2 bg-rose-400 rotate-45 shadow-[0_0_10px_#ff70a6] ${className}`} />
  );
}

// ── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium status-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status.toUpperCase()}
    </span>
  );
}

// ── Loading Spinner ─────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return (
    <div className={`${s} border-2 border-rose-500 border-t-transparent rounded-full animate-spin`} />
  );
}

// ── Window Card (Hamza Desktop Style with Chrome) ───────────────────────────
export function WindowCard({
  title = 'terminal',
  path = '',
  children,
  className = '',
  action,
}: {
  title?: string;
  path?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      <div className="win-chrome">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{title}</span>
          {path && <span className="text-slate-500">· {path}</span>}
        </div>
        <div className="flex items-center gap-3">
          {action}
          <div className="win-dots">
            <i className="bg-slate-700/60" />
            <i className="bg-slate-700/60" />
            <i className="bg-slate-700/60" />
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center card border-dashed border-white/10">
      <div className="w-12 h-12 rounded-xl bg-navy-800 border border-white/10 flex items-center justify-center mb-4 text-rose-400">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
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
    <div className={`card p-4 sm:p-5 transition-all duration-200 ${accent ? 'border-rose-400/40 shadow-neon-rose' : 'hover:border-white/20'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="telemetry-label">{label}</div>
        {accent && <PinkDiamond />}
      </div>
      <div className={`text-2xl sm:text-3xl font-bold font-display ${accent ? 'text-rose-400' : 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  kicker,
  action,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {kicker && (
          <div className="telemetry-label mb-1">
            <PinkDiamond />
            <span>{kicker}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Alert ────────────────────────────────────────────────────────────────────
export function Alert({
  type,
  message,
  action,
}: {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  action?: React.ReactNode;
}) {
  const styles = {
    error: 'bg-rose-950/40 border-rose-500/40 text-rose-300',
    success: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
    warning: 'bg-amber-950/40 border-amber-500/40 text-amber-300',
    info: 'bg-blue-950/40 border-blue-500/40 text-blue-300',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 ${styles[type]}`}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        <span>{message}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
