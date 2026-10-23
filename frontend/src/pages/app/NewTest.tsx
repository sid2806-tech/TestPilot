import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, Play, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { projectsApi, runsApi } from '@/lib/api';
import { SectionHeader, Alert, StatusBadge, Spinner } from '@/components/ui';

const CATEGORIES = [
  { value: 'authentication', label: 'Authentication' },
  { value: 'registration', label: 'Registration' },
  { value: 'form_validation', label: 'Form Validation' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'functional', label: 'Functional Testing' },
  { value: 'ui_smoke', label: 'UI Smoke Testing' },
  { value: 'regression', label: 'Regression Testing' },
];

export default function NewTest() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({
    test_name: '',
    project_id: '',
    target_url: '',
    requirements: '',
    category: 'functional',
    timeout_seconds: 60,
  });
  const [phase, setPhase] = useState<'form' | 'review' | 'executing'>('form');
  const [plan, setPlan] = useState<any>(null);
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.list().then(res => setProjects(res.data)).catch(console.error);
  }, []);

  const field = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await runsApi.generate(form);
      setPlan(res.data.test_plan);
      setRunId(res.data.run_id);
      setPhase('review');
    } catch (err: any) {
      setError(err.message || 'Test generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setError('');
    setLoading(true);
    try {
      await runsApi.execute(runId);
      navigate(`/app/runs/${runId}`);
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <SectionHeader
        title="Configure New Test"
        subtitle="Describe what to test — AI will generate the test plan"
      />

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {['Configure', 'Review Plan', 'Execute'].map((s, i) => {
          const stepPhase = ['form', 'review', 'executing'][i];
          const active = phase === stepPhase;
          const done = (phase === 'review' && i === 0) || (phase === 'executing' && i <= 1);
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-xs font-medium ${active ? 'text-cyan-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${active ? 'bg-cyan-500/20 border border-cyan-500' : done ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-navy-800 border border-navy-600'}`}>
                  {i + 1}
                </span>
                {s}
              </div>
              {i < 2 && <div className="flex-1 h-px bg-navy-700/60 max-w-[60px]" />}
            </React.Fragment>
          );
        })}
      </div>

      {phase === 'form' && (
        <form onSubmit={handleGenerate} className="card p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Test Name *</label>
              <input type="text" required value={form.test_name} onChange={e => field('test_name', e.target.value)}
                className="input-field" placeholder="Authentication Flow Test" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Project *</label>
              <select required value={form.project_id} onChange={e => field('project_id', e.target.value)} className="input-field">
                <option value="">Select project …</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Website URL *</label>
              <input type="url" required value={form.target_url} onChange={e => field('target_url', e.target.value)}
                className="input-field" placeholder="https://your-app.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Test Category</label>
              <select value={form.category} onChange={e => field('category', e.target.value)} className="input-field">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Testing Requirements *
              <span className="ml-2 text-slate-600 font-normal">(min. 20 characters)</span>
            </label>
            <textarea required value={form.requirements} onChange={e => field('requirements', e.target.value)}
              className="input-field resize-none" rows={5} minLength={20} maxLength={5000}
              placeholder="Verify that a user can register, log in with valid credentials, receive an error for invalid credentials, and access the password reset page." />
            <div className="text-right text-xs text-slate-600 mt-1">{form.requirements.length}/5000</div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Execution Timeout: {form.timeout_seconds}s
            </label>
            <input type="range" min={10} max={120} step={10} value={form.timeout_seconds}
              onChange={e => field('timeout_seconds', +e.target.value)}
              className="w-full accent-cyan-500" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <><Loader size={14} className="animate-spin" /> Generating …</> : <><Zap size={14} /> Generate Test Plan</>}
          </button>
        </form>
      )}

      {phase === 'review' && plan && (
        <div className="space-y-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <div className="telemetry-label mb-1">AI-Generated Test Plan</div>
              <div className="text-sm text-white">{plan.test_cases?.length} test case{plan.test_cases?.length !== 1 ? 's' : ''} generated</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPhase('form')} className="btn-secondary text-xs">← Revise</button>
              <button onClick={handleExecute} disabled={loading} className="btn-primary flex items-center gap-2 text-xs">
                {loading ? <Loader size={12} className="animate-spin" /> : <Play size={12} />}
                Approve & Execute
              </button>
            </div>
          </div>

          {plan.test_cases?.map((tc: any) => (
            <div key={tc.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-navy-800/40 transition-colors"
              >
                <span className="telemetry-label w-16 flex-shrink-0">{tc.id}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{tc.title}</div>
                  <div className="text-xs text-slate-500">{tc.objective}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  tc.priority === 'High' ? 'text-red-400 bg-red-900/20' :
                  tc.priority === 'Medium' ? 'text-amber-400 bg-amber-900/20' : 'text-slate-400 bg-slate-800'
                }`}>{tc.priority}</span>
                {expandedCase === tc.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </button>

              {expandedCase === tc.id && (
                <div className="border-t border-navy-700/60 p-4 bg-navy-950/40">
                  {tc.preconditions?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 mb-1 font-medium">Preconditions</div>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {tc.preconditions.map((p: string, i: number) => <li key={i}>• {p}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mb-3">
                    <div className="text-xs text-slate-500 mb-2 font-medium">Steps ({tc.steps?.length})</div>
                    <div className="space-y-1.5">
                      {tc.steps?.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className="w-5 h-5 rounded bg-navy-800 border border-navy-600 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">{i+1}</span>
                          <div>
                            <span className="font-mono text-cyan-400/80">{step.action}</span>
                            {step.target && <span className="text-slate-500"> → <code className="font-mono text-slate-400">{step.target}</code></span>}
                            {step.value && <span className="text-slate-600"> = "{step.value}"</span>}
                            <div className="text-slate-500 mt-0.5">{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Expected: </span>
                    <span className="text-slate-400">{tc.expected_result}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
