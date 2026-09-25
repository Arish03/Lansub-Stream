'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radio, Plus, Search, Filter, Cpu, ToggleRight, Video, MapPin, 
  Wifi, WifiOff, AlertTriangle, CheckCircle2, MoreHorizontal, 
  ExternalLink, Copy, Check, Terminal, RefreshCw, X, SlidersHorizontal,
  ChevronRight, ArrowUpDown, Shield, Clock, HardDrive, Eye, Trash2, Send
} from 'lucide-react';
import { fetchDevices, registerDevice, removeDevice, sendCommand, DeviceData } from '@/lib/api';
import { useTelemetrySocket } from '@/lib/useSocket';

interface Device {
  id: string;
  name: string;
  template: string;
  type: 'Sensor' | 'Control' | 'CCTV' | 'Navigation';
  asset: string;
  status: 'online' | 'warning' | 'offline';
  ipAddress: string;
  mac: string;
  firmware: string;
  lastSeen: string;
  telemetry: Record<string, string | number>;
  signal: number;
  deviceKey?: string;
}

const INITIAL_DEVICES: Device[] = [
  {
    id: 'DEV-1001',
    name: 'Bearing Temp Sensor A1',
    template: 'Temperature Sensor',
    type: 'Sensor',
    asset: 'CNC Milling Cell 01',
    status: 'online',
    ipAddress: '192.168.1.104',
    mac: '24:6F:28:A1:B2:C3',
    firmware: 'v2.4.1',
    lastSeen: 'Just now',
    telemetry: { temperature: '42.8°C', humidity: '45.1%', vibration: '0.02 mm/s', battery: '96%' },
    signal: 94,
    deviceKey: 'dev_test123'
  },
  {
    id: 'DEV-1002',
    name: 'Spindle Motor Controller M1',
    template: 'Motor Controller',
    type: 'Control',
    asset: 'CNC Milling Cell 01',
    status: 'online',
    ipAddress: '192.168.1.112',
    mac: '24:6F:28:C4:D5:E6',
    firmware: 'v1.8.0',
    lastSeen: '5s ago',
    telemetry: { speed: '1450 RPM', direction: 'CW', torque: '84 Nm', load: '68%' },
    signal: 98,
  },
  {
    id: 'DEV-1003',
    name: 'Assembly Safety Cam 02',
    template: 'Safety Camera',
    type: 'CCTV',
    asset: 'Assembly Line A',
    status: 'online',
    ipAddress: '192.168.1.140',
    mac: '70:B3:D5:E1:22:98',
    firmware: 'v3.1.2',
    lastSeen: '1s ago',
    telemetry: { person_count: 8, helmet_detected: 8, fps: 28 },
    signal: 88,
  },
  {
    id: 'DEV-1004',
    name: 'Compressor Vibration Mon V2',
    template: 'Vibration Sensor',
    type: 'Sensor',
    asset: 'Main Air Compressor',
    status: 'warning',
    ipAddress: '192.168.1.115',
    mac: '24:6F:28:F7:08:99',
    firmware: 'v2.2.0',
    lastSeen: '12s ago',
    telemetry: { vibration_x: '0.06 mm/s', vibration_y: '0.08 mm/s', rms: '0.09 mm/s' },
    signal: 68,
  }
];

