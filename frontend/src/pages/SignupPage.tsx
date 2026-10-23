import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from '@/components/ui';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
      navigate('/app');
    } catch (err: any) {
      const code = err.code || '';
      if (code.includes('email-already-in-use')) setError('An account with this email already exists.');
      else if (code.includes('weak-password')) setError('Password is too weak. Use at least 8 characters.');
      else setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-500 text-sm mt-2">Start testing in minutes</p>
        </div>
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error" message={error} />}
            <div>
              <label htmlFor="name" className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
              <input id="name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)}
                required className="input-field" placeholder="Jane Smith" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                required className="input-field" placeholder="jane@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  minLength={8} className="input-field pr-10" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account …' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
