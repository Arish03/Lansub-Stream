'use client';

import { useState } from 'react';
import { 
  Bell, AlertTriangle, ShieldAlert, CheckCircle2, Info, Clock, 
  Search, Filter, Check, X, ArrowUpRight, Cpu, MapPin, 
  ChevronRight, RefreshCw, VolumeX, Eye
} from 'lucide-react';

interface Alarm {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  deviceId: string;
  deviceName: string;
  asset: string;
  ruleId: string;
  ruleName: string;
  telemetrySnapshot: Record<string, string | number>;
  timestamp: string;
  acknowledgedBy?: string;
}

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'ALM-8091',
    title: 'Spindle Bearing Overheat Alarm',
    severity: 'critical',
    status: 'active',
    deviceId: 'DEV-1001',
    deviceName: 'Bearing Temp Sensor A1',
    asset: 'CNC Milling Cell 01',
    ruleId: 'RUL-101',
    ruleName: 'Spindle Bearing Overheat Alarm',
    telemetrySnapshot: { temperature: '88.4°C', threshold: '> 85.0°C', duration: '45s' },
    timestamp: '3 min ago',
  },
  {
    id: 'ALM-8090',
    title: 'Compressor High Vibration Spike',
    severity: 'warning',
    status: 'active',
    deviceId: 'DEV-1004',
    deviceName: 'Compressor Vibration Mon V2',
    asset: 'Main Air Compressor',
    ruleId: 'RUL-102',
    ruleName: 'Compressor High Vibration Alert',
    telemetrySnapshot: { rms: '0.092 mm/s', threshold: '>= 0.08 mm/s', peak: '0.14 mm/s' },
    timestamp: '18 min ago',
  },
  {
    id: 'ALM-8089',
    title: 'PPE Safety Compliance Violation',
    severity: 'warning',
    status: 'acknowledged',
    deviceId: 'DEV-1003',
    deviceName: 'Assembly Safety Cam 02',
    asset: 'Assembly Line A',
    ruleId: 'RUL-103',
    ruleName: 'PPE Missing Safety Alert',
    telemetrySnapshot: { helmet_missing: 2, person_count: 8 },
    timestamp: '1 hr ago',
    acknowledgedBy: 'John Doe (Safety Officer)',
  },
  {
    id: 'ALM-8088',
    title: 'Peak Demand Limit Approached',
    severity: 'info',
    status: 'resolved',
    deviceId: 'DEV-1005',
    deviceName: 'Substation Power Meter P1',
    asset: 'HVAC Plant 01',
    ruleId: 'RUL-104',
    ruleName: 'Power Peak Load Shaving',
    telemetrySnapshot: { power_kw: '23.1 kW', threshold: '> 22.0 kW' },
    timestamp: '4 hrs ago',
    acknowledgedBy: 'Automated Recovery',
  },
  {
    id: 'ALM-8087',
    title: 'Gateway Heartbeat Timeout',
    severity: 'critical',
    status: 'resolved',
    deviceId: 'DEV-1006',
    deviceName: 'Warehouse AGV 03',
    asset: 'Intralogistics Fleet',
    ruleId: 'SYS-002',
    ruleName: 'Connectivity Watchdog',
    telemetrySnapshot: { ping_missed: 6, last_known_rssi: '-92 dBm' },
    timestamp: '8 hrs ago',
    acknowledgedBy: 'Fleet Support',
  },
];

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>(INITIAL_ALARMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);

  const criticalCount = alarms.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const warningCount = alarms.filter(a => a.severity === 'warning' && a.status === 'active').length;
  const infoCount = alarms.filter(a => a.severity === 'info' && a.status === 'active').length;
  const resolvedCount = alarms.filter(a => a.status === 'resolved').length;

  const handleAcknowledge = (id: string) => {
    setAlarms(alarms.map(a => 
      a.id === id ? { ...a, status: 'acknowledged', acknowledgedBy: 'Operator (Current Session)' } : a
    ));
    if (selectedAlarm?.id === id) {
      setSelectedAlarm(prev => prev ? { ...prev, status: 'acknowledged', acknowledgedBy: 'Operator (Current Session)' } : null);
    }
  };

  const handleResolve = (id: string) => {
    setAlarms(alarms.map(a => 
      a.id === id ? { ...a, status: 'resolved' } : a
    ));
    if (selectedAlarm?.id === id) {
      setSelectedAlarm(prev => prev ? { ...prev, status: 'resolved' } : null);
    }
  };

  const filteredAlarms = alarms.filter(a => {
    const matchesQuery = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesQuery && matchesSeverity && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Incident Management
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Alarms</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time threshold violations, equipment alarms, and automated escalation logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAlarms(INITIAL_ALARMS)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Stream
          </button>
        </div>
      </div>

      {/* Severity Triage Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-red-500/20 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-400">Critical Unacknowledged</span>
            {criticalCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
          </div>
          <p className="text-3xl font-bold text-red-400 mt-2">{criticalCount}</p>
          <p className="text-xs text-slate-500 mt-1">Immediate intervention required</p>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-amber-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Major / Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400 mt-2">{warningCount}</p>
          <p className="text-xs text-slate-500 mt-1">Approaching safe operating limits</p>
        </div>

        <div className="bg-slate-900 border border-cyan-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-400">Informational</span>
            <Info className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{infoCount}</p>
          <p className="text-xs text-slate-500 mt-1">Operational notifications</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Resolved (Today)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{resolvedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Closed incident cycles</p>
        </div>
      </div>

      {/* 24-Hour Alarm Activity Histogram */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">24-Hour Alarm Distribution</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">14 Incidents / 24h</span>
        </div>
        <div className="h-16 flex items-end gap-1.5 pt-2">
          {[2, 0, 1, 0, 3, 5, 2, 1, 0, 4, 1, 2, 0, 0, 1, 3, 2, 4, 1, 0, 2, 1, 3, 1].map((val, idx) => {
            const height = val === 0 ? 6 : Math.max(12, val * 12);
            const isHigh = val >= 4;
            const isMedium = val >= 2;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div 
                  style={{ height: `${height}px` }} 
                  className={`w-full rounded-t transition-all ${
                    isHigh ? 'bg-red-500 hover:bg-red-400' : isMedium ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-800 hover:bg-cyan-500'
                  }`}
                />
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-[10px] text-white whitespace-nowrap pointer-events-none transition-opacity z-10 font-mono">
                  {idx}:00 — {val} alarms
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-mono">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>Now</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by alarm, asset, or device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1 text-xs">
            {(['all', 'active', 'acknowledged', 'resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Major / Warning</option>
            <option value="info">Informational</option>
          </select>
        </div>
      </div>

      {/* Alarms Feed List */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800/60">
          {filteredAlarms.map((alarm) => {
            const isCrit = alarm.severity === 'critical';
            const isWarn = alarm.severity === 'warning';
            const isActive = alarm.status === 'active';
            const isAck = alarm.status === 'acknowledged';

            return (
              <div 
                key={alarm.id} 
                className={`p-5 transition-colors hover:bg-slate-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isActive && isCrit ? 'bg-red-500/[0.02]' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Severity Badge Indicator */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isCrit ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    isWarn ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {isCrit ? (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  {/* Alarm Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-base">{alarm.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCrit ? 'bg-red-500/20 text-red-300' :
                        isWarn ? 'bg-amber-500/20 text-amber-300' :
                        'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {alarm.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                        isActive ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        isAck ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {alarm.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        {alarm.id}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        {alarm.deviceName} ({alarm.deviceId})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {alarm.asset}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        {alarm.timestamp}
                      </span>
                    </div>

                    {/* Telemetry Snapshot Pill */}
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {Object.entries(alarm.telemetrySnapshot).map(([k, v]) => (
                        <span key={k} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                          <strong className="text-slate-500 font-normal">{k}:</strong> <span className="text-cyan-400">{String(v)}</span>
                        </span>
                      ))}
                      {alarm.acknowledgedBy && (
                        <span className="text-[11px] text-slate-500 italic">
                          Ack by: {alarm.acknowledgedBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {isActive && (
                    <button
                      onClick={() => handleAcknowledge(alarm.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Acknowledge
                    </button>
                  )}

                  {alarm.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alarm.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedAlarm(alarm)}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="View Incident Snapshot"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAlarms.length === 0 && (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
              <p className="text-sm">No alarms match the selected filters. All systems normal.</p>
            </div>
          )}
        </div>
      </div>

      {/* Alarm Detail Modal */}
      {selectedAlarm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-slate-500">{selectedAlarm.id}</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedAlarm.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAlarm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1">Source Device</span>
                  <span className="font-semibold text-slate-200">{selectedAlarm.deviceName}</span>
                  <span className="text-slate-500 block font-mono text-[10px]">{selectedAlarm.deviceId}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block mb-1">Asset Cell</span>
                  <span className="font-semibold text-slate-200">{selectedAlarm.asset}</span>
                  <span className="text-slate-500 block text-[10px]">Zone 1 Plant Floor</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-2">Telemetry Snapshot When Triggered</span>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 font-mono">
                  {Object.entries(selectedAlarm.telemetrySnapshot).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-0.5 border-b border-slate-900 last:border-0">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-cyan-400 font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Triggering Automation Rule</span>
                <p className="text-white font-medium">{selectedAlarm.ruleName} ({selectedAlarm.ruleId})</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              {selectedAlarm.status === 'active' && (
                <button
                  onClick={() => handleAcknowledge(selectedAlarm.id)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  Acknowledge Alarm
                </button>
              )}
              {selectedAlarm.status !== 'resolved' && (
                <button
                  onClick={() => handleResolve(selectedAlarm.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
