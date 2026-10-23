import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from '@/components/ui';

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
    <div className="min-h-screen bg-navy-950 bg-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Crosshair size={16} className="text-cyan-400" />
            </div>
            <span className="font-semibold text-white">TestPilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-2">We'll send a reset link to your email.</p>
        </div>
        <div className="card p-6 sm:p-8">
          {sent ? (
            <Alert type="success" message={`A password reset link has been sent to ${email}. Check your inbox.`} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert type="error" message={error} />}
              <div>
                <label htmlFor="email" className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required className="input-field" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending …' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <Link to="/login" className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
