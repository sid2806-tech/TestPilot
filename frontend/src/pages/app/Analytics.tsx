import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { SectionHeader, MetricCard, EmptyState, Spinner } from '@/components/ui';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa'];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!data || data.total_runs === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <SectionHeader title="Analytics" subtitle="Testing performance and quality metrics" />
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Run tests to start seeing analytics."
        />
      </div>
    );
  }

  const stats = data.statuses || {};
  const pieData = Object.entries(stats).map(([name, value]) => ({ name, value }));
  const avgSec = data.avg_duration_ms ? (data.avg_duration_ms / 1000).toFixed(1) : '—';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SectionHeader title="Analytics" subtitle="Testing performance and quality metrics" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Total Runs" value={data.total_runs} accent />
        <MetricCard label="Passed Cases" value={stats.passed ?? 0} />
        <MetricCard label="Failed Cases" value={stats.failed ?? 0} />
        <MetricCard label="Avg Duration" value={`${avgSec}s`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="card p-5">
          <div className="telemetry-label mb-4 flex items-center gap-2">
            <TrendingUp size={12} /> Pass/Fail Trend
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.trend || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#081426', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }} />
              <Line type="monotone" dataKey="passed" name="Passed" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="failed" name="Failed" stroke="#f87171" strokeWidth={2} dot={false} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="card p-5">
          <div className="telemetry-label mb-4">Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#081426', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Runs per day bar */}
        <div className="card p-5 lg:col-span-2">
          <div className="telemetry-label mb-4 flex items-center gap-2">
            <BarChart3 size={12} /> Runs per Day
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.trend || []}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#081426', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }} />
              <Bar dataKey="total" name="Total Runs" fill="#22d3ee44" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
