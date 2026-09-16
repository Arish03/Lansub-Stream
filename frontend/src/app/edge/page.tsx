'use client';

import { useState } from 'react';
import { 
  HardDrive, Cpu, Server, CheckCircle2, AlertTriangle, 
  RefreshCw, ArrowUpCircle, Terminal, Layers, Wifi
} from 'lucide-react';

interface EdgeNode {
  id: string;
  name: string;
  ip: string;
  version: string;
  status: 'online' | 'updating' | 'offline';
  cpu: string;
  ram: string;
  containers: string[];
}

const EDGE_NODES: EdgeNode[] = [
  {
    id: 'NODE-01',
    name: 'Main Plant Edge Gateway EG-01',
    ip: '192.168.1.50',
    version: 'K3s v1.28.4+k3s1',
    status: 'online',
    cpu: '24%',
    ram: '1.8GB / 4.0GB',
    containers: ['aedes-mqtt-broker', 'telemetry-sieve', 'redis-replica', 'cv-inference-yolo']
  },
  {
    id: 'NODE-02',
    name: 'Machining Bay Sub-Gateway EG-02',
    ip: '192.168.1.51',
    version: 'K3s v1.28.4+k3s1',
    status: 'online',
    cpu: '18%',
    ram: '1.2GB / 4.0GB',
    containers: ['modbus-bridge', 'opc-ua-collector', 'local-buffer']
  }
];

export default function EdgeComputingPage() {
  const [nodes, setNodes] = useState<EdgeNode[]>(EDGE_NODES);
  const [updatingNode, setUpdatingNode] = useState<string | null>(null);

  const handleOTAUpdate = (id: string) => {
    setUpdatingNode(id);
    setTimeout(() => {
      setUpdatingNode(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <HardDrive className="w-3.5 h-3.5" /> Edge Orchestration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edge Computing & Gateways</h1>
          <p className="text-sm text-slate-400 mt-1">
            K3s lightweight container clusters, local offline telemetry caching, and Over-The-Air (OTA) runtime deployments.
          </p>
        </div>

        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          2 / 2 Gateways Synchronized
        </span>
      </div>

      {/* Nodes List */}
      <div className="space-y-6">
        {nodes.map(node => (
          <div
            key={node.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">{node.name}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                    <span>{node.id}</span>
                    <span>•</span>
                    <span>{node.ip}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{node.version}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOTAUpdate(node.id)}
                  disabled={updatingNode === node.id}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updatingNode === node.id ? 'animate-spin' : ''}`} />
                  {updatingNode === node.id ? 'Deploying OTA...' : 'Push Firmware OTA'}
                </button>
              </div>
            </div>

            {/* Resource Gauges & Containers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Edge CPU Utilization</span>
                  <strong className="text-white font-mono">{node.cpu}</strong>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{ width: node.cpu }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Edge Memory Allocation</span>
                  <strong className="text-white font-mono">{node.ram}</strong>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 block mb-1.5 font-medium">Running Edge Containers (K3s)</span>
                <div className="flex flex-wrap gap-1.5">
                  {node.containers.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
