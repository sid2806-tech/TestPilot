import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, PinkDiamond } from '@/components/ui';

function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-[#090c15] bg-grid flex items-center justify-center px-4 py-16 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(255,112,166,0.2)] group-hover:border-rose-400 transition-colors">
              <Crosshair size={16} />
            </div>
            <span className="font-display font-bold text-white text-base tracking-tight">TestPilot AI</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-1">
            <PinkDiamond />
            <h1 className="text-2xl font-bold text-white font-display">{title}</h1>
          </div>
          <p className="text-slate-400 text-xs font-mono">{subtitle}</p>
        </div>
        <div className="card p-6 sm:p-8 card-rim">{children}</div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate('/app');
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/popup-closed-by-user') {
        // User voluntarily closed the popup
      } else if (code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email using a different sign-in method.');
      } else {
        setError(err.message || 'Google sign-in failed. Please check your Firebase configuration.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthCard title="Sign in to TestPilot" subtitle="Access your testing workspace">
      <div className="space-y-4">
        {error && <Alert type="error" message={error} />}

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-navy-600 bg-navy-800/80 hover:bg-navy-700 text-white font-medium text-sm transition-all duration-150 hover:border-cyan-500/40 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Connecting to Google …' : 'Sign in with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-navy-700/80 w-full" />
          <span className="bg-navy-900 px-3 text-xs text-slate-500 uppercase tracking-wider relative">
            or continue with email
          </span>
          <div className="border-t border-navy-700/80 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-mono text-slate-400 mb-1.5">PASSWORD</label>
              <Link to="/forgot-password" className="text-xs font-mono text-rose-400 hover:text-rose-300">Forgot password?</Link>
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
          <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in …' : 'Sign In with Email'}
          </button>
          <p className="text-center text-xs text-slate-400 mt-4 font-mono">
            Don't have an account?{' '}
            <Link to="/signup" className="text-rose-400 hover:text-rose-300 underline underline-offset-2">Create one</Link>
          </p>
        </form>
      </div>
    </AuthCard>
  );
}
