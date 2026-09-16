'use client';

import { useState } from 'react';
import { 
  Boxes, Cpu, Radio, RefreshCw, CheckCircle2, AlertTriangle, 
  Activity, Sliders, ArrowRight, Zap, Shield, Database, Send, Terminal
} from 'lucide-react';
import { useTelemetrySocket } from '@/lib/useSocket';

interface Twin {
  id: string;
  name: string;
  asset: string;
  status: 'synced' | 'updating' | 'drift_detected';
  reported: Record<string, any>;
  desired: Record<string, any>;
  lastSync: string;
}

const INITIAL_TWINS: Twin[] = [
  {
    id: 'TWIN-DEV-1001',
    name: 'Bearing Temp Sensor A1',
    asset: 'CNC Milling Cell 01',
    status: 'synced',
    reported: { temperature: 42.8, humidity: 45.1, vibration: 0.02, sampling_rate_ms: 1000 },
    desired: { temperature_threshold: 85.0, sampling_rate_ms: 1000 },
    lastSync: '1s ago'
  },
  {
    id: 'TWIN-DEV-1002',
    name: 'Spindle Motor Controller M1',
    asset: 'CNC Milling Cell 01',
    status: 'synced',
    reported: { speed: 1450, direction: 'CW', torque: 84, target_speed: 1500 },
    desired: { target_speed: 1500, max_current: 40, auto_stop_on_temp: true },
    lastSync: 'Just now'
  },
  {
    id: 'TWIN-DEV-1003',
    name: 'Assembly Safety Cam 02',
    asset: 'Assembly Line A',
    status: 'drift_detected',
    reported: { fps: 28, ai_model: 'yolov8n-ppe-v1', detection_active: true },
    desired: { fps: 30, ai_model: 'yolov8n-ppe-v2', detection_active: true },
    lastSync: '14s ago'
  }
];

export default function DigitalTwinsPage() {
  const [twins, setTwins] = useState<Twin[]>(INITIAL_TWINS);
  const [selectedTwin, setSelectedTwin] = useState<Twin>(INITIAL_TWINS[0]);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const { lastReading } = useTelemetrySocket();

  const handleSyncDesired = (twinId: string) => {
    setSyncFeedback(`Deploying desired twin state to ${twinId}...`);
    setTimeout(() => {
      setTwins(prev => prev.map(t => t.id === twinId ? { ...t, status: 'synced', lastSync: 'Just now' } : t));
      setSyncFeedback('Digital Twin state synchronized successfully via Redis bridge.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Boxes className="w-3.5 h-3.5 animate-pulse" /> Asset Virtualization
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Digital Twins</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time shadow state mirroring, bidirectional parameter sync, and physical-to-virtual alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Active Shadow Replication
          </span>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncFeedback}</span>
          </div>
        </div>
      )}

      {/* Main Twin Selector & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Twin Asset List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Digital Twins</h2>
          {twins.map(twin => {
            const isSelected = selectedTwin.id === twin.id;
            return (
              <div
                key={twin.id}
                onClick={() => setSelectedTwin(twin)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{twin.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{twin.asset}</p>
                    <p className="text-[11px] font-mono text-cyan-400/70 mt-1">{twin.id}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    twin.status === 'synced'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {twin.status === 'synced' ? 'Synchronized' : 'Drift Detected'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Twin State Inspector & Visual Schematic */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedTwin.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Physical Device Identifier: <span className="font-mono text-cyan-400">{selectedTwin.id}</span></p>
              </div>
              <button
                onClick={() => handleSyncDesired(selectedTwin.id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Force Sync Shadow
              </button>
            </div>

            {/* Visual Schematic Twin Representation */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" /> Physical Asset Telemetry State
                </span>
                <span className="text-xs text-emerald-400 font-mono">Last Synchronized: {selectedTwin.lastSync}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(selectedTwin.reported).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block truncate">{k}</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desired vs Reported Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> Reported Twin State (From Hardware)
                </h3>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedTwin.reported, null, 2)}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" /> Desired Twin Target (From Platform)
                </h3>
                <pre className="text-xs font-mono text-purple-300 bg-slate-900/90 p-3.5 rounded-lg border border-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedTwin.desired, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
