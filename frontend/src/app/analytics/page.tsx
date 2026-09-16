'use client';

import { useState } from 'react';
import { 
  BarChart3, TrendingUp, Gauge, Zap, Activity, Clock, 
  Calendar, Download, ArrowUpRight, ArrowDownRight, ShieldCheck
} from 'lucide-react';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Intelligence & KPI
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Industrial Analytics & OEE</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overall Equipment Effectiveness, time-series telemetry variance, energy footprints, and reliability telemetry.
          </p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* OEE Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Plant OEE Score</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white">87.4%</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +2.3% vs last shift
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Machine Availability</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">94.2%</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '94.2%' }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Production Performance</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">89.6%</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '89.6%' }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">First-Pass Quality</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">98.5%</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98.5%' }} />
          </div>
        </div>
      </div>

      {/* Energy & Historical Telemetry Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Variance */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Thermal & Vibration Dynamics (CNC-01)</h2>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Timescale Query: 5s interval
            </span>
          </div>

          <div className="h-48 flex items-end gap-2 pt-8 pb-2 border-b border-slate-800">
            {[42, 45, 48, 44, 46, 51, 58, 54, 49, 47, 43, 44, 45, 48, 52].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t transition-all group-hover:from-cyan-400 group-hover:to-cyan-300"
                  style={{ height: `${(val / 70) * 100}%` }}
                />
                <span className="text-[9px] text-slate-500 font-mono">{val}°</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Shift Start (06:00)</span>
            <span>Peak Spindle Load (12:30)</span>
            <span>Current (Shift 2)</span>
          </div>
        </div>

        {/* Energy Footprint */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Substation Power Draw (kWh)</h2>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 418.6 kWh Today
            </span>
          </div>

          <div className="h-48 flex items-end gap-2 pt-8 pb-2 border-b border-slate-800">
            {[24, 28, 35, 42, 50, 68, 75, 82, 78, 65, 58, 48, 42, 38, 34].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t transition-all group-hover:from-amber-400 group-hover:to-yellow-300"
                  style={{ height: `${(val / 90) * 100}%` }}
                />
                <span className="text-[9px] text-slate-500 font-mono">{val}kW</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Base Load (Off-peak)</span>
            <span>Peak Manufacturing Window</span>
            <span>Grid Factor: 0.94</span>
          </div>
        </div>
      </div>
    </div>
  );
}
