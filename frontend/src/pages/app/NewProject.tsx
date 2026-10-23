import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { SectionHeader, Alert } from '@/components/ui';

export default function NewProject() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addDomain = () => {
    const d = domainInput.trim().toLowerCase();
    if (!d || domains.includes(d)) return;
    setDomains([...domains, d]);
    setDomainInput('');
  };

  const removeDomain = (d: string) => setDomains(domains.filter(x => x !== d));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await projectsApi.create({ name, description, approved_domains: domains });
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <SectionHeader title="New Project" subtitle="Set up a new testing project" />
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && <Alert type="error" message={error} />}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Project Name *</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="input-field" placeholder="My Web App Tests" maxLength={100} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="input-field resize-none" rows={3} placeholder="What does this project test?" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Approved Domains</label>
          <p className="text-xs text-slate-600 mb-2">Only these domains will be allowed as test targets. Include <code className="font-mono">localhost</code> for local testing.</p>
          <div className="flex gap-2 mb-2">
            <input type="text" value={domainInput} onChange={e => setDomainInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
              className="input-field flex-1" placeholder="example.com" />
            <button type="button" onClick={addDomain} className="btn-secondary px-3">Add</button>
          </div>
          {domains.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {domains.map(d => (
                <span key={d} className="inline-flex items-center gap-1.5 bg-navy-800 border border-navy-600 text-slate-300 text-xs font-mono px-2 py-1 rounded">
                  {d}
                  <button type="button" onClick={() => removeDomain(d)} className="text-slate-500 hover:text-red-400">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Plus size={14} /> {loading ? 'Creating …' : 'Create Project'}
          </button>
          <button type="button" onClick={() => navigate('/app/projects')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
