import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, PinkDiamond } from '@/components/ui';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090c15] bg-grid flex items-center justify-center px-4 font-sans">
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
            <h1 className="text-2xl font-bold text-white font-display">Reset Password</h1>
          </div>
          <p className="text-slate-400 text-xs font-mono">We'll dispatch a recovery link to your inbox.</p>
        </div>
        <div className="card p-6 sm:p-8 card-rim">
          {sent ? (
            <Alert type="success" message={`A password reset link has been sent to ${email}. Check your inbox.`} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" message={error} />}
              <div>
                <label htmlFor="email" className="block text-xs font-mono text-slate-400 mb-1.5">EMAIL ADDRESS</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending …' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
