import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ChevronRight, Layers } from 'lucide-react';
import { bugsApi } from '@/lib/api';
import { SectionHeader, EmptyState, StatusBadge, Spinner } from '@/components/ui';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/20',
  high: 'text-orange-400 bg-orange-900/20',
  medium: 'text-amber-400 bg-amber-900/20',
  low: 'text-blue-400 bg-blue-900/20',
  info: 'text-slate-400 bg-slate-800',
};

export default function BugReports() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'groups'>('list');

  useEffect(() => {
    Promise.all([bugsApi.list(), bugsApi.groups()])
      .then(([bugsRes, groupsRes]) => {
        setBugs(bugsRes.data);
        setGroups(groupsRes.data.groups || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Failure Reports"
        subtitle="AI-analyzed test failures and defect evidence"
      />

      <div className="flex gap-1 mb-6 border-b border-navy-700/60">
        {[['list', 'Failures'], ['groups', 'Grouped']] .map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-white'
            }`}>
            {label}
            {tab === 'list' && <span className="ml-2 text-xs text-slate-600">({bugs.length})</span>}
            {tab === 'groups' && <span className="ml-2 text-xs text-slate-600">({groups.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        bugs.length === 0 ? (
          <EmptyState icon={Bug} title="No failures" description="All tests are passing — or no tests have been run yet." />
        ) : (
          <div className="space-y-3">
            {bugs.map((bug: any) => (
              <div key={bug.id} className="card p-4 hover:border-red-700/30 transition-colors">
                <div className="flex items-start gap-3">
                  <Bug size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-white">{bug.title}</span>
                      {bug.severity && (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${SEVERITY_COLORS[bug.severity] || ''}`}>
                          {bug.severity.toUpperCase()}
                        </span>
                      )}
                      {bug.classification && (
                        <span className="text-xs text-slate-500">{bug.classification.replace(/_/g, ' ')}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{bug.objective}</p>
                    {bug.possible_cause && (
                      <div className="text-xs text-amber-400/80 bg-amber-900/10 border border-amber-700/20 rounded px-3 py-2 mb-2">
                        <span className="text-amber-500 font-medium">Possible cause: </span>{bug.possible_cause}
                      </div>
                    )}
                    {bug.suggested_steps?.length > 0 && (
                      <ul className="text-xs text-slate-500 space-y-0.5">
                        {bug.suggested_steps.slice(0, 2).map((s: string, i: number) => (
                          <li key={i}>→ {s}</li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <Link to={`/app/runs/${bug.run_id}`} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        View Run <ChevronRight size={11} />
                      </Link>
                      <span className="text-xs text-slate-600">
                        {bug.created_at ? new Date(bug.created_at).toLocaleString() : ''}
                      </span>
                      {bug.confidence && (
                        <span className="text-xs text-slate-600">Confidence: {bug.confidence}</span>
                      )}
                    </div>
                  </div>
                  {bug.screenshot_url && (
                    <img src={bug.screenshot_url} alt="Failure screenshot"
                      className="w-24 h-16 object-cover rounded border border-navy-700/60 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'groups' && (
        groups.length === 0 ? (
          <EmptyState icon={Layers} title="No failure groups" description="Groups are generated when multiple failures share a common cause." />
        ) : (
          <div className="space-y-3">
            {groups.map((g: any, i: number) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Layers size={15} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-white">{g.group_name}</span>
                  <span className="text-xs text-slate-600">({g.failure_ids?.length || 0} failures)</span>
                  <span className="text-xs text-slate-600">Confidence: {g.confidence}</span>
                </div>
                <p className="text-xs text-slate-400">{g.shared_cause}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
