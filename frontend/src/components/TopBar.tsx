'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Plus, Sun, Moon } from 'lucide-react';
import { useTelemetrySocket } from '@/lib/useSocket';
import { checkBackendHealth, HealthStatus } from '@/lib/api';
import { useTheme } from '@/lib/theme';

export default function TopBar({ onNewDeviceClick }: { onNewDeviceClick?: () => void }) {
  const { isConnected } = useTelemetrySocket();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    checkBackendHealth().then(setHealth);
    const interval = setInterval(() => {
      checkBackendHealth().then(setHealth);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 transition-colors duration-200">
      {/* Left: Search & Live Connection Indicator */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search devices, telemetry, assets…"
            className="w-72 h-9 pl-9 pr-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-sm text-slate-800 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 dark:text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">⌘K</kbd>
        </div>

        {/* Live Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-medium transition-all ${
          isConnected
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
          <span>{isConnected ? 'Live Stream: Active' : 'Connecting Stream...'}</span>
          {health && health.status === 'ok' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 ml-1">
              PG+Redis OK
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Actions & Theme Toggle */}
      <div className="flex items-center gap-3">
        {onNewDeviceClick && (
          <button 
            onClick={onNewDeviceClick}
            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all border border-cyan-500/20 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Device
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer shadow-sm group select-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform" />
            )}
          </div>
          <span className="hidden sm:inline font-medium text-[11px] tracking-wide">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <button 
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-950" />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800/60" />

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
            LS
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Operator</span>
        </div>
      </div>
    </header>
  );
}
