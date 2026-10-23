import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { demoApi } from '@/lib/api';
import { SectionHeader, Alert } from '@/components/ui';
import { User, Shield, Zap, RefreshCw } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const [demoStatus, setDemoStatus] = useState<any>(null);
  const [bugToggling, setBugToggling] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    demoApi.status().then(res => setDemoStatus(res.data)).catch(() => {});
  }, []);

  const toggleBug = async () => {
    setBugToggling(true);
    try {
      const res = await demoApi.toggleBug();
      setDemoStatus((prev: any) => ({ ...prev, demo_bug_enabled: res.data.demo_bug_enabled }));
      setSuccess(`Demo bug ${res.data.demo_bug_enabled ? 'enabled' : 'disabled'}.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {}
    setBugToggling(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <SectionHeader title="Settings" subtitle="Account and platform configuration" />

      {success && <Alert type="success" message={success} />}

      {/* Account */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Account</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Display Name</span>
            <span className="text-white">{user?.displayName || '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Email</span>
            <span className="text-white font-mono">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">User ID</span>
            <span className="text-slate-600 font-mono text-xs">{user?.uid}</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={16} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Firebase Authentication active
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Tokens verified server-side on every request
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SSRF protection on all test targets
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Gemini API key stored server-side only
          </div>
        </div>
      </div>

      {/* Demo controls */}
      {demoStatus && (
        <div className="card p-6 border-amber-700/30">
          <div className="flex items-center gap-3 mb-5">
            <Zap size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Demo Environment</h2>
            <span className="text-xs text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded">DEMO</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Toggle the intentional login bug in the demo site to demonstrate failure detection and recovery.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white mb-1">Intentional Login Bug</div>
              <div className={`text-xs ${demoStatus.demo_bug_enabled ? 'text-red-400' : 'text-emerald-400'}`}>
                {demoStatus.demo_bug_enabled ? 'BUG ACTIVE — tests should detect this' : 'Bug disabled — tests should pass'}
              </div>
            </div>
            <button onClick={toggleBug} disabled={bugToggling}
              className={`btn-secondary flex items-center gap-2 ${demoStatus.demo_bug_enabled ? 'border-red-700/40 text-red-400' : 'border-emerald-700/40 text-emerald-400'}`}>
              <RefreshCw size={13} className={bugToggling ? 'animate-spin' : ''} />
              {demoStatus.demo_bug_enabled ? 'Disable Bug' : 'Enable Bug'}
            </button>
          </div>
          <div className="mt-4 p-3 bg-navy-800/60 rounded text-xs text-slate-500">
            Demo URL: <code className="font-mono text-cyan-400">{demoStatus.demo_url}</code><br />
            Demo account: <code className="font-mono text-slate-400">{demoStatus.demo_accounts?.[0]?.email}</code>
          </div>
        </div>
      )}
    </div>
  );
}
