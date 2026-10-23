import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Globe, Archive, ChevronRight } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { SectionHeader, EmptyState, StatusBadge, Spinner, Alert } from '@/components/ui';

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
    <div className="p-6 max-w-7xl mx-auto">
      <SectionHeader
        title="Projects"
        subtitle="Manage your testing projects and approved domains"
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
          title="No projects yet"
          description="Create a project to start organizing your tests."
          action={<Link to="/app/projects/new" className="btn-primary">Create Project</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <div key={p.id} className={`card p-5 hover:border-cyan-500/30 transition-colors ${p.archived ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FolderOpen size={16} className="text-cyan-400" />
                </div>
                {p.archived && <span className="text-xs text-slate-500 flex items-center gap-1"><Archive size={11} /> Archived</span>}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{p.description || 'No description'}</p>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={11} className="text-slate-600" />
                <span className="text-xs text-slate-500 font-mono">
                  {p.approved_domains?.length > 0 ? p.approved_domains.slice(0, 2).join(', ') : 'No domains configured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
                </span>
                <Link to={`/app/runs?project=${p.id}`} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  View runs <ChevronRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
