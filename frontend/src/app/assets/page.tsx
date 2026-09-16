'use client';

import { Plus, ChevronRight, Gauge, Zap, Wrench, TrendingUp, Factory, BarChart3 } from 'lucide-react';

const ASSETS = [
  {
    id: 'A-001',
    name: 'CNC Machine 01',
    location: 'Building A — Line 1',
    status: 'running',
    devices: 4,
    oee: 78,
    availability: 91,
    performance: 86,
    quality: 99,
    kpis: { throughput: '4,820 units', mtbf: '720 hrs', rul: '42 days', health: 82 },
  },
  {
    id: 'A-002',
    name: 'CNC Machine 02',
    location: 'Building A — Line 1',
    status: 'running',
    devices: 3,
    oee: 85,
    availability: 94,
    performance: 90,
    quality: 100,
    kpis: { throughput: '5,120 units', mtbf: '840 hrs', rul: '65 days', health: 91 },
  },
  {
    id: 'A-003',
    name: 'Lathe 01',
    location: 'Building A — Line 2',
    status: 'maintenance',
    devices: 2,
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 0,
    kpis: { throughput: '—', mtbf: '560 hrs', rul: '12 days', health: 45 },
  },
  {
    id: 'A-004',
    name: 'Conveyor 01',
    location: 'Building B — Packaging',
    status: 'running',
    devices: 5,
    oee: 92,
    availability: 98,
    performance: 95,
    quality: 99,
    kpis: { throughput: '8,200 units', mtbf: '1,200 hrs', rul: '90 days', health: 96 },
  },
  {
    id: 'A-005',
    name: 'Compressor 03',
    location: 'Building A — Utilities',
    status: 'warning',
    devices: 3,
    oee: 65,
    availability: 80,
    performance: 82,
    quality: 99,
    kpis: { throughput: '—', mtbf: '320 hrs', rul: '8 days', health: 38 },
  },
];

const HIERARCHY = [
  {
    name: 'Plant Bengaluru',
    children: [
      {
        name: 'Building A',
        children: [
          { name: 'Production Line 1', count: 3 },
          { name: 'Production Line 2', count: 2 },
        ],
      },
      {
        name: 'Building B',
        children: [
          { name: 'Packaging Line 1', count: 3 },
        ],
      },
    ],
  },
];

function OEEBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${color}`}>{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${
          value >= 90 ? 'bg-emerald-400' : value >= 70 ? 'bg-amber-400' : value > 0 ? 'bg-red-400' : 'bg-slate-700'
        }`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HealthRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{value}</span>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Device Assets</h1>
          <p className="text-sm text-slate-500 mt-1">Manage industrial asset hierarchy, grouping, and derived KPIs</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
          <Plus className="w-4 h-4" />
          New Asset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Asset Hierarchy */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4 text-cyan-400" />
            Asset Hierarchy
          </h2>
          {HIERARCHY.map(plant => (
            <div key={plant.name} className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 px-2 py-1.5">
                <ChevronRight className="w-3 h-3 text-cyan-400 rotate-90" />
                {plant.name}
              </div>
              {plant.children.map(building => (
                <div key={building.name} className="ml-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1">
                    <ChevronRight className="w-3 h-3 text-slate-600 rotate-90" />
                    {building.name}
                  </div>
                  {building.children.map(line => (
                    <div key={line.name} className="ml-4 flex items-center justify-between text-xs text-slate-500 px-2 py-1 rounded hover:bg-slate-800/30 cursor-pointer">
                      <span>{line.name}</span>
                      <span className="text-[10px] text-slate-600">{line.count} assets</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Asset Cards */}
        <div className="col-span-3 space-y-3">
          {ASSETS.map(asset => (
            <div key={asset.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 hover:border-slate-700/60 transition-all">
              <div className="flex items-start gap-5">
                {/* Health Ring */}
                <HealthRing value={asset.kpis.health} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      asset.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' :
                      asset.status === 'maintenance' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {asset.status}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{asset.id}</span>
                  </div>
                  <p className="text-xs text-slate-500">{asset.location} • {asset.devices} devices attached</p>

                  {/* OEE Bars */}
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">OEE</p>
                      <p className={`text-lg font-bold ${asset.oee >= 80 ? 'text-emerald-400' : asset.oee >= 60 ? 'text-amber-400' : asset.oee > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                        {asset.oee > 0 ? `${asset.oee}%` : '—'}
                      </p>
                    </div>
                    <OEEBar value={asset.availability} label="Availability" color={asset.availability >= 90 ? 'text-emerald-400' : 'text-amber-400'} />
                    <OEEBar value={asset.performance} label="Performance" color={asset.performance >= 90 ? 'text-emerald-400' : 'text-amber-400'} />
                    <OEEBar value={asset.quality} label="Quality" color={asset.quality >= 90 ? 'text-emerald-400' : 'text-amber-400'} />
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs shrink-0">
                  <div>
                    <span className="text-slate-600">Throughput</span>
                    <p className="text-slate-300 font-semibold">{asset.kpis.throughput}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">MTBF</span>
                    <p className="text-slate-300 font-semibold">{asset.kpis.mtbf}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">RUL</span>
                    <p className={`font-semibold ${
                      parseInt(asset.kpis.rul) < 15 ? 'text-red-400' : parseInt(asset.kpis.rul) < 30 ? 'text-amber-400' : 'text-slate-300'
                    }`}>{asset.kpis.rul}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Health</span>
                    <p className={`font-semibold ${
                      asset.kpis.health >= 80 ? 'text-emerald-400' : asset.kpis.health >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>{asset.kpis.health}/100</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
