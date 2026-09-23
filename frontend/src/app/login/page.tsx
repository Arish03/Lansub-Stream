'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { 
  Activity, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, 
  Crown, Wrench, Sparkles, Sun, Moon 
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'Super Admin',
    email: 'superadmin@lansub.io',
    password: 'superadmin_secure_2026',
    description: 'Full Fleet & Security Authority',
    icon: Crown,
    cardBg: 'hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 border-slate-200 dark:border-slate-800 hover:border-amber-500/50',
    iconBg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    role: 'Plant Operator',
    email: 'operator@lansub.io',
    password: 'operator_secure_2026',
    description: 'Telemetry Ingestion & Digital Twins',
    icon: Activity,
    cardBg: 'hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  {
    role: 'Safety Engineer',
    email: 'engineer@lansub.io',
    password: 'engineer_secure_2026',
    description: 'Threshold Rules & Alarm Diagnostics',
    icon: Wrench,
    cardBg: 'hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRoleLoggingIn, setActiveRoleLoggingIn] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handle1ClickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    setLoading(true);
    setActiveRoleLoggingIn(acc.role);

    try {
      await login(acc.email, acc.password);
    } catch (err: any) {
      setError(err.message || `Failed to log in as ${acc.role}.`);
      setLoading(false);
      setActiveRoleLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-200">
      {/* Theme Toggle in Top-Right Corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium shadow-md transition-all cursor-pointer select-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-4 h-4 text-cyan-400" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light</span>
            </>
          )}
        </button>
      </div>

      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Brand / Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-xl shadow-cyan-500/20 mb-3 border border-cyan-400/30">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            Lansub Stream <span className="text-cyan-600 dark:text-cyan-400 font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/50">IIoT</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">High-Throughput Digital Twin & Telemetry Platform</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 space-y-6 transition-colors duration-200">
          
          {/* 1-Click Fast Login Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /> Quick 1-Click Sign-In
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Auto-fills & logs in</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isThisLoading = loading && activeRoleLoggingIn === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handle1ClickLogin(acc)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border bg-slate-50/80 dark:bg-slate-950/60 transition-all text-left cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed ${acc.cardBg}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${acc.iconBg}`}>
                        {isThisLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {acc.role}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${acc.badge}`}>
                            1-Click
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{acc.email}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => handle1ClickLogin(DEMO_ACCOUNTS[0])}
                className="self-start text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all font-medium cursor-pointer"
              >
                Enter in Offline Demo Mode →
              </button>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@lansub.io"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading && !activeRoleLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Need a dedicated account?{' '}
          <Link href="/register" className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium underline-offset-4">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
