'use client';

import { useState } from 'react';
import {
  GitBranch, ArrowRight, Play, Pause, Plus, Zap,
  Filter, Database, Shuffle, Clock, Trash2, ChevronDown, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { useToast } from '@/lib/toast';

interface StageNode {
  type: 'source' | 'transform' | 'destination';
  label: string;
  detail: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: StageNode[];
  status: 'active' | 'paused';
  throughput: string;
  latency: string;
  events: number;
}

const SOURCE_OPTS = ['MQTT (/device/upstream)', 'HTTP POST (/v1/telemetry)', 'WebSocket Stream', 'PostgreSQL CDC'];
const TRANSFORM_OPTS = [
  'Schema Validator (JSONB)', 'Timestamp Normalizer', 'Unit Converter',
  'Threshold Filter', 'Debounce Timer', 'Aggregator (1m)', 'Parquet Compactor',
];
const DEST_OPTS = [
  'PostgreSQL (telemetry)', 'Redis Pub/Sub (broadcast)', 'Alarm Engine (/v1/alarms)',
  'Webhook Dispatcher', 'S3 / MinIO Cold Bucket', 'InfluxDB Time-Series',
];

const INITIAL_PIPELINES: Pipeline[] = [
  {
    id: 'PIPE-001',
    name: 'Raw Ingestion → PostgreSQL',
    stages: [
      { type: 'source',      label: 'MQTT',            detail: 'MQTT (/device/upstream)' },
      { type: 'transform',   label: 'Schema Validate',  detail: 'Schema Validator (JSONB)' },
      { type: 'transform',   label: 'Normalize Time',   detail: 'Timestamp Normalizer' },
      { type: 'destination', label: 'PostgreSQL',        detail: 'PostgreSQL (telemetry)' },
      { type: 'destination', label: 'Redis Broadcast',  detail: 'Redis Pub/Sub (broadcast)' },
    ],
    status: 'active',
    throughput: '1,420 msgs/s',
    latency: '1.4 ms',
    events: 84210,
  },
  {
    id: 'PIPE-002',
    name: 'Thermal Anomaly Sieve',
    stages: [
      { type: 'source',      label: 'Telemetry Stream', detail: 'WebSocket Stream' },
      { type: 'transform',   label: 'Threshold Filter', detail: 'Threshold Filter' },
      { type: 'transform',   label: 'Debounce 30s',     detail: 'Debounce Timer' },
      { type: 'destination', label: 'Alarm Engine',     detail: 'Alarm Engine (/v1/alarms)' },
      { type: 'destination', label: 'Webhook',          detail: 'Webhook Dispatcher' },
    ],
    status: 'active',
    throughput: '320 msgs/s',
    latency: '0.8 ms',
    events: 1203,
  },
  {
    id: 'PIPE-003',
    name: 'Cold Storage Archival',
    stages: [
      { type: 'source',      label: 'PG History',       detail: 'PostgreSQL CDC' },
      { type: 'transform',   label: 'Compact Parquet',  detail: 'Parquet Compactor' },
      { type: 'transform',   label: 'Batch Agg (1h)',   detail: 'Aggregator (1m)' },
      { type: 'destination', label: 'S3 / MinIO',       detail: 'S3 / MinIO Cold Bucket' },
    ],
    status: 'paused',
    throughput: '0 msgs/s',
    latency: '—',
    events: 0,
  },
];

const STAGE_STYLES: Record<StageNode['type'], { bg: string; border: string; icon: any; color: string }> = {
  source:      { bg: 'bg-cyan-50 dark:bg-cyan-950/30',    border: 'border-cyan-200 dark:border-cyan-800/50',    icon: Zap,      color: 'text-cyan-600 dark:text-cyan-400' },
  transform:   { bg: 'bg-slate-100 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700/60',  icon: Filter,   color: 'text-purple-600 dark:text-purple-400' },
  destination: { bg: 'bg-indigo-50 dark:bg-indigo-950/30',border: 'border-indigo-200 dark:border-indigo-800/40',icon: Database, color: 'text-indigo-600 dark:text-indigo-400' },
};

// ─── Pipeline Builder Modal ───────────────────────────────────────────────────
function BuilderModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (pipeline: Pipeline) => void;
}) {
  const [name, setName] = useState('');
  const [stages, setStages] = useState<StageNode[]>([
    { type: 'source', label: 'Source', detail: SOURCE_OPTS[0] },
  ]);

  const addStage = (type: StageNode['type']) => {
    const opts = type === 'source' ? SOURCE_OPTS : type === 'transform' ? TRANSFORM_OPTS : DEST_OPTS;
    setStages((prev) => [...prev, { type, label: type, detail: opts[0] }]);
  };

  const updateStage = (idx: number, detail: string) => {
    setStages((prev) => prev.map((s, i) => i === idx ? { ...s, detail, label: detail.split(' ')[0] } : s));
  };

  const removeStage = (idx: number) => {
    setStages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = () => {
    if (!name.trim() || stages.length < 2) return;
    onCreate({
      id: `PIPE-${String(Date.now()).slice(-3)}`,
      name: name.trim(),
      stages,
      status: 'active',
      throughput: '0 msgs/s',
      latency: '—',
      events: 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">Create Pipeline</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Pipeline Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vibration Anomaly Sieve"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {/* Stages */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Pipeline Stages</label>
            <div className="space-y-2">
              {stages.map((stage, idx) => {
                const st = STAGE_STYLES[stage.type];
                const Icon = st.icon;
                const opts = stage.type === 'source' ? SOURCE_OPTS : stage.type === 'transform' ? TRANSFORM_OPTS : DEST_OPTS;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    {idx > 0 && <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />}
                    <div className={`flex items-center gap-2 flex-1 p-2.5 rounded-xl border ${st.bg} ${st.border}`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${st.color}`} />
                      <select
                        value={stage.detail}
                        onChange={(e) => updateStage(idx, e.target.value)}
                        className="flex-1 text-xs bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        stage.type === 'source' ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300'
                        : stage.type === 'transform' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      }`}>{stage.type}</span>
                      {idx > 0 && (
                        <button onClick={() => removeStage(idx)} className="text-slate-400 hover:text-rose-500 cursor-pointer ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add stage buttons */}
            <div className="flex gap-2 mt-3">
              {(['transform', 'destination'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => addStage(type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || stages.length < 2}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Create Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PipelinesPage() {
  const { success, error } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>(INITIAL_PIPELINES);
  const [showBuilder, setShowBuilder] = useState(false);

  const togglePipeline = (id: string) => {
    setPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = p.status === 'active' ? 'paused' : 'active';
        next === 'active'
          ? success(`Pipeline "${p.name}" resumed.`)
          : error(`Pipeline "${p.name}" paused.`);
        return { ...p, status: next };
      })
    );
  };

  const deletePipeline = (id: string) => {
    const p = pipelines.find((x) => x.id === id);
    setPipelines((prev) => prev.filter((x) => x.id !== id));
    if (p) error(`Pipeline "${p.name}" deleted.`);
  };

  const handleCreate = (pipeline: Pipeline) => {
    setPipelines((prev) => [...prev, pipeline]);
    setShowBuilder(false);
    success(`Pipeline "${pipeline.name}" created successfully.`);
  };

  const totalThroughput = pipelines
    .filter((p) => p.status === 'active')
    .reduce((s, p) => s + (parseFloat(p.throughput.replace(/[^0-9.]/g, '')) || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <GitBranch className="w-3.5 h-3.5 animate-pulse" /> Stream Processing
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Data Pipelines</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Declarative data routing, payload transformations, filtering, and cross-database fan-out.
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create Pipeline
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Throughput</span>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {totalThroughput.toLocaleString()} <span className="text-sm text-cyan-600 dark:text-cyan-400 font-normal">msgs/s</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active / Total Pipelines</span>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {pipelines.filter((p) => p.status === 'active').length}
            <span className="text-sm text-slate-400 font-normal"> / {pipelines.length}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Events Routed</span>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {pipelines.reduce((s, p) => s + p.events, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        {pipelines.map((pipeline) => {
          const isActive = pipeline.status === 'active';
          return (
            <div
              key={pipeline.id}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5 hover:border-cyan-500/30 transition-all"
            >
              {/* Pipeline header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{pipeline.name}</h3>
                      {isActive
                        ? <span className="flex items-center gap-1 text-[10px] text-emerald-500 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live</span>
                        : <span className="text-[10px] text-slate-400 dark:text-slate-500">Paused</span>
                      }
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{pipeline.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs hidden sm:block">
                    <p className="text-slate-800 dark:text-slate-200 font-mono font-medium">{pipeline.throughput}</p>
                    <p className="text-slate-400">p99: {pipeline.latency}</p>
                  </div>
                  <button
                    onClick={() => togglePipeline(pipeline.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isActive ? 'Active' : 'Paused'}
                  </button>
                  <button
                    onClick={() => deletePipeline(pipeline.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete pipeline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual flow diagram */}
              <div className="overflow-x-auto pb-1">
                <div className="flex items-center gap-2 min-w-max">
                  {pipeline.stages.map((stage, idx) => {
                    const st = STAGE_STYLES[stage.type];
                    const Icon = st.icon;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        {idx > 0 && (
                          <div className="flex items-center gap-1">
                            <div className={`h-px w-6 ${isActive ? 'bg-cyan-400/50' : 'bg-slate-300 dark:bg-slate-700'}`} />
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-600'}`} />
                          </div>
                        )}
                        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border font-medium whitespace-nowrap ${st.bg} ${st.border}`}>
                          <Icon className={`w-3 h-3 ${st.color}`} />
                          <span className="text-slate-700 dark:text-slate-200">{stage.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stage type legend */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/50">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-500" /> Source</span>
                <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-purple-500" /> Transform</span>
                <span className="flex items-center gap-1"><Database className="w-3 h-3 text-indigo-500" /> Destination</span>
                <span className="ml-auto">{pipeline.events.toLocaleString()} events routed</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Builder Modal */}
      {showBuilder && (
        <BuilderModal onClose={() => setShowBuilder(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
