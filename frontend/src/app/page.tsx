'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity, Cpu, ThermometerSun, Droplets,
  TrendingUp, Gauge, Server, Send, Radio, Wifi, WifiOff,
  ArrowUpRight, Clock, Zap, ChevronRight
} from 'lucide-react';
import { useTelemetrySocket } from '@/lib/useSocket';
import { fetchDevices, sendTelemetryPayload, fetchFleetKPIs, DeviceData, FleetKPIs } from '@/lib/api';

function StatusBadge({ status }: { status?: string }) {
  if (status === 'online') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Online
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Offline
    </span>
  );
}

function OEEDonut({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7"
        className="stroke-slate-100 dark:stroke-slate-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7"
        stroke={color} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

export default function Dashboard() {
  const { isConnected, lastReading, feed } = useTelemetrySocket();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [kpis, setKpis] = useState<FleetKPIs | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  const [liveTemp, setLiveTemp] = useState('42.5C');
  const [liveHumidity, setLiveHumidity] = useState('68.2%');
  const [liveSpeed, setLiveSpeed] = useState('1450 RPM');
  const [totalReadings, setTotalReadings] = useState(1284);

  useEffect(() => {
    fetchDevices().then((devs) => { setDevices(devs); setIsLoading(false); });
    fetchFleetKPIs().then((data) => setKpis(data));
  }, []);

  useEffect(() => {
    if (lastReading?.data?.payload) {
      const p = lastReading.data.payload;
      if (p.temperature !== undefined) setLiveTemp(`${p.temperature}C`);
      if (p.humidity !== undefined) setLiveHumidity(`${p.humidity}%`);
      if (p.speed !== undefined) setLiveSpeed(`${p.speed} RPM`);
      setTotalReadings((prev) => prev + 1);
      setDevices((prev) => {
        const exists = prev.some((d) => d.device_key === lastReading.device_key);
        if (!exists) return [...prev, { id: lastReading.data.device_id || 'dev_sim', name: lastReading.data.device_name || lastReading.device_key, device_key: lastReading.device_key, template: 'generic-sensor', status: 'online', last_seen_at: new Date().toISOString(), telemetry: p }];
        return prev.map((d) => d.device_key === lastReading.device_key ? { ...d, status: 'online', last_seen_at: new Date().toISOString(), telemetry: p } : d);
      });
    }
  }, [lastReading]);

  const handleSimulateBurst = async () => {
    setIsSimulating(true);
    setShowDevTools(false);
    const targetKey = devices[0]?.device_key || 'dev_test123';
    await sendTelemetryPayload(targetKey, {
      temperature: +(35 + Math.random() * 25).toFixed(1),
      humidity: +(45 + Math.random() * 20).toFixed(1),
      vibration: +(0.02 + Math.random() * 0.1).toFixed(3),
      battery: Math.floor(80 + Math.random() * 20),
    });
    setTimeout(() => setIsSimulating(false), 600);
  };

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status !== 'online').length;

  const KPI_CARDS = [
    { icon: ThermometerSun, label: 'Bearing Temp', value: liveTemp, badge: 'Live', badgeColor: 'text-emerald-500 dark:text-emerald-400', iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { icon: Droplets, label: 'Ambient Humidity', value: liveHumidity, badge: 'Relative', badgeColor: 'text-slate-400', iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { icon: Activity, label: 'Spindle Speed', value: liveSpeed, badge: 'Optimal', badgeColor: 'text-emerald-500 dark:text-emerald-400', iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { icon: Server, label: 'Packets Ingested', value: totalReadings.toLocaleString(), badge: '+5/sec', badgeColor: 'text-cyan-500 dark:text-cyan-400', iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="space-y-5 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">System Operations</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${isConnected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'}`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Feed Connected' : 'Reconnecting'}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{onlineCount} device{onlineCount !== 1 ? 's' : ''} streaming &bull; {totalReadings.toLocaleString()} packets processed</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowDevTools(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all cursor-pointer">
            <Zap className="w-3.5 h-3.5" /> Dev Tools
          </button>
          {showDevTools && (
            <div className="absolute right-0 top-9 z-20 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Inject Test Telemetry</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Sends a simulated burst to your first registered device.</p>
              <button onClick={handleSimulateBurst} disabled={isSimulating} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer">
                <Send className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                {isSimulating ? 'Sending...' : 'Inject Telemetry Spike'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:border-cyan-500/30 transition-all">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium truncate">{card.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{card.value}</p>
                <p className={`text-[10px] font-semibold ${card.badgeColor}`}>{card.badge}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Feed + OEE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Live Telemetry Feed</h2>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Redis Pub/Sub
            </span>
          </div>
          <div className="flex-1 min-h-[240px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
            {feed.length > 0 ? feed.slice(0, 8).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.data?.device_name || 'Industrial Sensor'}</p>
                  <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-500">{item.device_key}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[200px]">
                  {Object.entries(item.data?.payload || {}).slice(0, 3).map(([k, v]) => (
                    <span key={k} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">{k} </span>{String(v)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(item.data?.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full py-14 gap-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Listening for packets</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Send MQTT or HTTP telemetry to see it here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* OEE */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Plant OEE</h2>
            </div>
            {kpis && <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{kpis.oee.toFixed(1)}%</span>}
          </div>
          <div className="flex-1 p-5 flex flex-col gap-5">
            {kpis ? (
              <>
                <div className="flex items-center justify-center gap-5">
                  <div className="relative">
                    <OEEDonut value={kpis.oee} color="#22d3ee" size={84} />
                    <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-slate-900 dark:text-white">{kpis.oee.toFixed(0)}%</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Overall Equipment<br />Effectiveness</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Optimal</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Availability', value: kpis.availability, color: 'bg-cyan-500' },
                    { label: 'Performance', value: kpis.performance, color: 'bg-indigo-500' },
                    { label: 'Quality Rate', value: kpis.quality, color: 'bg-emerald-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500 dark:text-slate-400">{label}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{value.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-5 animate-pulse">
                <div className="flex justify-center"><div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800" /></div>
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5"><div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" /><div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5" />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{onlineCount}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Online</p>
              </div>
              <div>
                <p className={`text-lg font-bold ${offlineCount > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>{offlineCount}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Offline</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Provisioned Devices</h2>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{devices.length}</span>
          </div>
          <Link href="/devices" className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium">
            Manage all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" /><div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Cpu className="w-5 h-5 text-slate-400" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No devices registered yet</p>
              <Link href="/devices" className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Connect your first device</Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${device.status === 'online' ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Cpu className={`w-4 h-4 ${device.status === 'online' ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{device.name}</p>
                  <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-500">{device.device_key}</p>
                </div>
                <span className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{device.template}</span>
                <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
                <StatusBadge status={device.status} />
                <Link href={`/analytics?device=${device.device_key}`} className="hidden group-hover:flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline shrink-0">
                  Telemetry <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}