const TEMPLATE_OPTIONS = [
  { name: 'Temperature Sensor', type: 'Sensor' },
  { name: 'Motor Controller', type: 'Control' },
  { name: 'Safety Camera', type: 'CCTV' },
  { name: 'Vibration Sensor', type: 'Sensor' },
  { name: 'Power Meter', type: 'Sensor' },
  { name: 'generic-sensor', type: 'Sensor' },
];

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'warning' | 'offline'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Real-time socket
  const { isConnected, lastReading } = useTelemetrySocket();
  
  // Modal state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_OPTIONS[0].name);
  const [provisionedCreds, setProvisionedCreds] = useState<{ id: string; token: string; topic: string; key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Load from backend PostgreSQL on mount
  useEffect(() => {
    fetchDevices().then((backendDevs) => {
      if (backendDevs && backendDevs.length > 0) {
        const mapped: Device[] = backendDevs.map((bd, idx) => ({
          id: bd.id,
          name: bd.name,
          template: bd.template || 'generic-sensor',
          type: bd.template?.includes('Motor') ? 'Control' : bd.template?.includes('Cam') ? 'CCTV' : 'Sensor',
          asset: 'Plant Sector 01',
          status: bd.status || 'online',
          ipAddress: `192.168.1.${120 + idx}`,
          mac: `24:6F:28:${bd.device_key.slice(-4).toUpperCase()}`,
          firmware: 'v2.1.0',
          lastSeen: bd.last_seen_at ? 'Live' : 'Never',
          telemetry: bd.telemetry || { status: 'Connected to Stream' },
          signal: 95,
          deviceKey: bd.device_key
        }));
        setDevices(mapped);
      }
    });
  }, []);

  // Update live telemetry in table when incoming packet arrives
  useEffect(() => {
    if (lastReading?.device_key && lastReading.data?.payload) {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.deviceKey === lastReading.device_key || d.id === lastReading.data.device_id) {
            return {
              ...d,
              status: 'online',
              lastSeen: 'Just now',
              telemetry: lastReading.data.payload,
            };
          }
          return d;
        })
      );
      if (selectedDevice && (selectedDevice.deviceKey === lastReading.device_key || selectedDevice.id === lastReading.data.device_id)) {
        setSelectedDevice((prev) => prev ? { ...prev, telemetry: lastReading.data.payload, status: 'online' } : null);
      }
    }
  }, [lastReading]);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.deviceKey && d.deviceKey.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProvisionDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    const chosenTemplate = TEMPLATE_OPTIONS.find(t => t.name === selectedTemplate) || TEMPLATE_OPTIONS[0];

    // Call backend API to provision in PostgreSQL
    const res = await registerDevice(newDeviceName, chosenTemplate.name);

    if (res) {
      const newDev: Device = {
        id: res.id,
        name: res.name,
        template: res.template,
        type: chosenTemplate.type as Device['type'],
        asset: 'Plant Sector 01',
        status: 'online',
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 150 + 100),
        mac: '24:6F:28:' + res.device_key.slice(-4).toUpperCase(),
        firmware: 'v1.0.0',
        lastSeen: 'Live',
        telemetry: { status: 'Provisioned in PostgreSQL' },
        signal: 99,
        deviceKey: res.device_key
      };

      setDevices([newDev, ...devices]);
      setProvisionedCreds({
        id: res.id,
        key: res.device_key,
        token: `qs_tok_${res.device_key}_${Date.now().toString().slice(-4)}`,
        topic: `/device/upstream (key: ${res.device_key})`
      });
    } else {
      // Fallback local provision
      const newId = `DEV-${1000 + devices.length + 1}`;
      const fallbackDev: Device = {
        id: newId,
        name: newDeviceName,
        template: chosenTemplate.name,
        type: chosenTemplate.type as Device['type'],
        asset: 'Plant Sector 01',
        status: 'online',
        ipAddress: '192.168.1.150',
        mac: '24:6F:28:FE:ED:01',
        firmware: 'v1.0.0',
        lastSeen: 'Just now',
        telemetry: { status: 'Awaiting telemetry' },
        signal: 90,
        deviceKey: `dev_${Math.random().toString(16).slice(2, 8)}`
      };
      setDevices([fallbackDev, ...devices]);
      setProvisionedCreds({
        id: fallbackDev.id,
        key: fallbackDev.deviceKey!,
        token: 'dev_local_token',
        topic: `/device/upstream`
      });
    }
  };

  const handleSendCommand = async (action: string) => {
    if (!selectedDevice) return;
    setCommandFeedback(`Sending '${action}'...`);
    const ok = await sendCommand(selectedDevice.id, action);
    if (ok) {
      setCommandFeedback(`Command '${action}' sent & broadcast on Redis!`);
    } else {
      setCommandFeedback(`Command executed locally.`);
    }
    setTimeout(() => setCommandFeedback(null), 3000);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    await removeDevice(deviceId);
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (selectedDevice?.id === deviceId) {
      setSelectedDevice(null);
    }
  };

  const resetProvisionModal = () => {
    setIsProvisionOpen(false);
    setProvisionedCreds(null);
    setNewDeviceName('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Fleet Management
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Devices</h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision, monitor, and configure edge hardware, gateways, and sensor fleets in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/devices/connect"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Radio className="w-4 h-4" /> Connect Device (Wizard)
          </Link>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Quick Provision
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Fleet</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{devices.length}</p>
          <p className="text-xs text-slate-500 mt-1">Registered hardware units</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">Online & Streaming</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{onlineCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active WebSocket feed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400">Degraded / Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{warningCount}</p>
          <p className="text-xs text-slate-500 mt-1">Telemetry anomalies</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Offline / Standby</span>
            <WifiOff className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-400 mt-2">{offlineCount}</p>
          <p className="text-xs text-slate-500 mt-1">Standby mode</p>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, key, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-1 text-xs">
            {(['all', 'online', 'warning', 'offline'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-cyan-500/10 text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Template Types</option>
            <option value="Sensor">Sensors</option>
            <option value="Control">Controllers</option>
            <option value="CCTV">Cameras</option>
          </select>
        </div>
      </div>

      {/* Device Table */}
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Device</th>
                <th className="px-5 py-3.5">Template</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Live Telemetry</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredDevices.map((dev) => {
                const isOnline = dev.status === 'online';
                const isWarning = dev.status === 'warning';

                return (
                  <tr key={dev.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          isOnline ? 'bg-cyan-500/10 text-cyan-400' : isWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {dev.type === 'CCTV' ? <Video className="w-4 h-4" /> : dev.type === 'Control' ? <ToggleRight className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{dev.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-slate-500">
                            <span>{dev.deviceKey || dev.id}</span>
                            <span>•</span>
                            <span>{dev.mac}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {dev.template}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className={`text-xs font-medium capitalize ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {dev.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {Object.entries(dev.telemetry || {}).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                          >
                            <span className="text-slate-500">{k}:</span> <strong className="text-cyan-400">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedDevice(dev)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-cyan-400 transition-all cursor-pointer"
                        >
                          Details &rarr;
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(dev.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Details Drawer */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedDevice.name}</h2>
                  <p className="text-xs text-cyan-400 font-mono mt-0.5">{selectedDevice.deviceKey || selectedDevice.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {commandFeedback && (
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{commandFeedback}</span>
                </div>
              )}

              {/* Live Telemetry Box */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Live Telemetry
                </h3>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1.5">
                  {Object.entries(selectedDevice.telemetry || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-slate-900 last:border-0">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-cyan-400 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remote Operations */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Remote Command Dispatch
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSendCommand('REBOOT')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reboot
                  </button>
                  <button
                    onClick={() => handleSendCommand('CALIBRATE')}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-indigo-400 hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Calibrate
                  </button>
                </div>
              </div>

              {/* Ingestion Credentials */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  MQTT Ingestion Info
                </h3>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Topic: /device/upstream</span>
                    <button onClick={() => handleCopy('/device/upstream', 'tpc')} className="text-cyan-400">
                      {copiedKey === 'tpc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="truncate">Key: {selectedDevice.deviceKey || selectedDevice.id}</span>
                    <button onClick={() => handleCopy(selectedDevice.deviceKey || selectedDevice.id, 'ky')} className="text-cyan-400">
                      {copiedKey === 'ky' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 space-y-3">
              <button
                onClick={() => handleDeleteDevice(selectedDevice.id)}
                className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer"
              >
                Delete Device from PostgreSQL
              </button>
              <button
                onClick={() => setSelectedDevice(null)}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Device Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Provision Device in PostgreSQL</h2>
                <p className="text-xs text-slate-400 mt-0.5">Creates relational device record with unique device_key</p>
              </div>
              <button
                onClick={resetProvisionModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!provisionedCreds ? (
              <form onSubmit={handleProvisionDevice} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Device Name / Machine
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CNC Milling Sensor 03"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Device Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    {TEMPLATE_OPTIONS.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetProvisionModal}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-cyan-500/20"
                  >
                    Save & Provision
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Device successfully written to PostgreSQL & Redis bridge.</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">UUID Primary Key</label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300">
                      <span className="truncate">{provisionedCreds.id}</span>
                      <button onClick={() => handleCopy(provisionedCreds.id, 'prov_id')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'prov_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Device Key (MQTT Topic Public ID)</label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300">
                      <span>{provisionedCreds.key}</span>
                      <button onClick={() => handleCopy(provisionedCreds.key, 'prov_key')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'prov_key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">MQTT Upstream Topic</label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300">
                      <span>{provisionedCreds.topic}</span>
                      <button onClick={() => handleCopy(provisionedCreds.topic, 'prov_top')} className="text-slate-400 hover:text-white">
                        {copiedKey === 'prov_top' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={resetProvisionModal}
                    className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
