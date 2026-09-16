'use client';

import { useState } from 'react';
import { 
  Eye, ShieldCheck, Users, AlertTriangle, CheckCircle2, 
  Activity, BarChart2, Radio, Calendar, Filter
} from 'lucide-react';

interface Incident {
  id: string;
  time: string;
  camera: string;
  type: string;
  confidence: string;
  severity: 'critical' | 'warning' | 'info';
}

const RECENT_INCIDENTS: Incident[] = [
  {
    id: 'INC-901',
    time: '3 mins ago',
    camera: 'CAM-01 (Assembly Cell 01)',
    type: 'Missing Safety Helmet',
    confidence: '98.2%',
    severity: 'critical'
  },
  {
    id: 'INC-902',
    time: '18 mins ago',
    camera: 'CAM-03 (Forklift Corridor)',
    type: 'Pedestrian in Forklift Transit Lane',
    confidence: '95.6%',
    severity: 'warning'
  },
  {
    id: 'INC-903',
    time: '1 hr ago',
    camera: 'CAM-04 (Perimeter Dock)',
    type: 'Unauthorized Entry after hours',
    confidence: '99.1%',
    severity: 'critical'
  },
  {
    id: 'INC-904',
    time: '2 hrs ago',
    camera: 'CAM-02 (Machining Bay)',
    type: 'Safety Shield Gate Interlock Open',
    confidence: '99.8%',
    severity: 'warning'
  }
];

export default function VideoAnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Eye className="w-3.5 h-3.5" /> Edge Vision Analytics
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Computer Vision Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            PPE compliance inspection, pedestrian collision prevention, defect counting, and plant heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            96.8% PPE Compliance Rate
          </span>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Total Persons Detected</span>
          <p className="text-3xl font-bold text-white mt-1">28</p>
          <p className="text-xs text-slate-500 mt-1">Across 4 camera sectors</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Helmet Compliance</span>
          <p className="text-3xl font-bold text-emerald-400 mt-1">96.8%</p>
          <p className="text-xs text-slate-500 mt-1">27 / 28 workers compliant</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Forklifts Active</span>
          <p className="text-3xl font-bold text-cyan-400 mt-1">3</p>
          <p className="text-xs text-slate-500 mt-1">Speed compliance 100% (&lt;10km/h)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-medium text-slate-400">Today's Safety Incidents</span>
          <p className="text-3xl font-bold text-amber-400 mt-1">4</p>
          <p className="text-xs text-slate-500 mt-1">Auto-logged with video snapshot</p>
        </div>
      </div>

      {/* Incident Event Stream */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Real-Time CV Incident Stream
          </h2>
          <span className="text-xs text-slate-400 font-mono">Model: YOLOv8-Safety-Industrial</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase bg-slate-950/40 border-b border-slate-800/60">
              <tr>
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Camera Sector</th>
                <th className="py-2.5 px-3">Detected Anomaly</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {RECENT_INCIDENTS.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-cyan-400 font-medium">{inc.id}</td>
                  <td className="py-3 px-3 text-slate-200">{inc.camera}</td>
                  <td className="py-3 px-3 font-medium text-white">{inc.type}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{inc.confidence}</td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{inc.time}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      inc.severity === 'critical'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
