import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Globe, Sparkles } from 'lucide-react';
import { projectsApi } from '@/lib/api';
import { SectionHeader, Alert, WindowCard, PinkDiamond } from '@/components/ui';

export default function NewProject() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cleanDomain = (raw: string) => {
    let d = raw.trim().toLowerCase();
    try {
      if (d.startsWith('http://') || d.startsWith('https://')) {
        const u = new URL(d);
        d = u.hostname;
      }
    } catch {}
    d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
    return d;
  };

  const addDomain = () => {
    const d = cleanDomain(domainInput);
    if (!d || domains.includes(d)) return;
    setDomains([...domains, d]);
    setDomainInput('');
  };

  const removeDomain = (d: string) => setDomains(domains.filter(x => x !== d));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // If user typed something in domainInput but didn't click Add, auto-include it
    let finalDomains = [...domains];
    if (domainInput.trim()) {
      const pending = cleanDomain(domainInput);
      if (pending && !finalDomains.includes(pending)) {
        finalDomains.push(pending);
      }
    }

    try {
      await projectsApi.create({ name: name.trim(), description: description.trim(), approved_domains: finalDomains });
      navigate('/app/projects');
    } catch (err: any) {
      setError(err.message || 'Failed to create project. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
      <SectionHeader
        kicker="02 WORKSPACES // INITIALIZATION"
        title="Create New Project"
        subtitle="Establish a new workspace, test suite boundary, and approved domains whitelist"
      />

      <WindowCard title="terminal · ~/projects/new" path="spec.json">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error" message={error} />}

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              PROJECT NAME *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Webxy Test Platform"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field resize-none leading-relaxed"
              rows={3}
              placeholder="What does this project or web application test?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono text-slate-400">
                APPROVED DOMAINS WHITELIST
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                SSRF Guardrail Protected
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Target URLs tested by autonomous AI must match these approved domains. Include <code className="font-mono text-rose-300 bg-rose-950/40 px-1 py-0.5 rounded">localhost</code> for local development.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                className="input-field flex-1 font-mono text-xs"
                placeholder="example.com or webxy-test.vercel.app"
              />
              <button
                type="button"
                onClick={addDomain}
                className="btn-secondary px-4 py-2 text-xs font-mono"
              >
                + Add Domain
              </button>
            </div>

            {domains.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {domains.map(d => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-2 bg-navy-850 border border-white/10 text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg"
                  >
                    <Globe size={12} className="text-rose-400" />
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => removeDomain(d)}
                      className="text-slate-500 hover:text-rose-400 ml-1 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-6 text-sm"
            >
              <Plus size={15} /> {loading ? 'Creating Project …' : 'Create Project'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/projects')}
              className="btn-secondary py-2.5 px-5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </WindowCard>
    </div>
  );
}
