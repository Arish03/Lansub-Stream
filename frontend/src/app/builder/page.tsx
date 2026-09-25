'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Plus, Save, Download, Upload, RotateCcw, 
  Settings, Trash2, Sliders, Activity, Gauge, TrendingUp, 
  ToggleRight, Radio, Cpu, Check, Terminal, Eye, Edit3, 
  AlertTriangle, ShieldCheck, Zap, Sparkles, X, ChevronDown, CheckCircle2
} from 'lucide-react';
import { 
  fetchDevices, fetchDashboards, createDashboard, updateDashboard,
  DeviceData, DashboardWidget, DashboardData, sendCommand
} from '@/lib/api';
import { useTelemetrySocket } from '@/lib/useSocket';
import { useViewMode } from '@/lib/viewMode';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'w-1',
    title: 'Milling Spindle Bearing Temp',
    type: 'gauge',
    deviceKey: 'dev_test123',
    metric: 'temperature',
    unit: '°C',
    min: 20,
    max: 100,
    warnThreshold: 65,
    critThreshold: 85,
    colSpan: 1,
  },
  {
    id: 'w-2',
    title: 'Vibration RMS Velocity',
    type: 'sparkline',
    deviceKey: 'dev_test123',
    metric: 'vibration',
    unit: 'mm/s',
    min: 0,
    max: 0.15,
    warnThreshold: 0.08,
    critThreshold: 0.12,
    colSpan: 2,
  },
  {
    id: 'w-3',
    title: 'Spindle RPM Controller',
    type: 'switch',
    deviceKey: 'dev_test123',
    metric: 'rpm',
    unit: 'RPM',
    min: 0,
    max: 3000,
    colSpan: 1,
  },
  {
    id: 'w-4',
    title: 'Machine Health & Beacon',
    type: 'status',
    deviceKey: 'dev_test123',
    metric: 'battery',
    unit: '%',
    colSpan: 1,
  },
  {
    id: 'w-5',
    title: 'Cell Telemetry Live Feed',
    type: 'terminal',
    deviceKey: 'dev_test123',
    metric: 'all',
    colSpan: 1,
  },
  {
    id: 'w-6',
    title: 'Multi-Sensor Load Index',
    type: 'multibar',
    deviceKey: 'dev_test123',
    metric: 'temperature',
    colSpan: 2,
  }
];

