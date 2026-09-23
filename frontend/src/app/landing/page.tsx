'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';
import {
  Activity, Radio, Workflow, BarChart3, HardDrive, Zap,
  ArrowRight, ChevronRight, Layers, Shield, Clock, Gauge,
  Sun, Moon, Globe, Server, Cpu, Database, Wifi,
  CheckCircle2, Play, Sparkles, Eye
} from 'lucide-react';

/* ─── Feature cards data ─── */
const FEATURES = [
  {
    icon: Radio,
    title: 'Real-Time Telemetry',
    description: 'Ingest millions of data points per second via MQTT, HTTP, and WebSocket with sub-50ms latency.',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'cyan',
  },
  {
    icon: Cpu,
    title: 'Digital Twins',
    description: 'Mirror physical assets in software. Simulate, predict, and optimize before deploying changes.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'violet',
  },
  {
    icon: Workflow,
    title: 'Rule Engine',
    description: 'Visual threshold rules with debounce timers, cascading actions, and real-time alarm generation.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Analytics & KPIs',
    description: 'Time-series aggregation, OEE calculations, MTBF tracking, and predictive maintenance insights.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'emerald',
  },
  {
    icon: HardDrive,
    title: 'Edge Computing',
    description: 'Deploy containerized inference models directly on edge gateways for offline-capable operations.',
    gradient: 'from-rose-500 to-pink-600',
    glow: 'rose',
  },
  {
    icon: Eye,
    title: 'AI & Vision',
    description: 'Computer vision pipelines for quality inspection, safety monitoring, and anomaly detection.',
    gradient: 'from-indigo-500 to-blue-700',
    glow: 'indigo',
  },
];

/* ─── Stats data ─── */
const STATS = [
  { label: 'Sensors Supported', value: '10K+', icon: Radio },
  { label: 'Platform Uptime', value: '99.9%', icon: Shield },
  { label: 'Avg Latency', value: '<50ms', icon: Clock },
  { label: 'OEE Tracking', value: 'Real-Time', icon: Gauge },
];

/* ─── Architecture layers ─── */
const ARCH_LAYERS = [
  { label: 'Edge Devices', desc: 'MQTT / Modbus / OPC-UA', icon: Wifi, color: 'cyan' },
  { label: 'Data Ingestion', desc: 'Stream Processing & Validation', icon: Server, color: 'blue' },
  { label: 'Core Platform', desc: 'Rules, Twins, Analytics', icon: Layers, color: 'violet' },
  { label: 'Storage', desc: 'PostgreSQL / Redis / TimescaleDB', icon: Database, color: 'emerald' },
  { label: 'AI / ML', desc: 'Inference, Vision, Predictions', icon: Sparkles, color: 'amber' },
  { label: 'Dashboard', desc: 'Real-Time UI & Alerts', icon: Globe, color: 'rose' },
];

/* ─── Animated counter hook ─── */
function useAnimatedCount(target: string, durationMs = 1800) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          // Extract numeric portion
          const numericMatch = target.match(/[\d.]+/);
          if (!numericMatch) {
            setDisplay(target);
            return;
          }
          const numEnd = parseFloat(numericMatch[0]);
          const prefix = target.slice(0, target.indexOf(numericMatch[0]));
          const suffix = target.slice(target.indexOf(numericMatch[0]) + numericMatch[0].length);
          const isFloat = numericMatch[0].includes('.');
          const steps = 40;
          let step = 0;

          const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = numEnd * eased;
            setDisplay(`${prefix}${isFloat ? current.toFixed(1) : Math.round(current)}${suffix}`);
            if (step >= steps) clearInterval(interval);
          }, durationMs / steps);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return { ref, display };
}

function StatCard({ stat }: { stat: typeof STATS[0] }) {
  const { ref, display } = useAnimatedCount(stat.value);
  const Icon = stat.icon;
  return (
    <div ref={ref} className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-slate-800/60 hover:border-cyan-500/40 transition-all group">
      <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
      <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{display}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">

      {/* ─── Floating Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-2xl px-5 py-2.5 shadow-lg shadow-slate-200/40 dark:shadow-black/40">
          {/* Brand */}
          <Link href="/landing" className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">
              LANSUB <span className="text-cyan-600 dark:text-cyan-400">STREAM</span>
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}
            <Link
              href="/login"
              className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 overflow-hidden">
        {/* Background Glow Orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-cyan-500/15 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[250px] h-[250px] bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold mb-6 landing-fade-in">
            <Activity className="w-3.5 h-3.5" />
            Zero-Code Industrial IoT Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white mb-5 landing-fade-in landing-delay-1">
            Connect. Monitor.{' '}
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              Automate.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed landing-fade-in landing-delay-2">
            Stream telemetry from thousands of industrial sensors, build digital twins, 
            define threshold rules, and get real-time alarms — all from a single, 
            beautifully designed platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 landing-fade-in landing-delay-3">
            <Link
              href="/login"
              className="h-12 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4" /> Start Free
            </Link>
            <Link
              href="/login"
              className="h-12 px-8 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2.5 shadow-lg shadow-slate-200/30 dark:shadow-black/30 transition-all hover:-translate-y-0.5"
            >
              View Live Demo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-500 landing-fade-in landing-delay-4">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Open-source core</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Self-hosted</span>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Platform Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Everything you need for Industrial IoT
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              A unified platform replacing fragmented SCADA, historian, and monitoring tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group relative p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-800/60 hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Architecture Section ─── */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-4">
              <Server className="w-3.5 h-3.5" /> Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Built for scale, from edge to cloud
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              A modern, event-driven architecture designed for high-throughput industrial workloads.
            </p>
          </div>

          {/* Architecture Flow */}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
              {ARCH_LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                const colorMap: Record<string, string> = {
                  cyan: 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10',
                  blue: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
                  violet: 'border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10',
                  emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
                  amber: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
                  rose: 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10',
                };
                const iconColorMap: Record<string, string> = {
                  cyan: 'text-cyan-600 dark:text-cyan-400',
                  blue: 'text-blue-600 dark:text-blue-400',
                  violet: 'text-violet-600 dark:text-violet-400',
                  emerald: 'text-emerald-600 dark:text-emerald-400',
                  amber: 'text-amber-600 dark:text-amber-400',
                  rose: 'text-rose-600 dark:text-rose-400',
                };

                return (
                  <div
                    key={layer.label}
                    className={`p-4 rounded-2xl border backdrop-blur transition-all duration-300 hover:-translate-y-0.5 ${colorMap[layer.color]}`}
                  >
                    <Icon className={`w-5 h-5 ${iconColorMap[layer.color]} mb-2`} />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{layer.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{layer.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800/60 overflow-hidden">
            {/* Background orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Ready to transform your factory floor?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Start streaming telemetry in under 5 minutes. No vendor lock-in, no hidden fees.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="h-12 px-10 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5"
                >
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="h-12 px-8 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2.5 shadow-md transition-all hover:-translate-y-0.5"
                >
                  Try Demo <Play className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              LANSUB STREAM <span className="text-slate-400 dark:text-slate-600 font-normal">• Industrial IoT Platform</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-500">
            <span>© 2026 Lansub Technologies</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Built with Next.js, FastAPI & PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
