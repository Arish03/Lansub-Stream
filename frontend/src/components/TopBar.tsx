'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Plus, Radio, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTelemetrySocket } from '@/lib/useSocket';
import { checkBackendHealth, HealthStatus } from '@/lib/api';

export default function TopBar({ onNewDeviceClick }: { onNewDeviceClick?: () => void }) {
  const { isConnected } = useTelemetrySocket();
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setHealth);
    const interval = setInterval(() => {
      checkBackendHealth().then(setHealth);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-slate-950/80 backdrop-blur border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      {/* Left: Search & Live Connection Indicator */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search devices, telemetry, assets…"
            className="w-72 h-9 pl-9 pr-4 rounded-lg bg-slate-900 border border-slate-800/60 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
        </div>

        {/* Live Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-medium transition-all ${
          isConnected
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
            : 'bg-amber-950/40 border-amber-800/50 text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{isConnected ? 'Live Stream: Active' : 'Connecting Stream...'}</span>
          {health && health.status === 'ok' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/40 ml-1">
              PG+Redis OK
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        {onNewDeviceClick && (
          <button 
            onClick={onNewDeviceClick}
            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all border border-cyan-500/20 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Device
          </button>
        )}

        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-slate-950" />
        </button>

        <div className="w-px h-6 bg-slate-800/60" />

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/40">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            LS
          </div>
          <span className="text-xs font-medium text-slate-300">Operator</span>
        </div>
      </div>
    </header>
  );
}
