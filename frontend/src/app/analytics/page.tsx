'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Gauge, Zap, Activity, Clock, 
  Calendar, Download, ArrowUpRight, ArrowDownRight, ShieldCheck, RefreshCw, Cpu
} from 'lucide-react';
import { fetchAggregatedTelemetry, fetchFleetKPIs, AggregateResponse, FleetKPIs } from '@/lib/api';

const DEFAULT_SERIES = [42, 45, 48, 44, 46, 51, 58, 54, 49, 47, 43, 44, 45, 48, 52, 49];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [metric, setMetric] = useState<string>('temperature');
  const [kpis, setKpis] = useState<FleetKPIs | null>(null);
  const [aggData, setAggData] = useState<AggregateResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, aggRes] = await Promise.all([
        fetchFleetKPIs(),
        fetchAggregatedTelemetry(undefined, metric, 16)
      ]);
      if (kpiRes) setKpis(kpiRes);
      if (aggRes) setAggData(aggRes);
    } catch (e) {
      console.warn('Could not fetch real analytics data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [metric]);

  const seriesValues = aggData && aggData.series.length > 0 
    ? aggData.series.map(s => s.value) 
    : DEFAULT_SERIES;

  const maxVal = Math.max(...seriesValues, 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Intelligence & KPI
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Industrial Analytics & OEE</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overall Equipment Effectiveness, time-series telemetry aggregation, energy footprints, and reliability telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs">
            {['temperature', 'vibration', 'humidity', 'rpm'].map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                  metric === m
                    ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/30 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-500 dark:text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* OEE & Fleet Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Fleet OEE Score</span>
            <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis ? `${kpis.oee}%` : '86.4%'}</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Optimal operating efficiency
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Machine Availability</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis ? `${kpis.availability}%` : '96.2%'}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
            <div 
              className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${kpis ? kpis.availability : 96.2}%` }} 
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Performance Index</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis ? `${kpis.performance}%` : '89.6%'}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
            <div 
              className="bg-indigo-500 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${kpis ? kpis.performance : 89.6}%` }} 
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">First-Pass Quality</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{kpis ? `${kpis.quality}%` : '99.4%'}</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3">
            <div 
              className="bg-emerald-500 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${kpis ? kpis.quality : 99.4}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Energy & Historical Telemetry Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Variance */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white capitalize">{metric} Aggregation Stream</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Avg: <strong className="text-cyan-600 dark:text-cyan-400 font-mono">{aggData?.avg ?? '—'}</strong></span>
                <span>Min: <strong className="text-blue-600 dark:text-blue-400 font-mono">{aggData?.min ?? '—'}</strong></span>
                <span>Max: <strong className="text-red-600 dark:text-red-400 font-mono">{aggData?.max ?? '—'}</strong></span>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/20">
              {aggData ? `${aggData.count} data points` : 'Live Telemetry'}
            </span>
          </div>

          <div className="h-52 flex items-end gap-2 pt-8 pb-2 border-b border-slate-100 dark:border-slate-800">
            {seriesValues.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t transition-all group-hover:from-cyan-400 group-hover:to-cyan-300"
                  style={{ height: `${Math.max((val / maxVal) * 100, 8)}%` }}
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{val}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 pt-1 font-mono text-[11px]">
            <span>{aggData?.series[0]?.time || 'T - 15m'}</span>
            <span>Rolling Interval</span>
            <span>{aggData?.series[aggData.series.length - 1]?.time || 'Now'}</span>
          </div>
        </div>

        {/* Substation Energy / Plant Power */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Substation Power Draw (kW)</h2>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> 424.8 kWh Today
            </span>
          </div>

          <div className="h-52 flex items-end gap-2 pt-8 pb-2 border-b border-slate-100 dark:border-slate-800">
            {[24, 28, 35, 42, 50, 68, 75, 82, 78, 65, 58, 48, 42, 38, 34, 31].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t transition-all group-hover:from-amber-400 group-hover:to-yellow-300"
                  style={{ height: `${(val / 90) * 100}%` }}
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{val}kW</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 pt-1">
            <span>Base Load (Off-peak)</span>
            <span>Peak Manufacturing Window</span>
            <span>Grid Factor: 0.96</span>
          </div>
        </div>
      </div>
    </div>
  );
}
