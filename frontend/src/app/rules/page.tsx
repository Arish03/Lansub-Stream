'use client';

import { useState, useEffect } from 'react';
import { 
  Workflow, Plus, Play, Pause, AlertTriangle, Bell, Mail, MessageSquare, 
  Terminal, Globe, Clock, CheckCircle2, MoreHorizontal, ArrowRight, 
  Trash2, Copy, Filter, Search, X, Layers, Cpu, ShieldAlert, Sparkles
} from 'lucide-react';
import { fetchRules, createRule, toggleRule as apiToggleRule, RuleData } from '@/lib/api';

interface Rule {
  id: string;
  name: string;
  description: string;
  scope: string;
  target: string;
  condition: {
    parameter: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: string;
    unit: string;
  };
  timer?: {
    type: 'debounce' | 'delay' | 'interval';
    duration: string;
  };
  actions: {
    type: 'alarm' | 'email' | 'whatsapp' | 'command' | 'webhook';
    label: string;
    detail: string;
  }[];
  enabled: boolean;
  triggersToday: number;
  lastTriggered: string;
}

const INITIAL_RULES: Rule[] = [
  {
    id: 'RUL-101',
    name: 'Spindle Bearing Overheat Alarm',
    description: 'Triggers critical safety shutdown if bearing temperature remains dangerously high.',
    scope: 'Device',
    target: 'Bearing Temp Sensor A1',
    condition: {
      parameter: 'temperature',
      operator: '>',
      value: '85.0',
      unit: '°C'
    },
    timer: {
      type: 'debounce',
      duration: '30s'
    },
    actions: [
      { type: 'alarm', label: 'Create Alarm', detail: 'CRITICAL: Bearing Overheat' },
      { type: 'email', label: 'Email Plant Team', detail: 'ops@lansub.io' },
      { type: 'command', label: 'Safety Interlock', detail: 'M1_SPEED -> 0' }
    ],
    enabled: true,
    triggersToday: 2,
    lastTriggered: '14 min ago',
  },
  {
    id: 'RUL-102',
    name: 'Compressor High Vibration Alert',
    description: 'Detects mechanical resistance or abnormal oscillation in main compressor.',
    scope: 'Asset',
    target: 'Main Air Compressor',
    condition: {
      parameter: 'rms',
      operator: '>=',
      value: '0.08',
      unit: 'mm/s'
    },
    timer: {
      type: 'debounce',
      duration: '2m'
    },
    actions: [
      { type: 'alarm', label: 'Create Alarm', detail: 'WARNING: Compressor Vibration Spike' },
      { type: 'whatsapp', label: 'WhatsApp Lead', detail: '+91 98450 11223' }
    ],
    enabled: true,
    triggersToday: 5,
    lastTriggered: '1 hr ago',
  },
  {
    id: 'RUL-103',
    name: 'PPE Missing Safety Alert',
    description: 'Flags workers entering assembly zone without protective hardhats.',
    scope: 'Device',
    target: 'Assembly Safety Cam 02',
    condition: {
      parameter: 'helmet_missing',
      operator: '>',
      value: '0',
      unit: 'workers'
    },
    actions: [
      { type: 'alarm', label: 'Create Alarm', detail: 'MAJOR: PPE Compliance Violation' },
      { type: 'webhook', label: 'Dispatch Webhook', detail: 'https://security.lansub.io/v1/alert' }
    ],
    enabled: true,
    triggersToday: 1,
    lastTriggered: '3 hrs ago',
  },
  {
    id: 'RUL-104',
    name: 'Power Peak Load Shaving',
    description: 'Notifies energy team when substation power spikes above contractual peak load.',
    scope: 'Asset',
    target: 'HVAC Plant 01',
    condition: {
      parameter: 'power_kw',
      operator: '>',
      value: '22.0',
      unit: 'kW'
    },
    timer: {
      type: 'debounce',
      duration: '5m'
    },
    actions: [
      { type: 'alarm', label: 'Create Alarm', detail: 'INFO: Peak Energy Threshold Exceeded' },
      { type: 'email', label: 'Email Energy Manager', detail: 'energy@lansub.io' }
    ],
    enabled: false,
    triggersToday: 0,
    lastTriggered: 'Yesterday',
  },
];

