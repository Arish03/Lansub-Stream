'use client';

import { Brain, TrendingDown, Cpu, ShieldAlert, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';

const UPCOMING_FEATURES = [
  {
    icon: Brain,
    title: 'Predictive Maintenance (RUL)',
    description: 'LSTM-based Remaining Useful Life inference on bearing vibration, temperature gradients, and spindle RPM trends.',
  },
  {
    icon: TrendingDown,
    title: 'Anomaly Detection Engine',
    description: 'Z-score and autoencoder-based anomaly scoring on live telemetry streams with configurable sensitivity windows.',
  },
  {
    icon: ShieldAlert,
    title: 'Thermal Runaway Predictor',
    description: 'Multivariate regression detecting dangerous dT/dt gradients before they breach safety thresholds.',
  },
  {
    icon: Cpu,
    title: 'On-Device Edge Inference',
    description: 'Deploy quantized TFLite models to edge gateways for offline-capable real-time ML scoring without cloud roundtrips.',
  },
];

export default function AIModelsPage() {
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-500 dark:text-purple-400 text-xs font-semibold uppercase tracking-widest mb-6">
        <Brain className="w-3.5 h-3.5" />
        AI & Predictive Maintenance
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-4">
        Coming{' '}
        <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Soon
        </span>
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 text-center max-w-xl mb-12">
        AI & Predictive Maintenance is under active development. Run LSTM failure prediction, anomaly detection, and on-device edge inference — all connected to your live telemetry stream.
      </p>

      {/* Animated icon ring */}
      <div className="relative w-32 h-32 mb-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-600/10 animate-pulse" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500/15 to-indigo-600/10 animate-pulse [animation-delay:300ms]" />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xl">
          <Brain className="w-10 h-10 text-purple-500 dark:text-purple-400" />
        </div>
      </div>

      {/* Upcoming features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        {UPCOMING_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 shadow-sm hover:border-purple-500/30 transition-all"
          >
            <div className="w-9 h-9 shrink-0 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400">
              <Icon className="w-[18px] h-[18px]" />
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
            You'll be notified when AI Models launches!
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
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
