'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Boxes, RefreshCw, CheckCircle2, Activity, Sliders,
  Database, Radio, Thermometer, Droplets, Zap, Gauge,
  ChevronRight, WifiOff, Wifi
} from 'lucide-react';
import { useTelemetrySocket } from '@/lib/useSocket';
import { fetchDevices, fetchHistoricalTelemetry, DeviceData } from '@/lib/api';

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ values, color = '#22d3ee' }: { values: number[]; color?: string }) {
  if (values.length < 2) {
    return <div className="h-8 flex items-center text-[10px] text-slate-500">No data yet</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={values.length > 1 ? w : 0}
        cy={h - ((values[values.length - 1] - min) / range) * (h - 4) - 2}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─── Radial Gauge ────────────────────────────────────────────────────────────
function RadialGauge({ value, min = 0, max = 100, label, unit = '', color = '#22d3ee' }: {
  value: number; min?: number; max?: number; label: string; unit?: string; color?: string;
}) {
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = pct * 270 - 135;
  const r = 28;
  const cx = 36;
  const cy = 36;
  const startAngle = -135;
  const sweep = 270 * pct;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(startAngle + sweep));
  const y2 = cy + r * Math.sin(toRad(startAngle + sweep));
  const large = sweep > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="5"
          className="text-slate-700/60" strokeDasharray={`${270 * (Math.PI * 2 * r / 360)} ${360}`}
          strokeDashoffset={0} strokeLinecap="round"
          transform={`rotate(-135 ${cx} ${cy})`} />
        {/* Arc */}
        {sweep > 0 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          />
        )}
        {/* Value */}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="10" fontWeight="700"
          fill="white" fontFamily="monospace">
          {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : '—'}
        </text>
      </svg>
      <span className="text-[10px] text-slate-400 text-center leading-tight truncate max-w-[72px]">
        {label}{unit ? ` (${unit})` : ''}
      </span>
    </div>
  );
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
function TwinSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-2xl p-5 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Metric helpers ───────────────────────────────────────────────────────────
const METRIC_CONFIG: Record<string, { icon: any; color: string; unit: string; min: number; max: number }> = {
  temperature:  { icon: Thermometer,  color: '#f97316', unit: '°C',    min: 0,   max: 100  },
  humidity:     { icon: Droplets,     color: '#38bdf8', unit: '%',     min: 0,   max: 100  },
  vibration:    { icon: Activity,     color: '#a78bfa', unit: 'mm/s',  min: 0,   max: 1    },
  speed:        { icon: Gauge,        color: '#34d399', unit: 'RPM',   min: 0,   max: 3000 },
  battery:      { icon: Zap,          color: '#facc15', unit: '%',     min: 0,   max: 100  },
  pressure:     { icon: Activity,     color: '#fb7185', unit: 'bar',   min: 0,   max: 10   },
  current:      { icon: Zap,          color: '#818cf8', unit: 'A',     min: 0,   max: 50   },
  voltage:      { icon: Zap,          color: '#22d3ee', unit: 'V',     min: 0,   max: 240  },
};

const FALLBACK_CONFIG = { icon: Activity, color: '#22d3ee', unit: '', min: 0, max: 100 };

