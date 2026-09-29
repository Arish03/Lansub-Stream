'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Cpu, ThermometerSun, Droplets, 
  TrendingUp, Gauge, Server, Send, Radio
} from 'lucide-react';
import { useTelemetrySocket, TelemetryBroadcast } from '@/lib/useSocket';
import { fetchDevices, sendTelemetryPayload, fetchFleetKPIs, DeviceData, FleetKPIs } from '@/lib/api';

export default function Dashboard() {
  const { isConnected, lastReading, feed } = useTelemetrySocket();
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [kpis, setKpis] = useState<FleetKPIs | null>(null);

  // Dynamic telemetry metrics
  const [liveTemp, setLiveTemp] = useState('42.5°C');
  const [liveHumidity, setLiveHumidity] = useState('68.2%');
  const [liveSpeed, setLiveSpeed] = useState('1450 RPM');
  const [totalReadings, setTotalReadings] = useState(1284);

  // Initial load
  useEffect(() => {
    fetchDevices().then((devs) => {
      setDevices(devs);
      setIsLoading(false);
    });
    fetchFleetKPIs().then((data) => setKpis(data));
  }, []);

  // Update metrics when new WebSocket broadcast arrives
  useEffect(() => {
    if (lastReading?.data?.payload) {
      const p = lastReading.data.payload;
      if (p.temperature !== undefined) setLiveTemp(`${p.temperature}°C`);
      if (p.humidity !== undefined) setLiveHumidity(`${p.humidity}%`);
      if (p.speed !== undefined) setLiveSpeed(`${p.speed} RPM`);
      setTotalReadings((prev) => prev + 1);

      // Update device lastSeen and telemetry in state, or add it if not yet in state
      setDevices((prev) => {
        const exists = prev.some((d) => d.device_key === lastReading.device_key);
        if (!exists) {
          return [
            ...prev,
            {
              id: lastReading.data.device_id || 'dev_sim',
              name: lastReading.data.device_name || lastReading.device_key,
              device_key: lastReading.device_key,
              template: 'generic-sensor',
              status: 'online',
              last_seen_at: new Date().toISOString(),
              telemetry: p,
            },
          ];
        }
        return prev.map((d) => {
          if (d.device_key === lastReading.device_key) {
            return {
              ...d,
              status: 'online',
              last_seen_at: new Date().toISOString(),
              telemetry: p,
            };
          }
          return d;
        });
      });
    }
  }, [lastReading]);

  // Handle manual test telemetry injection
  const handleSimulateBurst = async () => {
    setIsSimulating(true);
    const targetKey = devices[0]?.device_key || 'dev_test123';
    await sendTelemetryPayload(targetKey, {
      temperature: +(35 + Math.random() * 25).toFixed(1),
      humidity: +(45 + Math.random() * 20).toFixed(1),
      vibration: +(0.02 + Math.random() * 0.1).toFixed(3),
      battery: Math.floor(80 + Math.random() * 20),
    });
    setTimeout(() => setIsSimulating(false), 600);
  };

  const onlineCount = devices.filter((d) => d.status === 'online').length || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-500/10 via-slate-100 to-indigo-500/10 dark:from-cyan-950/40 dark:via-slate-900/60 dark:to-indigo-950/40 p-6 rounded-2xl border border-cyan-500/20 backdrop-blur shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Operations</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              Live Telemetry Stream
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time digital twins, Redis pub/sub ingestion, and industrial automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateBurst}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            Inject Telemetry Spike
          </button>
        </div>
      </div>

      {/* Primary KPI Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-5 hover:border-cyan-500/30 transition-all shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <ThermometerSun className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-all">{liveTemp}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">CNC Bearing Temperature (DEV-001)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-5 hover:border-cyan-500/30 transition-all shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Droplets className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Relative
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-all">{liveHumidity}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ambient Cell Humidity</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-5 hover:border-cyan-500/30 transition-all shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Optimal
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-all">{liveSpeed}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Spindle Motor Speed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/70 rounded-xl p-5 hover:border-cyan-500/30 transition-all shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Server className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">
              +5 / sec
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{totalReadings.toLocaleString()}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Telemetry Processed</p>
        </div>
      </div>

      {/* Middle Row: Live Stream Feed + OEE Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Redis Pub/Sub Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Live Telemetry Ingestion Feed</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Redis Pub/Sub: broadcast</span>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/60">
                <tr>
                  <th className="py-2.5 px-3">Device Key</th>
                  <th className="py-2.5 px-3">Device Name</th>
                  <th className="py-2.5 px-3">Readings</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {feed.length > 0 ? (
                  feed.slice(0, 7).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                        {item.device_key}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {item.data?.device_name || 'Industrial Sensor'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(item.data?.payload || {}).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-200"
                            >
                              <strong className="text-slate-500 dark:text-slate-400 font-normal">{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(item.data?.ts).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Listening for incoming MQTT / HTTP telemetry packets...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

          {/* Industrial OEE & Performance Summary */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> Plant Overall OEE
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                {kpis ? `${kpis.oee.toFixed(1)}% OEE` : '— Target'}
              </span>
            </div>

            {kpis === null ? (
              // Skeleton while loading
              <div className="space-y-4 pt-2 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-slate-200 dark:bg-slate-700 h-2 rounded-full w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Availability</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{kpis.availability.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-cyan-500 dark:bg-cyan-400 h-2 rounded-full transition-all duration-700" style={{ width: `${kpis.availability}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Performance</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{kpis.performance.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-700" style={{ width: `${kpis.performance}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Quality Rate</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{kpis.quality.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-700" style={{ width: `${kpis.quality}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Machines: <strong>{onlineCount} Online</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 Critical Alarms</span>
          </div>
        </div>
      </div>

      {/* Registered Devices Overview */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> Provisioned Devices (PostgreSQL)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {devices.length} registered assets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 hover:border-cyan-500/30 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{device.name}</h3>
                    <p className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400/80">{device.device_key}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      device.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {device.status || 'online'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Template: {device.template}</p>

                {device.telemetry && (
                  <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-xs space-y-1">
                    {Object.entries(device.telemetry).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">{k}:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/40 flex justify-between text-[11px] text-slate-500">
                <span>Updated: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString() : 'Recently'}</span>
                <Link
                  href={`/analytics?device=${device.device_key}`}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
                >
                  Telemetry &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
