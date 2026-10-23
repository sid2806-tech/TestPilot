import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Bug, FolderOpen, Plus, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MetricCard, EmptyState, StatusBadge, SectionHeader, Spinner } from '@/components/ui';
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
    <div className="p-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Mission Overview"
        subtitle="Real-time testing intelligence across all projects"
        action={
          <Link to="/app/new-test" className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Test
          </Link>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <MetricCard label="Total Runs" value={analytics?.total_runs ?? 0} accent />
        <MetricCard label="Test Cases" value={totalCases} />
        <MetricCard label="Passed" value={stats.passed ?? 0} />
        <MetricCard label="Failed" value={stats.failed ?? 0} />
        <MetricCard label="Blocked" value={stats.blocked ?? 0} />
        <MetricCard label="Avg Duration" value={avgDuration} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <div className="card p-5">
          <div className="telemetry-label mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Pass/Fail Trend (30 days)
          </div>
          {(analytics?.trend?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.trend}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#081426', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="passed" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#f87171" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No data yet — run your first test
            </div>
          )}
        </div>

        {/* Recent runs */}
        <div className="card p-5">
          <div className="telemetry-label mb-4 flex items-center gap-2">
            <Play size={12} /> Recent Test Runs
          </div>
          {runs.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No test runs yet"
              description="Create a project and launch your first test."
              action={<Link to="/app/new-test" className="btn-primary">Create Your First Test</Link>}
            />
          ) : (
            <div className="space-y-2">
              {runs.slice(0, 8).map((run: any) => (
                <Link key={run.id} to={`/app/runs/${run.id}`}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-navy-800/60 transition-colors group">
                  <StatusBadge status={run.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">{run.test_name}</div>
                    <div className="text-xs text-slate-500 truncate font-mono">{run.target_url}</div>
                  </div>
                  <div className="text-xs text-slate-600 whitespace-nowrap">
                    {run.created_at ? new Date(run.created_at).toLocaleDateString() : ''}
                  </div>
                </Link>
              ))}
              {runs.length > 8 && (
                <Link to="/app/runs" className="block text-center text-xs text-cyan-400 hover:text-cyan-300 pt-2">
                  View all {runs.length} runs →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
