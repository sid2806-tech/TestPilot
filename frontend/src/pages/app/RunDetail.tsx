import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Terminal, Camera, AlertTriangle, CheckCircle, XCircle, Clock,
  Download, RefreshCw, XOctagon, ChevronDown, ChevronUp
} from 'lucide-react';
import { runsApi, reportsApi } from '@/lib/api';
import { StatusBadge, Spinner, Alert, SectionHeader } from '@/components/ui';
import { auth } from '@/lib/firebase';

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTc, setExpandedTc] = useState<string | null>(null);
  const [expandedSs, setExpandedSs] = useState<string | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchRun = async () => {
    try {
      const res = await runsApi.get(runId!);
      setRun(res.data);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchRun().finally(() => setLoading(false));
  }, [runId]);

  // Stream events via SSE when run is active
  useEffect(() => {
    if (!run || !['running', 'pending'].includes(run.status)) return;

    let closed = false;
    const connectSSE = async () => {
      const token = await auth.currentUser?.getIdToken();
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const es = new EventSource(`${apiBase}/runs/${runId}/stream?token=${token}`);
      esRef.current = es;

      es.onmessage = (e) => {
        if (closed) return;
        try {
          const data = JSON.parse(e.data);
          setEvents(prev => [...prev, data]);
          eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          if (data.final) {
            fetchRun();
            es.close();
          }
        } catch {}
      };

      es.onerror = () => {
        if (!closed) {
          setTimeout(() => fetchRun(), 2000);
        }
        es.close();
      };
    };

    connectSSE();
    return () => {
      closed = true;
      esRef.current?.close();
    };
  }, [run?.status, runId]);

  // Poll for status updates when streaming isn't available
  useEffect(() => {
    if (!run || !['running', 'pending'].includes(run.status)) return;
    const id = setInterval(() => fetchRun(), 3000);
    return () => clearInterval(id);
  }, [run?.status]);

  const handleCancel = async () => {
    try { await runsApi.cancel(runId!); fetchRun(); } catch (e: any) { setError(e.message); }
  };

  const downloadReport = async (format: 'json' | 'csv' | 'pdf') => {
    const token = await auth.currentUser?.getIdToken();
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    window.open(`${apiBase}/reports/${runId}/${format}?token=${token}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!run) return <div className="p-6"><Alert type="error" message="Run not found." /></div>;

  const isActive = ['running', 'pending'].includes(run.status);
  const summary = run.summary || {};
  const testCases = run.test_case_results || [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <SectionHeader
        title={run.test_name}
        subtitle={run.target_url}
        action={
          <div className="flex items-center gap-2">
            {isActive && (
              <button onClick={handleCancel} className="btn-danger flex items-center gap-2 text-xs">
                <XOctagon size={13} /> Cancel
              </button>
            )}
            {run.status === 'completed' && (
              <div className="flex items-center gap-1">
                {(['json', 'csv', 'pdf'] as const).map(f => (
                  <button key={f} onClick={() => downloadReport(f)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Download size={11} /> {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      />

      {error && <Alert type="error" message={error} />}

      {/* Summary metrics */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        <div className="card p-3 text-center">
          <div className="telemetry-label mb-1">Status</div>
          <StatusBadge status={run.status} />
        </div>
        {[
          { label: 'Passed', value: summary.passed ?? 0, color: 'text-emerald-400' },
          { label: 'Failed', value: summary.failed ?? 0, color: 'text-red-400' },
          { label: 'Blocked', value: summary.blocked ?? 0, color: 'text-amber-400' },
          { label: 'Error', value: summary.error ?? 0, color: 'text-orange-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className="telemetry-label mb-1">{label}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
        <div className="card p-3 text-center">
          <div className="telemetry-label mb-1">Duration</div>
          <div className="text-sm text-white font-mono">
            {run.summary?.duration_ms ? `${(run.summary.duration_ms / 1000).toFixed(1)}s` : '—'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Test cases */}
        <div className="lg:col-span-2 space-y-3">
          <div className="telemetry-label">Test Case Results</div>
          {isActive && testCases.length === 0 && (
            <div className="card p-6 flex items-center gap-3">
              <Spinner />
              <span className="text-sm text-slate-400">Executing tests …</span>
            </div>
          )}
          {testCases.map((tc: any) => (
            <div key={tc.test_case_id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedTc(expandedTc === tc.test_case_id ? null : tc.test_case_id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-navy-800/30 transition-colors"
              >
                <StatusBadge status={tc.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{tc.title}</div>
                  <div className="text-xs text-slate-500">{tc.objective}</div>
                </div>
                <span className="text-xs text-slate-600 font-mono whitespace-nowrap">
                  {tc.duration_ms ? `${tc.duration_ms}ms` : ''}
                </span>
                {expandedTc === tc.test_case_id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
              </button>

              {expandedTc === tc.test_case_id && (
                <div className="border-t border-navy-700/60 p-4 bg-navy-950/40 space-y-3">
                  {tc.step_results?.map((step: any, i: number) => (
                    <div key={step.step_id} className="flex gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        step.status === 'passed' ? 'bg-emerald-400' :
                        step.status === 'failed' ? 'bg-red-400' :
                        step.status === 'blocked' ? 'bg-amber-400' : 'bg-slate-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs flex items-center gap-2">
                          <span className="font-mono text-cyan-400/80">{step.action}</span>
                          <span className="text-slate-500">{step.actual_observation?.slice(0, 120)}</span>
                        </div>
                        {step.error_details && (
                          <div className="text-xs text-red-400 mt-1 font-mono">{step.error_details.slice(0, 200)}</div>
                        )}
                        {step.screenshot_url && (
                          <button onClick={() => setExpandedSs(expandedSs === step.step_id ? null : step.step_id)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 flex items-center gap-1">
                            <Camera size={11} /> {expandedSs === step.step_id ? 'Hide' : 'View'} Screenshot
                          </button>
                        )}
                        {expandedSs === step.step_id && step.screenshot_url && (
                          <img src={step.screenshot_url} alt="Step screenshot" className="mt-2 rounded border border-navy-700/60 max-w-full" />
                        )}
                      </div>
                    </div>
                  ))}

                  {tc.console_errors?.length > 0 && (
                    <div className="mt-3 p-3 bg-red-900/10 border border-red-700/30 rounded">
                      <div className="telemetry-label mb-2 text-red-400">Console Errors</div>
                      {tc.console_errors.slice(0, 5).map((e: string, i: number) => (
                        <div key={i} className="text-xs text-red-400/70 font-mono">{e.slice(0, 200)}</div>
                      ))}
                    </div>
                  )}

                  {tc.status !== 'passed' && (
                    <Link to="/app/bugs" className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
                      <AlertTriangle size={11} /> View failure report
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Event log */}
        <div className="card p-4 flex flex-col max-h-[600px]">
          <div className="telemetry-label mb-3 flex items-center gap-2">
            <Terminal size={12} /> Execution Log
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs">
            {events.map((ev: any, i: number) => (
              <div key={i} className="flex gap-2">
                <span className="text-slate-600 whitespace-nowrap">
                  {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                </span>
                <span className={`flex-1 ${
                  ev.status === 'passed' ? 'text-emerald-400' :
                  ev.status === 'failed' ? 'text-red-400' :
                  ev.status === 'error' ? 'text-orange-400' :
                  'text-slate-400'
                }`}>{ev.message}</span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-slate-600">
                {isActive ? 'Waiting for events …' : 'No events recorded.'}
              </div>
            )}
            <div ref={eventsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
