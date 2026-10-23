import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crosshair, ChevronDown, ArrowRight, Shield, Zap, Eye, Brain,
  GitBranch, BarChart3, Terminal, Globe, CheckCircle, AlertTriangle
} from 'lucide-react';

// ── Mission Control Visualization ─────────────────────────────────────────────
function MissionVisual() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['DEFINE', 'GENERATE', 'EXECUTE', 'ANALYZE'];

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto h-80 select-none">
      {/* Browser viewport mockup */}
      <div className="absolute inset-4 rounded-lg border border-cyan-500/20 bg-navy-900/80 backdrop-blur-sm overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-navy-700/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <div className="flex-1 mx-3 bg-navy-800/60 rounded px-3 py-1 text-xs text-slate-500 font-mono">
            https://your-app.com
          </div>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>

        {/* Scan line effect */}
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
          style={{
            top: `${(activeStep / steps.length) * 100 + 20}%`,
            transition: 'top 0.8s ease-in-out',
          }}
        />

        {/* Test status indicators */}
        <div className="p-4 space-y-2.5 mt-1">
          {[
            { label: 'Login form visible', status: 'pass' },
            { label: 'Email input accepts input', status: 'pass' },
            { label: 'Submit button clickable', status: activeStep >= 2 ? 'pass' : 'pending' },
            { label: 'Auth token received', status: activeStep >= 3 ? 'fail' : 'pending' },
            { label: 'Dashboard redirects', status: 'pending' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                item.status === 'pass' ? 'bg-emerald-400' :
                item.status === 'fail' ? 'bg-red-400 animate-pulse' : 'bg-slate-600'
              }`} />
              <span className="text-xs font-mono text-slate-400 flex-1">{item.label}</span>
              <span className={`text-xs font-mono ${
                item.status === 'pass' ? 'text-emerald-400' :
                item.status === 'fail' ? 'text-red-400' : 'text-slate-600'
              }`}>
                {item.status === 'pass' ? 'PASS' : item.status === 'fail' ? 'FAIL' : '——'}
              </span>
            </div>
          ))}
        </div>

        {/* Pipeline steps */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-navy-700/60 px-4 py-2 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${i === activeStep ? 'bg-cyan-400' : i < activeStep ? 'bg-emerald-400/60' : 'bg-slate-700'}`} />
              <span className={`text-xs font-mono ${i === activeStep ? 'text-cyan-400' : 'text-slate-600'}`}>{s}</span>
              {i < steps.length - 1 && <ChevronDown size={10} className="text-slate-700 rotate-[-90deg]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Orbital accent */}
      <div className="absolute -top-2 -right-2 w-24 h-24 border border-cyan-500/10 rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-cyan-500/10 rounded-full" />

      {/* Telemetry labels */}
      <div className="absolute top-2 right-0 telemetry-label">System Active</div>
      <div className="absolute bottom-0 left-0 telemetry-label">AI-Powered</div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-navy-900/95 backdrop-blur-md border-b border-navy-700/60' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Crosshair size={16} className="text-cyan-400" />
          </div>
          <span className="font-semibold text-white">TestPilot AI</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Link to="/login" className="btn-secondary py-2 px-4">Sign In</Link>
          <Link to="/signup" className="btn-primary py-2 px-4">Get Started</Link>
        </div>
        <div className="sm:hidden">
          <Link to="/signup" className="btn-primary py-2 px-4 text-xs">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="card p-5 hover:border-cyan-500/30 transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:border-cyan-500/40 transition-colors">
        <Icon size={17} className="text-cyan-400" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Main Landing Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pipeline = [
    { num: '01', label: 'Define Requirements', desc: 'Describe what to test in plain language.' },
    { num: '02', label: 'Generate Test Cases', desc: 'Gemini AI structures your requirements into executable tests.' },
    { num: '03', label: 'Execute Browser Tests', desc: 'Playwright automates real browsers against your site.' },
    { num: '04', label: 'Capture Evidence', desc: 'Screenshots, logs, and console errors for every step.' },
    { num: '05', label: 'Analyze Failures', desc: 'AI examines failures and suggests probable causes.' },
    { num: '06', label: 'Generate Reports', desc: 'Download PDF, JSON, or CSV reports with full evidence.' },
  ];

  const features = [
    { icon: Brain, title: 'AI Test Planning', desc: 'Gemini transforms natural-language requirements into structured, executable test cases.' },
    { icon: Globe, title: 'Browser Automation', desc: 'Playwright drives real Chromium browsers—no mocking, no simulation.' },
    { icon: Eye, title: 'Evidence Collection', desc: 'Every step captures screenshots, console errors, and timing data.' },
    { icon: AlertTriangle, title: 'Failure Intelligence', desc: 'AI classifies failures as assertion errors, defects, or environment issues.' },
    { icon: GitBranch, title: 'Regression Testing', desc: 'Run the same approved plan repeatedly to detect regressions.' },
    { icon: BarChart3, title: 'Quality Analytics', desc: 'Track pass rates, trends, and recurring failures across projects.' },
  ];

  const techStack = [
    { name: 'Gemini AI', desc: 'Test generation & failure analysis', color: 'text-blue-400' },
    { name: 'Playwright', desc: 'Real browser automation', color: 'text-emerald-400' },
    { name: 'Firebase', desc: 'Auth & Firestore storage', color: 'text-amber-400' },
    { name: 'Cloud Run', desc: 'Scalable backend deployment', color: 'text-cyan-400' },
  ];

  return (
    <div className="bg-navy-950 min-h-screen">
      <Navbar scrolled={scrolled} />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="animate-fade-in">
            <div className="telemetry-label mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Autonomous Quality Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Every Test.<br />
              Every Failure.<br />
              <span className="text-cyan-400">Under Control.</span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
              An autonomous software testing platform that transforms natural-language
              requirements into executable browser tests, verifies application behavior,
              and delivers evidence-backed results.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary flex items-center gap-2 text-base py-3 px-6">
                Launch TestPilot <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-secondary flex items-center gap-2 text-base py-3 px-6">
                Explore the Platform <ChevronDown size={16} />
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { icon: Shield, text: 'SSRF-Protected Execution' },
                { icon: Zap, text: 'Gemini AI Powered' },
                { icon: CheckCircle, text: 'Real Playwright Tests' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon size={13} className="text-cyan-500/60" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <MissionVisual />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
          <ChevronDown size={16} />
          <ChevronDown size={16} className="mt-[-10px]" />
        </div>
      </section>

      {/* ── SECTION 1: PROBLEM ── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="telemetry-label mb-4">The Problem</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Manual Testing Shouldn't Slow Down Innovation.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Writing test cases by hand, maintaining them as requirements change, and re-running
            them every release cycle costs engineering teams hundreds of hours. Defects slip
            through because coverage is inconsistent and evidence is scattered.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stat: '60%', label: 'of defects found late in dev cycle' },
              { stat: '8h+', label: 'avg manual regression per sprint' },
              { stat: '3×', label: 'more expensive to fix post-release' },
            ].map(({ stat, label }) => (
              <div key={label} className="card p-5 text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">{stat}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-navy-900/40 border-y border-navy-700/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="telemetry-label mb-4">The Solution</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">From Requirements to Verified Results.</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipeline.map(({ num, label, desc }, i) => (
              <div key={num} className="card p-5 group hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-2xl font-bold text-cyan-500/30 group-hover:text-cyan-400/60 transition-colors">{num}</span>
                  <div className="h-px flex-1 bg-navy-700/60" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CAPABILITIES ── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="telemetry-label mb-4">Platform Capabilities</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Everything a Testing Team Needs.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── SECTION 4: TECHNOLOGY ── */}
      <section className="py-24 px-4 sm:px-6 bg-navy-900/40 border-y border-navy-700/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="telemetry-label mb-4">Technology</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Built on Google's Ecosystem.</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Gemini, Playwright, Firebase, and Cloud Run work together to deliver secure,
              scalable, AI-driven testing infrastructure.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map(({ name, desc, color }) => (
              <div key={name} className="card p-5 text-center">
                <div className={`text-lg font-bold ${color} mb-2`}>{name}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            ))}
          </div>

          {/* Architecture diagram */}
          <div className="mt-12 card p-6">
            <div className="telemetry-label mb-4 text-center">System Architecture</div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {[
                { label: 'Browser', color: 'bg-slate-700' },
                { label: '→', color: '' },
                { label: 'Firebase Auth', color: 'bg-amber-900/40 border border-amber-700/40' },
                { label: '→', color: '' },
                { label: 'FastAPI Backend', color: 'bg-cyan-900/40 border border-cyan-700/40' },
                { label: '→', color: '' },
                { label: 'Gemini API', color: 'bg-blue-900/40 border border-blue-700/40' },
                { label: '+', color: '' },
                { label: 'Playwright', color: 'bg-emerald-900/40 border border-emerald-700/40' },
                { label: '→', color: '' },
                { label: 'Firestore', color: 'bg-orange-900/40 border border-orange-700/40' },
              ].map(({ label, color }, i) =>
                color ? (
                  <span key={i} className={`px-3 py-1.5 rounded text-xs font-mono ${color}`}>{label}</span>
                ) : (
                  <span key={i} className="text-slate-600 font-mono">{label}</span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: CTA ── */}
      <section className="py-32 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="telemetry-label mb-6">Get Started</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Make Every Test Count.
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Create your account, connect your project, and launch your first AI-generated test in minutes.
          </p>
          <Link to="/signup" className="btn-primary inline-flex items-center gap-2 text-base py-4 px-8">
            Start Testing <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-700/60 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crosshair size={14} className="text-cyan-400" />
            <span className="text-sm text-slate-500">TestPilot AI — Autonomous Quality Intelligence</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-500 hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="text-sm text-slate-500 hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