export default function DashboardBuilderPage() {
  const { isSimple, isAdvanced, toggleMode } = useViewMode();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [showAdvancedModalFields, setShowAdvancedModalFields] = useState<boolean>(false);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [dashboards, setDashboards] = useState<DashboardData[]>([]);
  const [currentDashboardName, setCurrentDashboardName] = useState<string>('Factory Cell 01 Monitoring');
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);

  // Widget editing / creating modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);

  // Live Telemetry Cache (deviceKey -> latest telemetry payload)
  const [telemetryStore, setTelemetryStore] = useState<Record<string, Record<string, any>>>({
    dev_test123: { temperature: 48.4, vibration: 0.032, rpm: 1450, battery: 96, humidity: 45.2, status: 'operational' }
  });

  // Rolling history for sparklines
  const [historyStore, setHistoryStore] = useState<Record<string, number[]>>({
    'dev_test123:vibration': [0.02, 0.025, 0.03, 0.028, 0.035, 0.042, 0.038, 0.032, 0.031, 0.036, 0.04, 0.032],
    'dev_test123:temperature': [42, 43, 44, 45, 46, 47, 48, 48.4]
  });

  // Status banners
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Real-time WebSocket hook
  const { isConnected, lastReading } = useTelemetrySocket();

  // Load devices and dashboards on mount
  useEffect(() => {
    fetchDevices().then((devs) => {
      if (devs && devs.length > 0) setDevices(devs);
    });

    // Check localStorage first
    const saved = localStorage.getItem('lansub_custom_dashboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.layout && Array.isArray(parsed.layout)) {
          setWidgets(parsed.layout);
          setCurrentDashboardName(parsed.name || 'Custom Operator View');
        }
      } catch (e) {
        console.warn('Could not parse localStorage dashboard:', e);
      }
    }

    // Also fetch from backend
    fetchDashboards().then((backendDashboards) => {
      if (backendDashboards && backendDashboards.length > 0) {
        setDashboards(backendDashboards);
        if (!saved) {
          const first = backendDashboards[0];
          setCurrentDashboardId(first.id);
          setCurrentDashboardName(first.name);
          if (first.layout && first.layout.length > 0) {
            setWidgets(first.layout);
          }
        }
      }
    });
  }, []);

  // Update live telemetry store when incoming packet arrives
  useEffect(() => {
    if (lastReading?.device_key && lastReading.data?.payload) {
      const devKey = lastReading.device_key;
      const payload = lastReading.data.payload;

      setTelemetryStore((prev) => ({
        ...prev,
        [devKey]: { ...(prev[devKey] || {}), ...payload }
      }));

      // Update history for sparklines
      setHistoryStore((prev) => {
        const next = { ...prev };
        Object.entries(payload).forEach(([k, v]) => {
          if (typeof v === 'number') {
            const histKey = `${devKey}:${k}`;
            const existing = next[histKey] || [v];
            next[histKey] = [...existing.slice(-20), v];
          }
        });
        return next;
      });
    }
  }, [lastReading]);

  // Save current dashboard layout
  const handleSaveDashboard = async () => {
    const dataToSave = {
      name: currentDashboardName,
      layout: widgets,
    };

    // Save to local storage for instant zero-loss persistence
    localStorage.setItem('lansub_custom_dashboard', JSON.stringify(dataToSave));

    try {
      if (currentDashboardId) {
        await updateDashboard(currentDashboardId, dataToSave);
      } else {
        const created = await createDashboard(dataToSave);
        if (created) setCurrentDashboardId(created.id);
      }
    } catch (e) {
      console.warn('Backend sync failed, saved locally:', e);
    }

    setSaveBanner('Dashboard layout saved successfully!');
    setTimeout(() => setSaveBanner(null), 3000);
  };

  // Reset to default factory template
  const handleResetDefault = () => {
    if (confirm('Reset dashboard layout to factory default? Any unsaved widgets will be replaced.')) {
      setWidgets(DEFAULT_WIDGETS);
      localStorage.removeItem('lansub_custom_dashboard');
      setSaveBanner('Restored factory default layout.');
      setTimeout(() => setSaveBanner(null), 3000);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ name: currentDashboardName, layout: widgets }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDashboardName.toLowerCase().replace(/\s+/g, '_')}_dashboard.json`;
    a.click();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.layout && Array.isArray(parsed.layout)) {
          setWidgets(parsed.layout);
          if (parsed.name) setCurrentDashboardName(parsed.name);
          setSaveBanner('Imported dashboard template successfully!');
          setTimeout(() => setSaveBanner(null), 3000);
        } else {
          alert('Invalid dashboard JSON schema.');
        }
      } catch (err) {
        alert('Could not parse imported file.');
      }
    };
    reader.readAsText(file);
  };

  // Delete widget
  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  // Open config modal for a new or existing widget
  const handleOpenConfig = (w?: DashboardWidget) => {
    if (w) {
      setEditingWidget({ ...w });
    } else {
      setEditingWidget({
        id: `w-${Date.now()}`,
        title: 'New Telemetry Widget',
        type: 'gauge',
        deviceKey: devices[0]?.device_key || 'dev_test123',
        metric: 'temperature',
        unit: '°C',
        min: 0,
        max: 100,
        warnThreshold: 70,
        critThreshold: 90,
        colSpan: 1,
      });
    }
    setIsConfigModalOpen(true);
  };

  // Save widget from config modal
  const handleSaveWidgetConfig = (saved: DashboardWidget) => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setIsConfigModalOpen(false);
    setEditingWidget(null);
  };

  // Helper to extract numeric value from telemetry
  const getWidgetValue = (widget: DashboardWidget): number => {
    const devTele = telemetryStore[widget.deviceKey] || telemetryStore['dev_test123'] || {};
    const val = devTele[widget.metric];
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/[-+]?[0-9]*\.?[0-9]+/);
      if (match) return parseFloat(match[0]);
    }
    return widget.min || 0;
  };

  // Helper to extract raw text or json
  const getWidgetRaw = (widget: DashboardWidget): any => {
    const devTele = telemetryStore[widget.deviceKey] || telemetryStore['dev_test123'] || {};
    return devTele;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2 sm:p-4">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" /> Zero-Code Canvas
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={currentDashboardName}
              onChange={(e) => setCurrentDashboardName(e.target.value)}
              className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 focus:outline-none tracking-tight transition-all"
              title="Click to rename dashboard"
            />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build, configure, and monitor bespoke multi-device dashboards with real-time WebSocket telemetry.
          </p>
        </div>

        {/* Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Simple vs Industrial Mode Toggle */}
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isSimple
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
            title={`Switch to ${isSimple ? 'Advanced Industrial' : 'Simple'} View`}
          >
            <span className={`w-2 h-2 rounded-full ${isSimple ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
            {isSimple ? 'Simple View' : 'Industrial View'}
          </button>

          {/* View / Edit Mode Toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isEditMode
                ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            {isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isEditMode ? 'Design Mode' : 'Live Operator Mode'}
          </button>

          {/* Add Widget Button */}
          {isEditMode && (
            <button
              onClick={() => handleOpenConfig()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Widget
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveDashboard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-emerald-500" /> Save Layout
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            title="Export Dashboard JSON"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Import JSON */}
          <label
            title="Import Dashboard JSON"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          {/* Reset Default */}
          <button
            onClick={handleResetDefault}
            title="Restore Defaults"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveBanner && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {saveBanner}
        </div>
      )}

      {/* Stream & Grid Status Strip */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isConnected ? 'Live WebSocket Broadcast' : 'Demo Stream Mode'}
          </span>
          <span>•</span>
          <span>{widgets.length} Widgets Placed</span>
        </div>

        <Link
          href="/devices/connect"
          className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
        >
          <Radio className="w-3.5 h-3.5" /> Connect New Hardware Device &rarr;
        </Link>
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Canvas is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first telemetry gauge, sparkline, or actuator switch to start designing your custom view.
            </p>
          </div>
          <button
            onClick={() => handleOpenConfig()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" /> Add First Widget
          </button>
        </div>
      )}

      {/* The Dynamic Widget Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {widgets.map((widget) => {
          const val = getWidgetValue(widget);
          const raw = getWidgetRaw(widget);
          const min = widget.min ?? 0;
          const max = widget.max ?? 100;
          const percent = Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);

          // Span classes
          const colSpanClass =
            widget.colSpan === 3
              ? 'col-span-1 md:col-span-2 lg:col-span-3'
              : widget.colSpan === 2
              ? 'col-span-1 md:col-span-2'
              : 'col-span-1';

          // Critical / Warning state
          const isCritical = widget.critThreshold !== undefined && val >= widget.critThreshold;
          const isWarning = !isCritical && widget.warnThreshold !== undefined && val >= widget.warnThreshold;

          return (
            <div
              key={widget.id}
              className={`${colSpanClass} bg-white dark:bg-slate-900/80 border ${
                isCritical
                  ? 'border-red-400 dark:border-red-500/40 ring-1 ring-red-400/20'
                  : isWarning
                  ? 'border-amber-400 dark:border-amber-500/40 ring-1 ring-amber-400/20'
                  : 'border-slate-200 dark:border-slate-800'
              } rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative`}
            >
              {/* Widget Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {widget.title}
                    </h3>
                    {isCritical && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Breach
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    {isSimple ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Machine Stream
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{widget.deviceKey}</span>
                        <span>•</span>
                        <span className="capitalize">{widget.metric}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Controls in Edit Mode */}
                {isEditMode && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenConfig(widget)}
                      className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Configure Widget"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Remove Widget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* WIDGET BODY BY TYPE */}

              {/* 1. GAUGE WIDGET */}
              {widget.type === 'gauge' && (
                <div className="py-2 flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-40 h-24 flex items-end justify-center overflow-hidden">
                    {/* SVG Radial Arc */}
                    <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-100 dark:text-slate-800"
                        strokeDasharray="251.2"
                        strokeDashoffset="62.8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4'}
                        strokeWidth="8"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (percent / 100) * 188.4}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute bottom-1 text-center">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                        {val}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold ml-1">{widget.unit}</span>
                    </div>
                  </div>

                  <div className="w-full flex justify-between text-[11px] text-slate-400 font-mono px-2">
                    <span>{min} {widget.unit}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{percent.toFixed(0)}% Capacity</span>
                    <span>{max} {widget.unit}</span>
                  </div>
                </div>
              )}

              {/* 2. SPARKLINE TIME-SERIES WIDGET */}
              {widget.type === 'sparkline' && (
                <div className="space-y-3 py-1">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                        {val}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5 font-semibold">{widget.unit}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Rolling Stream
                    </span>
                  </div>

                  {/* SVG Animated Sparkline */}
                  <div className="h-28 w-full flex items-end gap-1.5 pt-4 pb-1">
                    {(historyStore[`${widget.deviceKey}:${widget.metric}`] || [val, val * 0.9, val * 1.1, val]).map((h, i, arr) => {
                      const maxHist = Math.max(...arr, widget.max || 1);
                      const barPct = Math.max((h / maxHist) * 100, 10);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                          <div
                            className="w-full rounded-t transition-all duration-500 bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover/bar:from-cyan-400 group-hover/bar:to-cyan-300"
                            style={{ height: `${barPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>T - 30s</span>
                    <span>Live Interval</span>
                    <span>Now</span>
                  </div>
                </div>
              )}

              {/* 3. STAT BADGE WIDGET */}
              {widget.type === 'stat' && (
                <div className="py-3 space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {val}
                    </span>
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{widget.unit}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Peak Threshold</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {widget.critThreshold ? `${widget.critThreshold} ${widget.unit}` : 'Not configured'}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. ACTUATOR CONTROLLER SWITCH */}
              {widget.type === 'switch' && (
                <div className="py-2 space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Actuator Relay / VFD</span>
                      <p className="text-[11px] text-slate-500">Current Velocity: {val} {widget.unit}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const targetVal = val > 0 ? 0 : 1500;
                        await sendCommand(widget.deviceKey, 'toggle_power', 'spindle', targetVal);
                        setTelemetryStore((prev) => ({
                          ...prev,
                          [widget.deviceKey]: { ...(prev[widget.deviceKey] || {}), [widget.metric]: targetVal }
                        }));
                      }}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                        val > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400'
                      }`}
                    >
                      {val > 0 ? 'ACTIVE (RUN)' : 'STOPPED'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => sendCommand(widget.deviceKey, 'speed_up', 'speed', 1800)}
                      className="py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Boost Speed (1800)
                    </button>
                    <button
                      onClick={() => sendCommand(widget.deviceKey, 'emergency_stop', 'kill', true)}
                      className="py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      E-STOP
                    </button>
                  </div>
                </div>
              )}

              {/* 5. STATUS & BEACON CARD */}
              {widget.type === 'status' && (
                <div className="py-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Active Online</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Heartbeat seen &lt; 2s ago</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Internal Battery</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{val}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. RAW TERMINAL STREAM */}
              {widget.type === 'terminal' && (
                <div className="py-1">
                  <div className="h-32 p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-400 overflow-y-auto leading-relaxed">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(raw, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* 7. MULTIBAR COMPARISON */}
              {widget.type === 'multibar' && (
                <div className="py-2 space-y-3">
                  {[
                    { label: 'Thermal Core', val: raw.temperature || 45, max: 100, unit: '°C', color: 'bg-cyan-500' },
                    { label: 'Harmonic Vibration', val: (raw.vibration || 0.03) * 1000, max: 100, unit: 'm/s²', color: 'bg-indigo-500' },
                    { label: 'Atmospheric Moisture', val: raw.humidity || 48, max: 100, unit: '%', color: 'bg-emerald-500' },
                  ].map((bar, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{bar.label}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {bar.val} {bar.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className={`${bar.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((bar.val / bar.max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Indicator */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{widget.type} Gauge</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">Sub-sec Latency</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* WIDGET CONFIGURATION / ADD MODAL */}
      {isConfigModalOpen && editingWidget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configure Dashboard Widget</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize visualization type, telemetry source, and warning triggers.</p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Quick 1-Click Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quick Widget Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: '🌡️ Temperature', type: 'gauge', metric: 'temperature', unit: '°C', min: 20, max: 100, warn: 65, crit: 85, title: 'Bearing Temperature' },
                    { label: '📈 Vibration', type: 'sparkline', metric: 'vibration', unit: 'mm/s', min: 0, max: 0.15, warn: 0.08, crit: 0.12, title: 'Vibration Trend' },
                    { label: '⚡ Motor Switch', type: 'switch', metric: 'rpm', unit: 'RPM', min: 0, max: 3000, title: 'Spindle Controller' },
                    { label: '🛡️ Health State', type: 'status', metric: 'battery', unit: '%', min: 0, max: 100, title: 'Machine Condition' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditingWidget({
                          ...editingWidget,
                          title: preset.title,
                          type: preset.type as any,
                          metric: preset.metric,
                          unit: preset.unit,
                          min: preset.min,
                          max: preset.max,
                          warnThreshold: preset.warn,
                          critThreshold: preset.crit,
                        });
                      }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-left font-medium transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Widget Title</label>
                <input
                  type="text"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Target Device */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bound Device</label>
                <select
                  value={editingWidget.deviceKey}
                  onChange={(e) => setEditingWidget({ ...editingWidget, deviceKey: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="dev_test123">dev_test123 (Milling Cell Sensor A1)</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.device_key}>
                      {d.device_key} — {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visualization Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visualization Type</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'gauge', label: 'Arc Gauge' },
                    { id: 'sparkline', label: 'Trend Chart' },
                    { id: 'stat', label: 'KPI Value' },
                    { id: 'switch', label: 'Controller' },
                    { id: 'status', label: 'Health' },
                    { id: 'terminal', label: 'Raw Log' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditingWidget({ ...editingWidget, type: t.id as any })}
                      className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                        editingWidget.type === t.id
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progressive Disclosure: Advanced Fine-Tuning */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedModalFields(!showAdvancedModalFields)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                    Fine-Tune Metrics, Thresholds & Column Width (Optional)
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedModalFields ? 'rotate-180' : ''}`} />
                </button>

                {(showAdvancedModalFields || !isSimple) && (
                  <div className="p-4 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    {/* Target Metric Key & Unit */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Metric Key</label>
                        <input
                          type="text"
                          placeholder="e.g. temperature, vibration, rpm"
                          value={editingWidget.metric}
                          onChange={(e) => setEditingWidget({ ...editingWidget, metric: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Label</label>
                        <input
                          type="text"
                          placeholder="e.g. °C, mm/s, RPM, %"
                          value={editingWidget.unit || ''}
                          onChange={(e) => setEditingWidget({ ...editingWidget, unit: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Min, Max, and Thresholds */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scale Min / Max</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={editingWidget.min ?? 0}
                            onChange={(e) => setEditingWidget({ ...editingWidget, min: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={editingWidget.max ?? 100}
                            onChange={(e) => setEditingWidget({ ...editingWidget, max: parseFloat(e.target.value) || 100 })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Warning / Critical Limit</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Warn"
                            value={editingWidget.warnThreshold ?? ''}
                            onChange={(e) => setEditingWidget({ ...editingWidget, warnThreshold: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                          <input
                            type="number"
                            placeholder="Critical"
                            value={editingWidget.critThreshold ?? ''}
                            onChange={(e) => setEditingWidget({ ...editingWidget, critThreshold: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column Width Span */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Grid Width Span</label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {[1, 2, 3].map((span) => (
                          <button
                            key={span}
                            type="button"
                            onClick={() => setEditingWidget({ ...editingWidget, colSpan: span as any })}
                            className={`py-2 px-3 rounded-xl border text-center font-medium ${
                              editingWidget.colSpan === span
                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 font-bold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {span === 1 ? '1 Col (1/3)' : span === 2 ? '2 Cols (2/3)' : 'Full (3/3)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveWidgetConfig(editingWidget)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20"
              >
                Apply Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
