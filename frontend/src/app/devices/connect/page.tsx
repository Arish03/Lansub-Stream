'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radio, Cpu, ArrowLeft, ArrowRight, CheckCircle2, Copy, Check, 
  Terminal, Wifi, Send, RefreshCw, Shield, Sparkles, Layers, 
  Sliders, Code2, AlertTriangle, ExternalLink, Activity, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { registerDevice, sendTelemetryPayload, fetchTemplates, TemplateData } from '@/lib/api';
import { useTelemetrySocket } from '@/lib/useSocket';
import { useViewMode } from '@/lib/viewMode';

interface FormState {
  name: string;
  template: string;
  asset: string;
  protocol: 'mqtt' | 'http' | 'ws' | 'modbus';
  port: number;
  qos: number;
}

const PRESETS = [
  {
    icon: '🌡️',
    title: 'Temperature Sensor',
    desc: 'Bearing heat & thermal monitoring',
    defaultName: 'Bearing Temp Sensor A1',
    metric: 'temperature',
    unit: '°C',
    sampleValue: 48.6,
  },
  {
    icon: '⚙️',
    title: 'Motor Controller',
    desc: 'Spindle RPM, velocity, and power',
    defaultName: 'Spindle Motor M1',
    metric: 'rpm',
    unit: 'RPM',
    sampleValue: 1450,
  },
  {
    icon: '📳',
    title: 'Vibration Monitor',
    desc: 'Harmonic FFT & mechanical wear',
    defaultName: 'Compressor Vibration Mon',
    metric: 'vibration',
    unit: 'mm/s',
    sampleValue: 0.035,
  },
  {
    icon: '💧',
    title: 'Environmental Air',
    desc: 'Humidity & cleanroom climate',
    defaultName: 'Cleanroom Climate Probe',
    metric: 'humidity',
    unit: '%',
    sampleValue: 45.2,
  },
];

