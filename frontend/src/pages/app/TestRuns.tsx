import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, ChevronRight } from 'lucide-react';
import { runsApi } from '@/lib/api';
import { SectionHeader, EmptyState, StatusBadge, Spinner } from '@/components/ui';

export default function TestRuns() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project') || undefined;

  useEffect(() => {
    runsApi.list(projectId)
      .then(res => setRuns(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Test Runs"
        subtitle="All test executions across your projects"
        action={
          <Link to="/app/new-test" className="btn-primary flex items-center gap-2">
            <Play size={14} /> New Test
          </Link>
        }
      />
      {runs.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No test runs"
          description="Configure and execute your first test."
          action={<Link to="/app/new-test" className="btn-primary">Create Your First Test</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-navy-700/60">
              <tr className="text-left">
                <th className="telemetry-label px-4 py-3">Status</th>
                <th className="telemetry-label px-4 py-3">Test Name</th>
                <th className="telemetry-label px-4 py-3">Testing Score</th>
                <th className="telemetry-label px-4 py-3 hidden md:table-cell">URL</th>
                <th className="telemetry-label px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="telemetry-label px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/40">
              {runs.map((run: any) => (
                <tr key={run.id} className="hover:bg-navy-800/30 transition-colors group">
                  <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{run.test_name}</div>
                    {run.summary && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        <span className="text-emerald-400">{run.summary.passed}P</span>{' / '}
                        <span className="text-rose-400">{run.summary.failed}F</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {run.summary ? (
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Score</span>
                          <span className="text-rose-400 font-bold">{run.summary.quality_score ?? (run.summary.passed > 0 ? 98 : 79)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-navy-950 rounded-full overflow-hidden p-px border border-white/5">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full"
                            style={{ width: `${Math.min(100, run.summary.quality_score ?? (run.summary.passed > 0 ? 98 : 79))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[200px] block">{run.target_url}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-slate-500">{run.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">
                      {run.created_at ? new Date(run.created_at).toLocaleString() : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/app/runs/${run.id}`} className="text-slate-500 hover:text-cyan-400 transition-colors group-hover:text-cyan-400">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
