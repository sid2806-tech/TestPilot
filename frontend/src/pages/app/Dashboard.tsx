import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bug, FolderOpen, Plus, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard, EmptyState, StatusBadge, SectionHeader, Spinner, WindowCard } from '@/components/ui';
import { runsApi, analyticsApi } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [runs, setRuns] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([runsApi.list(), analyticsApi.get()])
      .then(([runsRes, analyticsRes]) => {
        setRuns(runsRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  );

  const stats = analytics?.statuses || {};
  const totalCases = Object.values(stats).reduce((a: any, b: any) => a + b, 0) as number;
  const avgDuration = analytics?.avg_duration_ms
    ? `${(analytics.avg_duration_ms / 1000).toFixed(1)}s`
    : '—';

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <SectionHeader
        kicker="01 MISSION INTEL // REAL-TIME QA"
        title="Mission Overview"
        subtitle="Real-time autonomous testing intelligence, pass rates, and failure regressions"
        action={
          <Link to="/app/new-test" className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Test
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard label="Total Runs" value={analytics?.total_runs ?? 0} accent />
        <MetricCard label="Test Cases" value={totalCases} />
        <MetricCard label="Passed" value={stats.passed ?? 0} />
        <MetricCard label="Failed" value={stats.failed ?? 0} />
        <MetricCard label="Blocked" value={stats.blocked ?? 0} />
        <MetricCard label="Avg Duration" value={avgDuration} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <WindowCard title="telemetry · pass_fail_trend" path="30d">
          {(analytics?.trend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.trend}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#101424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#ff70a6', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="passed" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#ff70a6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-mono">
              [ NO RUN TELEMETRY RECORDED YET — EXECUTE FIRST TEST ]
            </div>
          )}
        </WindowCard>

        {/* Recent runs */}
        <WindowCard title="journal · recent_runs" path="stream.log">
          {runs.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No test runs yet"
              description="Configure your target application URL and prompt TestPilot to run autonomous tests."
              action={<Link to="/app/new-test" className="btn-primary">Launch First Test</Link>}
            />
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 8).map((run: any) => (
                <Link
                  key={run.id}
                  to={`/app/runs/${run.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-navy-850/60 hover:bg-navy-800 border border-white/5 hover:border-rose-400/30 transition-all group"
                >
                  <StatusBadge status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate group-hover:text-rose-300 transition-colors">
                      {run.test_name}
                    </div>
                    <div className="text-xs text-slate-500 truncate font-mono">{run.target_url}</div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap font-mono">
                    {run.created_at ? new Date(run.created_at).toLocaleDateString() : ''}
                  </div>
                </Link>
              ))}
              {runs.length > 8 && (
                <Link to="/app/runs" className="block text-center text-xs font-mono text-rose-400 hover:text-rose-300 pt-2">
                  View all {runs.length} test runs →
                </Link>
              )}
            </div>
          )}
        </WindowCard>
      </div>
    </div>
  );
}
