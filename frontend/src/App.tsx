import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Public pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

// App shell + pages
import AppShell from '@/components/layout/AppShell';
import Dashboard from '@/pages/app/Dashboard';
import Projects from '@/pages/app/Projects';
import NewProject from '@/pages/app/NewProject';
import NewTest from '@/pages/app/NewTest';
import TestRuns from '@/pages/app/TestRuns';
import RunDetail from '@/pages/app/RunDetail';
import BugReports from '@/pages/app/BugReports';
import Analytics from '@/pages/app/Analytics';
import Settings from '@/pages/app/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="telemetry-label">Authenticating …</span>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

          {/* Protected app */}
          <Route
            path="/app"
            element={<ProtectedRoute><AppShell /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/new" element={<NewProject />} />
            <Route path="new-test" element={<NewTest />} />
            <Route path="runs" element={<TestRuns />} />
            <Route path="runs/:runId" element={<RunDetail />} />
            <Route path="bugs" element={<BugReports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
