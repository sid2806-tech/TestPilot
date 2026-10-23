import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Globe, Archive, ChevronRight, Sparkles } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { SectionHeader, EmptyState, Spinner, Alert, PinkDiamond } from '@/components/ui';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    projectsApi.list()
      .then(res => setProjects(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <SectionHeader
        kicker="02 WORKSPACES // DOMAIN WHITELIST"
        title="Testing Projects"
        subtitle="Organize software targets, security sandboxes, and domain boundaries"
        action={
          <Link to="/app/projects/new" className="btn-primary flex items-center gap-2">
            <Plus size={14} /> New Project
          </Link>
        }
      />

      {error && <Alert type="error" message={error} />}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No testing projects yet"
          description="Create a project to bind target URLs, approved domains, and test histories."
          action={
            <Link to="/app/projects/new" className="btn-primary">
              <Sparkles size={14} /> Create Your First Project
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p: any) => (
            <div
              key={p.id}
              className={`card p-5 hover:border-rose-400/40 hover:shadow-neon-rose transition-all duration-200 group ${p.archived ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <FolderOpen size={18} />
                </div>
                {p.archived ? (
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 bg-navy-850 px-2 py-0.5 rounded-full border border-white/5">
                    <Archive size={11} /> Archived
                  </span>
                ) : (
                  <PinkDiamond className="opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <h3 className="text-base font-bold text-white mb-1 font-display tracking-tight group-hover:text-rose-300 transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                {p.description || 'No description provided.'}
              </p>

              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-navy-850/80 border border-white/5">
                <Globe size={13} className="text-rose-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 font-mono truncate">
                  {p.approved_domains?.length > 0 ? p.approved_domains.join(', ') : 'No domains restricted'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-slate-500 font-mono">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                </span>
                <Link
                  to={`/app/runs?project=${p.id}`}
                  className="text-rose-400 hover:text-rose-300 font-medium font-mono flex items-center gap-1 transition-colors"
                >
                  View test runs <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
