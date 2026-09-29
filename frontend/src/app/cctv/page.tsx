'use client';

import { Video, Eye, ScanLine, Shield, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';

const UPCOMING_FEATURES = [
  {
    icon: Video,
    title: 'Live RTSP Stream Viewer',
    description: 'Embed and monitor multiple RTSP/HLS camera feeds directly in the dashboard with low-latency playback.',
  },
  {
    icon: ScanLine,
    title: 'PPE Compliance Detection',
    description: 'Real-time YOLOv8-based detection of hard hats, safety vests, and restricted zone violations.',
  },
  {
    icon: Shield,
    title: 'Perimeter & Zone Alerts',
    description: 'Trigger alarms when personnel or objects enter defined virtual zones on your factory floor map.',
  },
  {
    icon: Eye,
    title: 'Event Snapshot Logging',
    description: 'Automatically capture and store annotated frame snapshots on detection events for audit and review.',
  },
];

export default function CCTVPage() {
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
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 text-xs font-semibold uppercase tracking-widest mb-6">
        <Video className="w-3.5 h-3.5" />
        CCTV & Safety Streams
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-4">
        Coming{' '}
        <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
          Soon
        </span>
      </h1>
      <p className="text-base text-slate-500 dark:text-slate-400 text-center max-w-xl mb-12">
        CCTV & Safety Streams is under development. Monitor live camera feeds, detect safety violations, and log annotated snapshots — all integrated into your Lansub Stream platform.
      </p>

      {/* Animated icon ring */}
      <div className="relative w-32 h-32 mb-14">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-600/10 animate-pulse" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-rose-500/15 to-pink-600/10 animate-pulse [animation-delay:300ms]" />
        <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xl">
          <Video className="w-10 h-10 text-rose-500 dark:text-rose-400" />
        </div>
      </div>

      {/* Upcoming features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        {UPCOMING_FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 shadow-sm hover:border-rose-500/30 transition-all"
          >
            <div className="w-9 h-9 shrink-0 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 dark:text-rose-400">
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
            You'll be notified when CCTV & Streams launches!
          </div>
        ) : (
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
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