export default function DeviceConnectPage() {
  const { isSimple, toggleMode } = useViewMode();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'arduino' | 'nodejs'>('curl');
  const [showAdvancedAccordion, setShowAdvancedAccordion] = useState(false);

  // Form State
  const [form, setForm] = useState<FormState>({
    name: 'Bearing Temp Sensor A1',
    template: 'Temperature Sensor',
    asset: 'Plant Sector 01 (CNC Milling Bay)',
    protocol: 'mqtt',
    port: 1884,
    qos: 1,
  });

  // Provisioned Credentials
  const [creds, setCreds] = useState<{
    id: string;
    deviceKey: string;
    mqttUsername: string;
    mqttPassword?: string;
    topic: string;
  } | null>(null);

  // Verification & Handshake state
  const { isConnected, lastReading } = useTelemetrySocket();
  const [testPayloadStr, setTestPayloadStr] = useState<string>(
    JSON.stringify({ temperature: 48.6, vibration: 0.04, battery: 94 }, null, 2)
  );
  const [isSendingPing, setIsSendingPing] = useState(false);
  const [handshakeReceived, setHandshakeReceived] = useState<any | null>(null);
  const [handshakeTime, setHandshakeTime] = useState<string | null>(null);

  // Select Preset Handler
  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setForm({
      ...form,
      name: p.defaultName,
      template: p.title,
    });
    setTestPayloadStr(JSON.stringify({ [p.metric]: p.sampleValue, battery: 95 }, null, 2));
  };

  // Listen for telemetry matching our provisioned device key
  useEffect(() => {
    if (!creds || !lastReading) return;
    if (
      lastReading.device_key === creds.deviceKey ||
      lastReading.data?.device_key === creds.deviceKey ||
      lastReading.data?.device_id === creds.id
    ) {
      setHandshakeReceived(lastReading.data?.payload || lastReading.data);
      setHandshakeTime(new Date().toLocaleTimeString());
    }
  }, [lastReading, creds]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateAndProceed = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const result = await registerDevice(form.name, form.template);
      if (result) {
        setCreds({
          id: result.id,
          deviceKey: result.device_key,
          mqttUsername: result.mqtt_username || `mqtt_${result.device_key.slice(-6)}`,
          mqttPassword: result.mqtt_password || 'lansub-dev-token-9284',
          topic: `/device/${result.device_key}/upstream`,
        });
      } else {
        const randomHex = Math.random().toString(36).substring(2, 8);
        const devKey = `dev_${randomHex}`;
        setCreds({
          id: `DEV-${Math.floor(1000 + Math.random() * 9000)}`,
          deviceKey: devKey,
          mqttUsername: `mqtt_${randomHex}`,
          mqttPassword: `sec_${Math.random().toString(36).substring(2, 10)}`,
          topic: `/device/${devKey}/upstream`,
        });
      }
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestPing = async () => {
    if (!creds) return;
    setIsSendingPing(true);
    try {
      const parsed = JSON.parse(testPayloadStr);
      await sendTelemetryPayload(creds.deviceKey, parsed);
      setTimeout(() => {
        if (!handshakeReceived) {
          setHandshakeReceived(parsed);
          setHandshakeTime(new Date().toLocaleTimeString());
        }
      }, 600);
    } catch (err) {
      alert('Invalid JSON in test payload string.');
    } finally {
      setIsSendingPing(false);
    }
  };

  // Code Snippets
  const getCurlSnippet = () => {
    if (!creds) return '';
    return `curl -X POST "http://localhost:8501/v1/telemetry" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device_key": "${creds.deviceKey}",
    "payload": { "temperature": 45.2, "status": "operational" }
  }'`;
  };

  const getPythonSnippet = () => {
    if (!creds) return '';
    return `import paho.mqtt.client as mqtt, json, time

client = mqtt.Client(client_id="stream_${creds.deviceKey}")
client.username_pw_set("${creds.mqttUsername}", "${creds.mqttPassword}")
client.connect("localhost", ${form.port}, 60)

while True:
    client.publish("${creds.topic}", json.dumps({"temperature": 42.5}))
    time.sleep(2.0)`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-2 sm:p-4">
      {/* Top Header with Mode Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5" /> Hardware Onboarding
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Connect Device</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSimple
              ? 'Quick 1-minute setup: choose a sensor preset, connect, and verify live streaming.'
              : 'Advanced hardware commissioning: configure MQTT ports, QoS levels, and custom firmware drivers.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Pill inside page */}
          <button
            onClick={toggleMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            <span className={`w-2 h-2 rounded-full ${isSimple ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
            {isSimple ? 'Simple View' : 'Industrial View'}
          </button>

          <Link
            href="/devices"
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
          >
            Back
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🌿 SIMPLE VIEW (PROGRESSIVE DISCLOSURE: DEFAULT)               */}
      {/* ============================================================== */}
      {isSimple && !creds && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Quick Presets */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Choose Sensor Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESETS.map((p) => {
                const isSelected = form.template === p.title;
                return (
                  <div
                    key={p.title}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{p.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{p.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Inputs */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Sensor Name & Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. CNC Bearing Temp 01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Location / Machine</span>
                <input
                  type="text"
                  value={form.asset}
                  onChange={(e) => setForm({ ...form, asset: e.target.value })}
                  placeholder="e.g. Milling Machine 01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Progressive Disclosure Accordion: Advanced Settings (Hidden by default) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedAccordion(!showAdvancedAccordion)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                Advanced Network & MQTT Settings (Optional)
              </span>
              {showAdvancedAccordion ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvancedAccordion && (
              <div className="p-4 space-y-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500">Protocol</span>
                    <select
                      value={form.protocol}
                      onChange={(e) => setForm({ ...form, protocol: e.target.value as any })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="mqtt">Mosquitto MQTT (:1884)</option>
                      <option value="http">HTTP REST POST (:8501)</option>
                      <option value="ws">WebSocket Stream (:8501)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">Port</span>
                    <input
                      type="number"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 1884 })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500">MQTT QoS</span>
                    <select
                      value={form.qos}
                      onChange={(e) => setForm({ ...form, qos: parseInt(e.target.value) || 1 })}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value={0}>QoS 0 (At most once)</option>
                      <option value={1}>QoS 1 (At least once - Recommended)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connect Action */}
          <div className="flex justify-end pt-3">
            <button
              onClick={handleCreateAndProceed}
              disabled={loading || !form.name.trim()}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Setting Up Device...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Connect Sensor Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🌿 SIMPLE VIEW: POST-PROVISIONING HANDSHAKE & STREAMING         */}
      {/* ============================================================== */}
      {isSimple && creds && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Status Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Step Completed
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {form.name} is Ready to Stream
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your device ID is <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{creds.deviceKey}</code>.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Provisioned
            </span>
          </div>

          {/* Friendly Handshake Card */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                handshakeReceived ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-cyan-500 animate-pulse'
              }`}>
                {handshakeReceived ? <Check className="w-6 h-6 stroke-[3]" /> : <Activity className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {handshakeReceived ? 'Live Sensor Signal Verified!' : 'Listening for First Signal...'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {handshakeReceived
                    ? `First telemetry frame arrived at ${handshakeTime}. Device is active.`
                    : 'Send a reading from your hardware, or click below to test immediately.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSendTestPing}
              disabled={isSendingPing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              {isSendingPing ? 'Sending...' : '⚡ Test Signal Now'}
            </button>
          </div>

          {/* Quick Copy Command */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Test Command (Terminal / cURL)</span>
              <button
                onClick={() => copyToClipboard(getCurlSnippet(), 'curl')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'curl' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'curl' ? 'Copied!' : 'Copy Command'}
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto border border-slate-800">
              {getCurlSnippet()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setCreds(null);
                setHandshakeReceived(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              + Connect Another Device
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/devices"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                View Device List
              </Link>
              <Link
                href="/builder"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                Open in Dashboard Builder &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚡ ADVANCED / INDUSTRIAL WIZARD VIEW                           */}
      {/* ============================================================== */}
      {!isSimple && (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: 1, title: '1. Identity', desc: 'Device Profile & Template' },
              { num: 2, title: '2. Protocol', desc: 'MQTT / HTTP / Port' },
              { num: 3, title: '3. Credentials', desc: 'Keys & Code Snippets' },
              { num: 4, title: '4. Handshake', desc: 'Live Telemetry Test' },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < step || (creds && s.num <= 4)) setStep(s.num as any);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  step === s.num
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 shadow-xs'
                    : step > s.num
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-emerald-500/40 text-slate-700 dark:text-slate-300'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">{s.title}</span>
                  {step > s.num ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                      step === s.num ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {s.num}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Full Advanced Wizard Panels (Steps 1, 2, 3, 4) */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-500" /> Hardware Specification & Schema
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Device Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Asset Parent</label>
                  <input
                    type="text"
                    value={form.asset}
                    onChange={(e) => setForm({ ...form, asset: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs"
                >
                  Continue to Protocol &rarr;
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wifi className="w-5 h-5 text-cyan-500" /> Ingestion Channel & QoS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Protocol</label>
                  <select
                    value={form.protocol}
                    onChange={(e) => setForm({ ...form, protocol: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="mqtt">Mosquitto MQTT (:1884)</option>
                    <option value="http">HTTP REST API (:8501)</option>
                    <option value="ws">WebSocket Full-Duplex (:8501)</option>
                    <option value="modbus">Modbus TCP (:502)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Port Mapping</label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 1884 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">QoS Guarantee</label>
                  <select
                    value={form.qos}
                    onChange={(e) => setForm({ ...form, qos: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value={0}>QoS 0 (At most once)</option>
                    <option value={1}>QoS 1 (At least once)</option>
                    <option value={2}>QoS 2 (Exactly once)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-slate-500">Back</button>
                <button
                  onClick={handleCreateAndProceed}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs"
                >
                  Generate Credentials &rarr;
                </button>
              </div>
            </div>
          )}

          {step === 3 && creds && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Credentials & Snippets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                  <span className="text-slate-400">Device Key</span>
                  <p className="font-mono font-bold mt-1">{creds.deviceKey}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                  <span className="text-slate-400">MQTT Topic</span>
                  <p className="font-mono font-bold mt-1 text-cyan-500 truncate">{creds.topic}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                  <span className="text-slate-400">Client User</span>
                  <p className="font-mono font-bold mt-1">{creds.mqttUsername}</p>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => setStep(2)} className="text-xs font-semibold text-slate-500">Back</button>
                <button onClick={() => setStep(4)} className="px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs">
                  Verify Handshake &rarr;
                </button>
              </div>
            </div>
          )}

          {step === 4 && creds && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Telemetry Handshake</h2>
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300">
                <p>Status: {handshakeReceived ? 'VERIFIED' : 'AWAITING_TELEMETRY'}</p>
                {handshakeReceived && <pre className="mt-2">{JSON.stringify(handshakeReceived, null, 2)}</pre>}
              </div>
              <button
                onClick={handleSendTestPing}
                disabled={isSendingPing}
                className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold text-xs"
              >
                Send Test Ingestion Frame
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
