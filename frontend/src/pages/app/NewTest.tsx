import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Play, ChevronDown, ChevronUp, Loader, FolderPlus, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { projectsApi, runsApi } from '@/lib/api';
import { SectionHeader, Alert, StatusBadge, Spinner, PinkDiamond, WindowCard } from '@/components/ui';

const CATEGORIES = [
  { value: 'authentication', label: 'Authentication Flow' },
  { value: 'registration', label: 'User Registration' },
  { value: 'form_validation', label: 'Form Validation' },
  { value: 'navigation', label: 'Navigation & Links' },
  { value: 'functional', label: 'Functional Testing' },
  { value: 'ui_smoke', label: 'UI Smoke & Visuals' },
  { value: 'regression', label: 'Regression Suite' },
];

export default function NewTest() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [quickCreating, setQuickCreating] = useState(false);

  const [form, setForm] = useState({
    test_name: '',
    project_id: '',
    target_url: 'http://localhost:3001',
    requirements: 'Verify that the user login interface works correctly, handles valid and invalid credentials, and displays appropriate feedback messages.',
    category: 'authentication',
    timeout_seconds: 60,
  });

  const [phase, setPhase] = useState<'form' | 'review' | 'executing'>('form');
  const [plan, setPlan] = useState<any>(null);
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      const res = await projectsApi.list();
      const list = res.data || [];
      setProjects(list);
      if (list.length > 0 && !form.project_id) {
        field('project_id', list[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setProjectsError(
        err.message || 'Could not connect to backend at http://localhost:8000. Please ensure the backend is running.'
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const field = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleQuickCreateProject = async () => {
    setQuickCreating(true);
    setProjectsError('');
    try {
      const res = await projectsApi.create({
        name: 'Demo Web App',
        description: 'Auto-configured test project for local testing',
        approved_domains: ['localhost', '127.0.0.1', 'raomuhammadhamza.tech'],
      });
      const newProj = res.data;
      setProjects(prev => [newProj, ...prev]);
      field('project_id', newProj.id);
    } catch (err: any) {
      setProjectsError(err.message || 'Failed to auto-create project. Is the backend running?');
    } finally {
      setQuickCreating(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) {
      setError('Please select or create a project first before generating tests.');
      return;
    }
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <SectionHeader
        kicker="03 SPECIFICATION // AI GENERATION"
        title="Configure New Test"
        subtitle="Prompt the autonomous testing engine with high-level test requirements"
      />

      {error && <Alert type="error" message={error} />}

      {/* Backend connection warning if API is unreachable */}
      {projectsError && (
        <Alert
          type="warning"
          message={projectsError}
          action={
            <button
              onClick={fetchProjects}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={loadingProjects ? 'animate-spin' : ''} />
              Retry
            </button>
          }
        />
      )}

      {/* Step Indicator (Hamza Capsule Style) */}
      <div className="flex items-center gap-3">
        {['01 Configure Spec', '02 Review Plan', '03 Autonomous Run'].map((s, i) => {
          const stepPhase = ['form', 'review', 'executing'][i];
          const active = phase === stepPhase;
          const done = (phase === 'review' && i === 0) || (phase === 'executing' && i <= 1);
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                active
                  ? 'bg-rose-500 text-white font-semibold shadow-neon-rose border border-rose-400'
                  : done
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'bg-navy-850/60 text-slate-500 border border-white/5'
              }`}>
                {active && <PinkDiamond className="w-1.5 h-1.5 bg-white shadow-none" />}
                <span>{s}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-white/10 max-w-[40px]" />}
            </React.Fragment>
          );
        })}
      </div>

      {phase === 'form' && (
        <WindowCard title="terminal · ~/testpilot/new-spec" path="config.json">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  TEST SUITE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={form.test_name}
                  onChange={e => field('test_name', e.target.value)}
                  className="input-field"
                  placeholder="e.g. Authentication Flow & Edge Cases"
                />
              </div>

              {/* Project Dropdown with Fix for Missing Projects */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono text-slate-400">
                    PROJECT *
                  </label>
                  <Link
                    to="/app/projects/new"
                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                  >
                    <FolderPlus size={12} />
                    <span>Create new</span>
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <select
                      required
                      value={form.project_id}
                      onChange={e => field('project_id', e.target.value)}
                      disabled={loadingProjects}
                      className="input-field pr-10 cursor-pointer"
                    >
                      {loadingProjects ? (
                        <option value="">Loading projects …</option>
                      ) : projects.length === 0 ? (
                        <option value="">No projects found — Click "Create Demo Project" below</option>
                      ) : (
                        <>
                          <option value="">Select project …</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>

                    {loadingProjects && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Loader size={14} className="animate-spin text-rose-400" />
                      </div>
                    )}
                  </div>

                  {/* 1-Click Project Creator helper if no projects exist */}
                  {!loadingProjects && projects.length === 0 && (
                    <div className="p-3 bg-navy-850/80 border border-rose-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <span className="text-rose-400 font-semibold">No project found.</span> Create one now to begin.
                      </div>
                      <button
                        type="button"
                        onClick={handleQuickCreateProject}
                        disabled={quickCreating}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        {quickCreating ? (
                          <>
                            <Loader size={12} className="animate-spin" />
                            Creating …
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            + Create Demo Project
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  TARGET WEBSITE URL *
                </label>
                <input
                  type="url"
                  required
                  value={form.target_url}
                  onChange={e => field('target_url', e.target.value)}
                  className="input-field font-mono text-xs"
                  placeholder="https://example.com or http://localhost:3001"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  TEST CATEGORY
                </label>
                <select
                  value={form.category}
                  onChange={e => field('category', e.target.value)}
                  className="input-field cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-slate-400">
                  TESTING REQUIREMENTS & EXPECTED BEHAVIOR *
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  {form.requirements.length}/5000 chars
                </span>
              </div>
              <textarea
                required
                value={form.requirements}
                onChange={e => field('requirements', e.target.value)}
                className="input-field resize-none leading-relaxed"
                rows={5}
                minLength={20}
                maxLength={5000}
                placeholder="Describe user journeys, expected outcomes, errors to assert, and edge cases for the AI agent to test..."
              />
            </div>

            <div className="p-4 bg-navy-850/60 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  EXECUTION TIMEOUT LIMIT
                </label>
                <span className="text-xs font-mono text-rose-400 font-semibold">
                  {form.timeout_seconds} SECONDS
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={10}
                value={form.timeout_seconds}
                onChange={e => field('timeout_seconds', +e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || projects.length === 0}
                className="btn-primary w-full sm:w-auto py-3 px-6 text-sm"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Generating Test Matrix …
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Generate Autonomous Test Plan
                  </>
                )}
              </button>
            </div>
          </form>
        </WindowCard>
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
