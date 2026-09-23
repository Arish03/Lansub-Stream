'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronRight, Gauge, Zap, Wrench, TrendingUp, Factory, BarChart3, X, Trash2 
} from 'lucide-react';
import { fetchAssets, createAsset, deleteAsset, AssetData } from '@/lib/api';

const DEFAULT_HIERARCHY = [
  {
    name: 'Plant Alpha (Bengaluru)',
    type: 'Site',
    children: [
      {
        name: 'Building A — Machining',
        type: 'Area',
        children: [
          { name: 'Line 1 — Heavy Milling', type: 'Line', count: 4 },
          { name: 'Line 2 — Precision Turning', type: 'Line', count: 3 },
        ],
      },
      {
        name: 'Building B — Assembly',
        type: 'Area',
        children: [
          { name: 'Cell 01 — Robotic Welding', type: 'Cell', count: 2 },
          { name: 'Cell 02 — Final Inspection', type: 'Cell', count: 3 },
        ],
      },
    ],
  },
];

const DEFAULT_ASSETS = [
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
];

function OEEBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className={`font-mono font-semibold ${color}`}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HealthRing({ value }: { value: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>(DEFAULT_ASSETS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Equipment');
  const [criticality, setCriticality] = useState('B');
  const [location, setLocation] = useState('Building A — Line 1');

  const loadAssets = async () => {
    const data = await fetchAssets();
    if (data && data.length > 0) {
      setAssets(data.map(d => ({
        id: d.id.slice(0, 8),
        name: d.name,
        location: d.type || 'Plant Facility',
        status: 'running',
        devices: 1,
        oee: 84,
        availability: 92,
        performance: 89,
        quality: 98,
        kpis: { throughput: '3,200 units', mtbf: '650 hrs', rul: '50 days', health: d.health_score || 95 },
      })));
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await createAsset({
      name,
      type,
      criticality,
      health_score: 95,
      metadata_json: { location },
    });

    if (res) {
      setAssets(prev => [{
        id: res.id.slice(0, 8),
        name: res.name,
        location: location || res.type,
        status: 'running',
        devices: 0,
        oee: 80,
        availability: 90,
        performance: 88,
        quality: 98,
        kpis: { throughput: '0 units', mtbf: '700 hrs', rul: '60 days', health: 95 },
      }, ...prev]);
    }

    setIsModalOpen(false);
    setName('');
  };

  const handleDelete = async (id: string) => {
    await deleteAsset(id);
    setAssets(assets.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Device Assets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage industrial asset hierarchy, grouping, and derived OEE & health KPIs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Asset Node</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Asset Hierarchy Tree */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Factory className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            Asset Hierarchy
          </h2>
          {DEFAULT_HIERARCHY.map(plant => (
            <div key={plant.name} className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 px-2 py-1.5">
                <ChevronRight className="w-3 h-3 text-cyan-500 dark:text-cyan-400 rotate-90" />
                {plant.name}
              </div>
              {plant.children.map(building => (
                <div key={building.name} className="ml-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 px-2 py-1">
                    <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 rotate-90" />
                    {building.name}
                  </div>
                  {building.children.map(line => (
                    <div key={line.name} className="ml-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer">
                      <span>{line.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{line.count} units</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: Asset Cards */}
        <div className="lg:col-span-3 space-y-4">
          {assets.map(asset => (
            <div key={asset.id} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                {/* Health Ring */}
                <div className="shrink-0 flex items-center gap-3">
                  <HealthRing value={asset.kpis.health} />
                </div>

                {/* Info & OEE */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{asset.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        asset.status === 'running' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                        asset.status === 'maintenance' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' :
                        'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {asset.status}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{asset.id}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{asset.location} • {asset.devices} devices attached</p>

                  {/* OEE Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 shadow-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">OEE Score</p>
                      <p className={`text-xl font-bold ${asset.oee >= 80 ? 'text-emerald-600 dark:text-emerald-400' : asset.oee >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {asset.oee > 0 ? `${asset.oee}%` : '—'}
                      </p>
                    </div>
                    <OEEBar value={asset.availability} label="Availability" color={asset.availability >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                    <OEEBar value={asset.performance} label="Performance" color={asset.performance >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                    <OEEBar value={asset.quality} label="Quality" color="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Create Asset Node</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNC Milling Machine 03"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Node Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Site">Site</option>
                    <option value="Area">Area</option>
                    <option value="Line">Line</option>
                    <option value="Cell">Cell</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Criticality</label>
                  <select
                    value={criticality}
                    onChange={e => setCriticality(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="A">A (Critical)</option>
                    <option value="B">B (Important)</option>
                    <option value="C">C (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Building A — Line 2"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Create Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
