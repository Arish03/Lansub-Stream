'use client';

import { useState } from 'react';
import { 
  GitBranch, ArrowRight, Play, Pause, CheckCircle2, 
  Database, Filter, Shuffle, Clock, Plus, Zap, HardDrive, RefreshCw
} from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  source: string;
  transforms: string[];
  destinations: string[];
  status: 'active' | 'paused';
  throughput: string;
  latency: string;
}

const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: 'PIPE-001',
    name: 'Raw Ingestion to PostgreSQL',
    source: 'MQTT (/device/upstream)',
    transforms: ['Schema Validator (JSONB)', 'Timestamp Normalizer'],
    destinations: ['PostgreSQL (telemetry)', 'Redis Pub/Sub (broadcast)'],
    status: 'active',
    throughput: '1,420 msgs/s',
    latency: '1.4 ms'
  },
  {
    id: 'PIPE-002',
    name: 'Thermal Anomaly Event Sieve',
    source: 'Sensor Telemetry Stream',
    transforms: ['Threshold Filter (> 80°C)', 'Debounce Timer (30s)'],
    destinations: ['Alarm Engine (/v1/alarms)', 'Webhook Dispatcher'],
    status: 'active',
    throughput: '320 msgs/s',
    latency: '0.8 ms'
  },
  {
    id: 'PIPE-003',
    name: 'Cold Storage Archival',
    source: 'PostgreSQL Telemetry History',
    transforms: ['Parquet Compactor', 'Batch Aggregator (1h)'],
    destinations: ['S3 / MinIO Cold Bucket'],
    status: 'paused',
    throughput: '0 msgs/s',
    latency: '—'
  }
];

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);

  const togglePipeline = (id: string) => {
    setPipelines(prev =>
      prev.map(p => (p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p))
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <GitBranch className="w-3.5 h-3.5 animate-pulse" /> Stream Processing
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Data Pipelines</h1>
          <p className="text-sm text-slate-400 mt-1">
            Declarative data routing, payload transformations, filtering, and cross-database fan-out.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Create Pipeline
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Platform Ingestion Throughput</span>
          <p className="text-3xl font-bold text-white mt-1">1,740 <span className="text-sm text-cyan-400 font-normal">msgs/s</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Pipeline Processing Latency</span>
          <p className="text-3xl font-bold text-emerald-400 mt-1">1.2 <span className="text-sm text-slate-400 font-normal">ms p99</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Fan-Out Destinations</span>
          <p className="text-3xl font-bold text-indigo-400 mt-1">4 Active <span className="text-sm text-slate-400 font-normal">(PG, Redis, WS, Kafka)</span></p>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        {pipelines.map(pipeline => {
          const isActive = pipeline.status === 'active';
          return (
            <div
              key={pipeline.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{pipeline.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{pipeline.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs">
                    <p className="text-slate-200 font-mono font-medium">{pipeline.throughput}</p>
                    <p className="text-slate-500">Avg Latency: {pipeline.latency}</p>
                  </div>

                  <button
                    onClick={() => togglePipeline(pipeline.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
              </div>

              {/* Data Flow Diagram Representation */}
              <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                {/* Source */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span><strong>Source:</strong> {pipeline.source}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

                {/* Transformations */}
                <div className="flex flex-wrap items-center gap-2">
                  {pipeline.transforms.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 flex items-center gap-1.5"
                    >
                      <Filter className="w-3 h-3 text-purple-400" />
                      {t}
                    </span>
                  ))}
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

                {/* Destinations */}
                <div className="flex flex-wrap items-center gap-2">
                  {pipeline.destinations.map((d, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 flex items-center gap-1.5"
                    >
                      <Database className="w-3 h-3 text-indigo-400" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