// ─── Per-device Twin Card ─────────────────────────────────────────────────────
function TwinCard({
  device,
  livePayload,
  history,
}: {
  device: DeviceData;
  livePayload: Record<string, any> | null;
  history: Record<string, number[]>;
}) {
  const isOnline = device.status === 'online';
  const payload = livePayload || device.telemetry || {};
  const metrics = Object.entries(payload).filter(([, v]) => typeof v === 'number');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-2xl p-5 shadow-sm hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-all space-y-5">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{device.name}</h3>
          </div>
          <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400/80">{device.device_key}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Template: {device.template}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {device.last_seen_at && (
            <span className="text-[10px] text-slate-400">
              {new Date(device.last_seen_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Gauges row */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50">
          {metrics.slice(0, 6).map(([key, val]) => {
            const cfg = METRIC_CONFIG[key] || FALLBACK_CONFIG;
            return (
              <RadialGauge
                key={key}
                value={Number(val)}
                min={cfg.min}
                max={cfg.max}
                label={key}
                unit={cfg.unit}
                color={cfg.color}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/50 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" /> Waiting for telemetry stream…
        </div>
      )}

      {/* Sparklines row */}
      {Object.keys(history).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(history).slice(0, 4).map(([key, vals]) => {
            const cfg = METRIC_CONFIG[key] || FALLBACK_CONFIG;
            const last = vals[vals.length - 1];
            return (
              <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 capitalize">{key}</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: cfg.color }}>
                    {last?.toFixed(1)}{cfg.unit}
                  </span>
                </div>
                <Sparkline values={vals} color={cfg.color} />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Radio className="w-3 h-3" />
          <span>Live WebSocket</span>
        </div>
        <Link
          href={`/analytics?device=${device.device_key}`}
          className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium flex items-center gap-1"
        >
          History <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DigitalTwinsPage() {
  const { lastReading, isConnected } = useTelemetrySocket();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live payloads keyed by device_key
  const [livePayloads, setLivePayloads] = useState<Record<string, Record<string, any>>>({});
  // Rolling sparkline history: { device_key: { metric: number[] } }
  const [sparkHistory, setSparkHistory] = useState<Record<string, Record<string, number[]>>>({});

  // Load registered devices
  useEffect(() => {
    fetchDevices().then((devs) => {
      setDevices(devs);
      setIsLoading(false);
    });
  }, []);

  // Subscribe to WebSocket and update live payloads + sparkline history
  useEffect(() => {
    if (!lastReading?.data?.payload) return;
    const key = lastReading.device_key;
    const payload = lastReading.data.payload;

    // Update live payload
    setLivePayloads((prev) => ({ ...prev, [key]: payload }));

    // Update device list status
    setDevices((prev) => {
      const exists = prev.some((d) => d.device_key === key);
      if (!exists) {
        return [...prev, {
          id: lastReading.data.device_id || key,
          name: lastReading.data.device_name || key,
          device_key: key,
          template: 'generic-sensor',
          status: 'online',
          last_seen_at: new Date().toISOString(),
          telemetry: payload,
        }];
      }
      return prev.map((d) =>
        d.device_key === key
          ? { ...d, status: 'online', last_seen_at: new Date().toISOString(), telemetry: payload }
          : d
      );
    });

    // Append to sparkline history (keep last 30 points per metric)
    setSparkHistory((prev) => {
      const deviceHistory = prev[key] || {};
      const updated: Record<string, number[]> = { ...deviceHistory };
      Object.entries(payload).forEach(([metric, val]) => {
        if (typeof val === 'number') {
          const arr = updated[metric] || [];
          updated[metric] = [...arr.slice(-29), val];
        }
      });
      return { ...prev, [key]: updated };
    });
  }, [lastReading]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-500/10 via-slate-100 to-indigo-500/10 dark:from-cyan-950/40 dark:via-slate-900/60 dark:to-indigo-950/40 p-6 rounded-2xl border border-cyan-500/20 backdrop-blur shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Boxes className="w-3.5 h-3.5 animate-pulse" /> Asset Virtualization
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Digital Twins</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Per-device real-time shadow state with live gauges, sparklines, and WebSocket telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20'
          }`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? `${onlineCount} Online` : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Twins', value: devices.length, color: 'text-cyan-600 dark:text-cyan-400' },
          { label: 'Online', value: onlineCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Offline', value: devices.length - onlineCount, color: 'text-rose-500 dark:text-rose-400' },
          { label: 'Metrics Tracked', value: Object.values(livePayloads).reduce((s, p) => s + Object.keys(p).length, 0), color: 'text-indigo-600 dark:text-indigo-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Twin Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <TwinSkeleton key={i} />)}
        </div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
          <Boxes className="w-10 h-10 opacity-40" />
          <p className="text-sm">No devices registered yet.</p>
          <Link href="/devices" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
            Register a device →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {devices.map((device) => (
            <TwinCard
              key={device.id}
              device={device}
              livePayload={livePayloads[device.device_key] || null}
              history={sparkHistory[device.device_key] || {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
