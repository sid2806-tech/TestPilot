import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from '@/components/ui';

function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-navy-950 bg-grid flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Crosshair size={16} className="text-cyan-400" />
            </div>
            <span className="font-semibold text-white">TestPilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-500 text-sm mt-2">{subtitle}</p>
        </div>
        <div className="card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/app');
    } catch (err: any) {
      const code = err.code || '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many attempts. Please wait before trying again.');
      } else {
        setError('Sign-in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Sign in to TestPilot" subtitle="Access your testing workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div>
          <label htmlFor="email" className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-xs text-slate-400 font-medium">Password</label>
            <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300">Forgot password?</Link>
          </div>
          <div className="relative">
            <input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} required className="input-field pr-10"
              placeholder="••••••••" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Signing in …' : 'Sign In'}
        </button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300">Create one</Link>
        </p>
      </form>
    </AuthCard>
  );
}
