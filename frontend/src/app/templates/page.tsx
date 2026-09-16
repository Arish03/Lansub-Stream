'use client';

import { Plus, Cpu, ToggleRight, Video, MapPin, MoreHorizontal, Eye, Edit, Trash2, Copy } from 'lucide-react';

const TEMPLATES = [
  {
    id: 1,
    name: 'Temperature Sensor',
    type: 'Sensor',
    icon: '🌡️',
    color: 'from-orange-500 to-red-500',
    attributes: [
      { name: 'temperature', type: 'float', unit: '°C' },
      { name: 'humidity', type: 'float', unit: '%' },
      { name: 'pressure', type: 'float', unit: 'hPa' },
      { name: 'battery', type: 'float', unit: '%' },
    ],
    devices: 24,
    lastModified: '2 days ago',
  },
  {
    id: 2,
    name: 'Motor Controller',
    type: 'Control',
    icon: '⚙️',
    color: 'from-blue-500 to-indigo-500',
    attributes: [
      { name: 'start', type: 'command', unit: '—' },
      { name: 'stop', type: 'command', unit: '—' },
      { name: 'speed', type: 'integer', unit: 'RPM' },
      { name: 'direction', type: 'enum', unit: 'CW/CCW' },
    ],
    devices: 8,
    lastModified: '5 days ago',
  },
  {
    id: 3,
    name: 'Safety Camera',
    type: 'CCTV',
    icon: '📹',
    color: 'from-emerald-500 to-teal-500',
    attributes: [
      { name: 'person_count', type: 'integer', unit: '—' },
      { name: 'helmet_detected', type: 'boolean', unit: '—' },
      { name: 'restricted_zone', type: 'boolean', unit: '—' },
      { name: 'anomaly', type: 'boolean', unit: '—' },
    ],
    devices: 12,
    lastModified: '1 week ago',
  },
  {
    id: 4,
    name: 'Fleet Vehicle',
    type: 'Navigation',
    icon: '🚛',
    color: 'from-purple-500 to-pink-500',
    attributes: [
      { name: 'latitude', type: 'float', unit: '°' },
      { name: 'longitude', type: 'float', unit: '°' },
      { name: 'speed', type: 'float', unit: 'km/h' },
      { name: 'fuel_level', type: 'float', unit: '%' },
    ],
    devices: 6,
    lastModified: '3 days ago',
  },
  {
    id: 5,
    name: 'Power Meter',
    type: 'Sensor',
    icon: '⚡',
    color: 'from-amber-500 to-yellow-500',
    attributes: [
      { name: 'voltage', type: 'float', unit: 'V' },
      { name: 'current', type: 'float', unit: 'A' },
      { name: 'power_kw', type: 'float', unit: 'kW' },
      { name: 'energy_kwh', type: 'float', unit: 'kWh' },
    ],
    devices: 16,
    lastModified: '1 day ago',
  },
  {
    id: 6,
    name: 'Vibration Sensor',
    type: 'Sensor',
    icon: '📳',
    color: 'from-cyan-500 to-sky-500',
    attributes: [
      { name: 'vibration_x', type: 'float', unit: 'mm/s' },
      { name: 'vibration_y', type: 'float', unit: 'mm/s' },
      { name: 'vibration_z', type: 'float', unit: 'mm/s' },
      { name: 'rms', type: 'float', unit: 'mm/s' },
    ],
    devices: 10,
    lastModified: '4 days ago',
  },
];

const TYPE_BADGES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  Sensor: { label: 'Sensor', icon: Cpu, className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  Control: { label: 'Control', icon: ToggleRight, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  CCTV: { label: 'CCTV', icon: Video, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Navigation: { label: 'Navigation', icon: MapPin, className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Device Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage device schemas for your IoT fleet</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template Type Filter */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">All</button>
        {Object.entries(TYPE_BADGES).map(([key, badge]) => (
          <button key={key} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all">
            {badge.label}
          </button>
        ))}
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-3 gap-4">
        {TEMPLATES.map(template => {
          const badge = TYPE_BADGES[template.type];
          const BadgeIcon = badge.icon;
          return (
            <div key={template.id} className="bg-slate-900 border border-slate-800/60 rounded-xl overflow-hidden hover:border-slate-700/60 transition-all group">
              {/* Card Header */}
              <div className={`h-1.5 bg-gradient-to-r ${template.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                      <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badge.className}`}>
                        <BadgeIcon className="w-2.5 h-2.5" />
                        {badge.label}
                      </div>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-md text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Attributes */}
                <div className="space-y-1.5 mb-4">
                  {template.attributes.map(attr => (
                    <div key={attr.name} className="flex items-center justify-between py-1 px-2.5 rounded bg-slate-800/30 text-xs">
                      <span className="text-slate-300 font-mono">{attr.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{attr.type}</span>
                        <span className="text-slate-700">•</span>
                        <span className="text-slate-500">{attr.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>{template.devices} devices</span>
                    <span>•</span>
                    <span>{template.lastModified}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-1 rounded text-slate-600 hover:text-cyan-400 hover:bg-slate-800/50" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-600 hover:text-blue-400 hover:bg-slate-800/50" title="Edit">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800/50" title="Clone">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
