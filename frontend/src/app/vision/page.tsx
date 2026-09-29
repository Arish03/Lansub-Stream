'use client';

import { Eye, BarChart3, Layers, Zap, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';

const UPCOMING_FEATURES = [
  {
    icon: Eye,
    title: 'Object & Defect Detection',
    description: 'Real-time YOLOv8 inference on production line camera feeds for surface defect and foreign object detection.',
  },
  {
    icon: BarChart3,
    title: 'Vision Analytics Dashboard',
    description: 'Track detection event rates, false positive trends, and model confidence scores over time with interactive charts.',
  },
  {
    icon: Layers,
    title: 'Multi-Camera Scene Fusion',
    description: 'Correlate events across multiple camera angles to reconstruct incident timelines and reduce blind spots.',
  },
  {
    icon: Zap,
    title: 'Edge-Accelerated Inference',
    description: 'Run vision models on NVIDIA Jetson or Coral TPU edge devices for sub-20ms latency without cloud dependency.',
  },
];

export default function VisionAnalyticsPage() {
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6">
        <Eye className="w-3.5 h-3.5" />
        Computer Vision Analytics
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-4">
        Coming{' '}
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Soon
        </span>
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 text-center max-w-xl mb-12">
        Video Analytics is under development. Detect defects, track objects, and fuse multi-camera scene data with edge-accelerated AI inference — all from this dashboard.
      </p>

      {/* Animated icon ring */}
      <div className="relative w-32 h-32 mb-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 animate-pulse" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-600/10 animate-pulse [animation-delay:300ms]" />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xl">
          <Eye className="w-10 h-10 text-amber-500 dark:text-amber-400" />
        </div>
      </div>

      {/* Upcoming features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        {UPCOMING_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 shadow-sm hover:border-amber-500/30 transition-all"
          >
            <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
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
            You'll be notified when Video Analytics launches!
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
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
