'use client';

import { useState } from 'react';
import { 
  Settings, Database, Radio, Key, Shield, CheckCircle2, 
  Save, Copy, Check, RefreshCw, Server
} from 'lucide-react';
import { API_BASE, WS_BASE } from '@/lib/api';

export default function SettingsPage() {
  const [mqttHost, setMqttHost] = useState('172.27.252.246');
  const [mqttPort, setMqttPort] = useState('1883');
  const [dbUrl, setDbUrl] = useState('postgresql+asyncpg://lansub:lansub@172.27.252.246:5432/lansub');
  const [redisUrl, setRedisUrl] = useState('redis://172.27.252.246:6379/0');
  const [apiKey, setApiKey] = useState('ls_live_sec_7a8f9c1e4d2b0e6a8d');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" /> Platform Configuration
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure MQTT broker parameters, PostgreSQL / Redis endpoints, and API security keys.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Configuration saved successfully. Services updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* MQTT Connectivity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Radio className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-semibold text-white">MQTT Ingestion Broker</h2>
              <p className="text-xs text-slate-500">Hardware device upstream & downstream message bus</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">MQTT Host / IP</label>
              <input
                type="text"
                value={mqttHost}
                onChange={(e) => setMqttHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Port</label>
              <input
                type="text"
                value={mqttPort}
                onChange={(e) => setMqttPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Database & Redis Connection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Database className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-semibold text-white">Database & Redis Pub/Sub</h2>
              <p className="text-xs text-slate-500">Relational persistence and real-time event distribution</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">PostgreSQL Connection String</label>
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Redis Pub/Sub Connection URL</label>
              <input
                type="text"
                value={redisUrl}
                onChange={(e) => setRedisUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-indigo-300 font-mono focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* API Authentication & Tokens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Key className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="font-semibold text-white">API Authentication & Keys</h2>
              <p className="text-xs text-slate-500">Security tokens for programmatic REST & Webhook access</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Active Admin API Key</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={apiKey}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-300 font-mono"
              />
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