function mapRuleData(r: RuleData): Rule {
  return {
    id: r.id,
    name: r.name,
    description: r.description || `Rule on ${r.target_id || 'system'}`,
    scope: r.scope || 'Device',
    target: r.target_id || 'All Devices',
    condition: {
      parameter: r.parameter,
      operator: (r.operator as any) || '>',
      value: r.threshold,
      unit: r.unit || '',
    },
    timer: r.debounce_seconds ? { type: 'debounce', duration: r.debounce_seconds } : undefined,
    actions: (r.actions && r.actions.length > 0)
      ? r.actions.map(a => ({
          type: (a.type as any) || 'alarm',
          label: a.label || 'Alarm',
          detail: a.detail || 'Triggered alert',
        }))
      : [{ type: 'alarm', label: 'Create Alarm', detail: 'CRITICAL: Threshold Breach' }],
    enabled: r.enabled,
    triggersToday: r.triggers_count || 0,
    lastTriggered: r.last_triggered_at ? new Date(r.last_triggered_at).toLocaleTimeString() : 'Never',
  };
}

export default function RuleEnginePage() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [targetScope, setTargetScope] = useState('CNC Milling Cell 01');
  const [parameter, setParameter] = useState('temperature');
  const [operator, setOperator] = useState<Rule['condition']['operator']>('>');
  const [thresholdVal, setThresholdVal] = useState('80');
  const [debounceSec, setDebounceSec] = useState('30s');
  const [actionAlarmSeverity, setActionAlarmSeverity] = useState('CRITICAL');
  const [recipientEmail, setRecipientEmail] = useState('alerts@lansub.io');

  const loadRules = async () => {
    const data = await fetchRules();
    if (data && data.length > 0) {
      setRules(data.map(mapRuleData));
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const filteredRules = rules.filter(r => {
    const matchesQuery = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.condition.parameter.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? r.enabled : !r.enabled;
    return matchesQuery && matchesStatus;
  });

  const activeRulesCount = rules.filter(r => r.enabled).length;
  const totalTriggers = rules.reduce((acc, r) => acc + r.triggersToday, 0);

  const toggleRule = async (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    await apiToggleRule(id);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const unit = parameter === 'temperature' ? '°C' : parameter === 'vibration' ? 'mm/s' : '';
    const created = await createRule({
      name: ruleName,
      description: `Automated condition trigger on ${targetScope} (${parameter} ${operator} ${thresholdVal}).`,
      scope: 'Device',
      target_id: targetScope,
      parameter,
      operator,
      threshold: thresholdVal,
      unit,
      debounce_seconds: debounceSec,
      actions: [
        { type: 'alarm', label: 'Trigger Alarm', detail: `${actionAlarmSeverity}: ${ruleName}` },
        { type: 'email', label: 'Notification', detail: recipientEmail }
      ],
      enabled: true,
    });

    if (created) {
      setRules([mapRuleData(created), ...rules]);
    } else {
      const newRule: Rule = {
        id: `RUL-${100 + rules.length + 1}`,
        name: ruleName,
        description: `Automated condition trigger on ${targetScope} (${parameter} ${operator} ${thresholdVal}).`,
        scope: 'Asset',
        target: targetScope,
        condition: {
          parameter,
          operator,
          value: thresholdVal,
          unit,
        },
        timer: debounceSec ? { type: 'debounce', duration: debounceSec } : undefined,
        actions: [
          { type: 'alarm', label: 'Trigger Alarm', detail: `${actionAlarmSeverity}: ${ruleName}` },
          { type: 'email', label: 'Notification', detail: recipientEmail }
        ],
        enabled: true,
        triggersToday: 0,
        lastTriggered: 'Just created'
      };
      setRules([newRule, ...rules]);
    }

    setIsCreateModalOpen(false);
    setRuleName('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
            <Workflow className="w-3.5 h-3.5" /> Automation & Event Dispatch
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Rule Engine</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Construct event-driven automation rules linking telemetry conditions, debounce timers, and multi-channel actions.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Automation Rule
        </button>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Configured Rules</span>
            <Workflow className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{rules.length}</p>
          <p className="text-xs text-slate-500 mt-1">Operational automation chains</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Evaluators</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeRulesCount}</p>
          <p className="text-xs text-slate-500 mt-1">Evaluating telemetry in real time</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Triggers (Today)</span>
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalTriggers}</p>
          <p className="text-xs text-slate-500 mt-1">Conditions met & actions executed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Debounce Filtering</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">99.4%</p>
          <p className="text-xs text-slate-500 mt-1">False positives prevented</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rules, targets, or parameters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 text-xs">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-white dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {status} Rules
            </button>
          ))}
        </div>
      </div>

      {/* Visual Flow Rule Cards */}
      <div className="space-y-4">
        {filteredRules.map((rule) => {
          return (
            <div 
              key={rule.id} 
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 transition-all shadow-sm dark:shadow-lg ${
                rule.enabled ? 'border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/30' : 'border-slate-200 dark:border-slate-800/40 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      rule.enabled 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={rule.enabled ? 'Active (click to pause)' : 'Paused (click to activate)'}
                  >
                    {rule.enabled ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{rule.name}</h3>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                        {rule.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    Last run: <strong className="text-slate-700 dark:text-slate-300 font-medium">{rule.lastTriggered}</strong>
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 font-mono">
                    {rule.triggersToday} fires today
                  </span>
                </div>
              </div>

              {/* Visual Flow Nodes: START -> CONDITION -> TIMER -> ACTION */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                {/* Node 1: START */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    <span>1. Start (Scope)</span>
                    <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{rule.target}</p>
                  <p className="text-[11px] text-slate-500">Target: {rule.scope}</p>
                </div>

                {/* Node 2: CONDITION */}
                <div className="bg-cyan-50/60 dark:bg-slate-950 border border-cyan-200 dark:border-cyan-500/30 rounded-xl p-3.5 space-y-1 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    <span>2. Condition</span>
                    <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                    {rule.condition.parameter} {rule.condition.operator} {rule.condition.value} {rule.condition.unit}
                  </p>
                  <p className="text-[11px] text-slate-500">Real-time threshold</p>
                </div>

                {/* Node 3: TIMER */}
                <div className="bg-amber-50/60 dark:bg-slate-950 border border-amber-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <span>3. Timer</span>
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {rule.timer ? `Debounce: ${rule.timer.duration}` : 'Immediate (0s delay)'}
                  </p>
                  <p className="text-[11px] text-slate-500">Transient dampening</p>
                </div>

                {/* Node 4: ACTIONS */}
                <div className="bg-purple-50/60 dark:bg-slate-950 border border-purple-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    <span>4. Action Dispatch</span>
                    <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rule.actions.map((act, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20"
                      >
                        {act.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRules.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center text-slate-500 space-y-2">
            <Workflow className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No automation rules found matching your filter.</p>
          </div>
        )}
      </div>

      {/* Interactive Create Rule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-cyan-400" /> Build Automation Flow
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Define event trigger logic from telemetry stream to automated dispatch
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-5">
              {/* Step 1: Rule Details */}
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                  1. Rule Identification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Rule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. High Pressure Surge Protection"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Asset / Scope</label>
                    <select
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="CNC Milling Cell 01">CNC Milling Cell 01</option>
                      <option value="Main Air Compressor">Main Air Compressor</option>
                      <option value="Assembly Line A">Assembly Line A</option>
                      <option value="HVAC Plant 01">HVAC Plant 01</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Condition */}
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                  2. Condition Evaluation
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Parameter</label>
                    <select
                      value={parameter}
                      onChange={(e) => setParameter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="temperature">temperature (°C)</option>
                      <option value="vibration">vibration (mm/s)</option>
                      <option value="power_kw">power (kW)</option>
                      <option value="speed">speed (RPM)</option>
                      <option value="helmet_missing">helmet_missing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Operator</label>
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value as Rule['condition']['operator'])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value=">">&gt; Greater Than</option>
                      <option value="<">&lt; Less Than</option>
                      <option value=">=">&gt;= Greater or Equal</option>
                      <option value="<=">&lt;= Less or Equal</option>
                      <option value="==">== Equals</option>
                      <option value="!=">!= Not Equal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Threshold Value</label>
                    <input
                      type="text"
                      required
                      value={thresholdVal}
                      onChange={(e) => setThresholdVal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Timer / Debounce */}
              <div>
                <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  3. Timer & Debounce Constraint
                </label>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Must persist for (debounce duration)</label>
                  <select
                    value={debounceSec}
                    onChange={(e) => setDebounceSec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="0s">No delay (Immediate trigger)</option>
                    <option value="15s">15 seconds</option>
                    <option value="30s">30 seconds (Recommended)</option>
                    <option value="1m">1 minute</option>
                    <option value="5m">5 minutes</option>
                  </select>
                </div>
              </div>

              {/* Step 4: Actions */}
              <div>
                <label className="block text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                  4. Automated Actions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Alarm Severity</label>
                    <select
                      value={actionAlarmSeverity}
                      onChange={(e) => setActionAlarmSeverity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="CRITICAL">Critical (Red Alarm)</option>
                      <option value="WARNING">Major / Warning</option>
                      <option value="INFO">Informational Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notification Email</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Deploy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
