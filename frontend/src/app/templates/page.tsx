'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Cpu, ToggleRight, Video, MapPin, MoreHorizontal, Eye, Edit, Trash2, Copy, X, Sparkles 
} from 'lucide-react';
import { fetchTemplates, createTemplate, deleteTemplate, TemplateData } from '@/lib/api';

const DEFAULT_TEMPLATES = [
  {
    id: 'TPL-001',
    name: 'Bearing Temperature Sensor',
    category: 'Sensor',
    description: 'Monitors industrial bearing surface and core temperature.',
    parameters: [
      { key: 'temperature', name: 'Temperature', type: 'float', unit: '°C' },
      { key: 'humidity', name: 'Humidity', type: 'float', unit: '%' },
      { key: 'vibration', name: 'Vibration', type: 'float', unit: 'mm/s' },
      { key: 'battery', name: 'Battery Level', type: 'float', unit: '%' },
    ],
    devicesCount: 18,
    created_at: '2 days ago',
  },
  {
    id: 'TPL-002',
    name: 'Spindle Motor Controller',
    category: 'Control',
    description: 'Controls high-speed CNC spindle velocity and direction.',
    parameters: [
      { key: 'speed', name: 'Speed', type: 'integer', unit: 'RPM' },
      { key: 'direction', name: 'Direction', type: 'string', unit: 'CW/CCW' },
      { key: 'torque', name: 'Torque', type: 'float', unit: 'Nm' },
      { key: 'load', name: 'Motor Load', type: 'float', unit: '%' },
    ],
    devicesCount: 8,
    created_at: '5 days ago',
  },
  {
    id: 'TPL-003',
    name: 'Assembly Safety Camera',
    category: 'CCTV',
    description: 'Vision stream monitoring PPE compliance and worker perimeter.',
    parameters: [
      { key: 'person_count', name: 'Worker Count', type: 'integer', unit: '—' },
      { key: 'helmet_detected', name: 'Helmet Status', type: 'boolean', unit: '—' },
      { key: 'zone_breach', name: 'Perimeter Breach', type: 'boolean', unit: '—' },
    ],
    devicesCount: 12,
    created_at: '1 week ago',
  },
];

const TYPE_BADGES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  Sensor: { label: 'Sensor', icon: Cpu, className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  Control: { label: 'Control', icon: ToggleRight, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  CCTV: { label: 'CCTV', icon: Video, className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Navigation: { label: 'Navigation', icon: MapPin, className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Modal Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sensor');
  const [description, setDescription] = useState('');
  const [paramKey, setParamKey] = useState('');
  const [paramUnit, setParamUnit] = useState('°C');
  const [paramList, setParamList] = useState<Array<{ key: string; name: string; type: string; unit: string }>>([]);

  const loadTemplates = async () => {
    const data = await fetchTemplates();
    if (data && data.length > 0) {
      setTemplates(data.map(d => ({
        id: d.id,
        name: d.name,
        category: d.category || 'Sensor',
        description: d.description || 'Device template schema',
        parameters: d.parameters || [],
        devicesCount: 0,
        created_at: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent',
      })));
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleAddParam = () => {
    if (!paramKey.trim()) return;
    setParamList([
      ...paramList,
      { key: paramKey.trim().toLowerCase(), name: paramKey.trim(), type: 'float', unit: paramUnit }
    ]);
    setParamKey('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const res = await createTemplate({
      name,
      category,
      description,
      parameters: paramList.length > 0 ? paramList : [
        { key: 'metric_val', name: 'Metric', type: 'float', unit: 'units' }
      ],
    });

    if (res) {
      setTemplates(prev => [{
        id: res.id,
        name: res.name,
        category: res.category,
        description: res.description,
        parameters: res.parameters,
        devicesCount: 0,
        created_at: 'Just now',
      }, ...prev]);
    }

    setIsCreateModalOpen(false);
    setName('');
    setDescription('');
    setParamList([]);
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
  };

  const filtered = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Device Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define schemas, parameter units, and controls for your IoT hardware fleet.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Sensor', 'Control', 'CCTV', 'Navigation'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 font-semibold'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 shadow-xs'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(template => {
          const badge = TYPE_BADGES[template.category] || TYPE_BADGES['Sensor'];
          const BadgeIcon = badge.icon;
          return (
            <div key={template.id} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/30 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm dark:shadow-lg">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{template.name}</h3>
                    <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${badge.className}`}>
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{template.description}</p>

                {/* Parameters list */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Defined Metrics</div>
                  {(template.parameters || []).slice(0, 4).map((attr: any) => (
                    <div key={attr.key || attr.name} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">{attr.name || attr.key}</span>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        <span>{attr.type}</span>
                        {attr.unit && <span className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-cyan-700 dark:text-cyan-400">{attr.unit}</span>}
                      </div>
                    </div>
                  ))}
                  {(template.parameters || []).length > 4 && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-1">+ {template.parameters.length - 4} more parameters</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500">
                <span>{template.devicesCount || 0} Connected Devices</span>
                <span>{template.created_at}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Create Device Template</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hydraulic Pressure Sensor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Sensor">Sensor</option>
                    <option value="Control">Control</option>
                    <option value="CCTV">CCTV</option>
                    <option value="Navigation">Navigation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Parameter Builder */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Add Metric / Parameter</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Parameter name (e.g. pressure)"
                    value={paramKey}
                    onChange={e => setParamKey(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. bar, °C)"
                    value={paramUnit}
                    onChange={e => setParamUnit(e.target.value)}
                    className="w-24 h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddParam}
                    className="px-3 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {paramList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {paramList.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800 text-xs text-cyan-300">
                        <span>{p.name} ({p.unit})</span>
                        <button
                          type="button"
                          onClick={() => setParamList(paramList.filter((_, i) => i !== idx))}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
