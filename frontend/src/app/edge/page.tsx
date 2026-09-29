'use client';

import { HardDrive, Wifi, Cpu, Server, Layers, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';

const UPCOMING_FEATURES = [
  {
    icon: Server,
    title: 'K3s Edge Gateway Management',
    description: 'Deploy and monitor lightweight K3s clusters on edge nodes with real-time CPU, memory, and container health.',
  },
  {
    icon: Wifi,
    title: 'Offline Telemetry Caching',
    description: 'Automatic local buffering when cloud connectivity is lost. Data syncs seamlessly on reconnection.',
  },
  {
    icon: Cpu,
    title: 'OTA Firmware & Container Updates',
    description: 'Push firmware and containerized inference models over-the-air to remote edge devices with rollback support.',
  },
  {
    icon: Layers,
    title: 'Modbus / OPC-UA Collectors',
    description: 'Industrial protocol bridges to ingest data from legacy PLCs, VFDs, and SCADA systems at the edge.',
  },
];

export default function EdgeComputingPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-500 dark:text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-6">
        <HardDrive className="w-3.5 h-3.5" />
        Edge Computing
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-4">
        Coming{' '}
        <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
          Soon
        </span>
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 text-center max-w-xl mb-12">
        Edge Computing & Gateway Management is currently under development. Deploy K3s clusters, OTA firmware updates, and industrial protocol bridges — all from this dashboard.
      </p>

      {/* Animated icon ring */}
      <div className="relative w-32 h-32 mb-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 animate-pulse" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-500/15 to-blue-600/10 animate-pulse [animation-delay:300ms]" />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xl">
          <HardDrive className="w-10 h-10 text-cyan-500 dark:text-cyan-400" />
        </div>
      </div>

      {/* Upcoming features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        {UPCOMING_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 shadow-sm hover:border-cyan-500/30 transition-all"
          >
            <div className="w-9 h-9 shrink-0 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 dark:text-cyan-400">
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-0.5">{title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notify form */}
      <div className="w-full max-w-md">
        {submitted ? (
          <div className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <Bell className="w-4 h-4" />
            You'll be notified when Edge Computing launches!
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Notify Me <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
          No spam. We'll only notify you when this feature is ready.
        </p>
      </div>
    </div>
  );
}
