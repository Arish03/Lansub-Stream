'use client';

import { useState } from 'react';
import { 
  Zap, Brain, AlertTriangle, CheckCircle2, RefreshCw, 
  TrendingDown, Gauge, Cpu, Activity, ShieldAlert, Sliders
} from 'lucide-react';

export default function AIModelsPage() {
  const [retraining, setRetraining] = useState(false);

  const handleRetrain = () => {
    setRetraining(true);
    setTimeout(() => setRetraining(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" /> Industrial AI Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI & Predictive Maintenance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Early failure detection, Remaining Useful Life (RUL) inference, vibration FFT analysis, and thermal runaway prevention.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
          {retraining ? 'Training on Telemetry...' : 'Trigger Model Retrain'}
        </button>
      </div>

      {/* Model Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Model Inference Accuracy</span>
          <p className="text-3xl font-bold text-white mt-1">98.4% <span className="text-xs text-emerald-400 font-medium font-mono">F1-Score</span></p>
          <p className="text-xs text-slate-500 mt-1">Evaluated on 48,000 historical telemetry frames</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">Mean Prediction Horizon</span>
          <p className="text-3xl font-bold text-cyan-400 mt-1">72 <span className="text-xs text-slate-400 font-normal">hours ahead</span></p>
          <p className="text-xs text-slate-500 mt-1">Average advance notice before mechanical threshold breach</p>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
          <span className="text-xs text-slate-400 font-medium">False Positive Ratio</span>
          <p className="text-3xl font-bold text-emerald-400 mt-1">0.12%</p>
          <p className="text-xs text-slate-500 mt-1">Debounced across rolling 10-reading windows</p>
        </div>
      </div>

      {/* Active Predictive Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model 1: Bearing Remaining Useful Life */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-white">Spindle Bearing Degradation (CNC-01)</h3>
                <p className="text-xs text-slate-500">Autoencoder + LSTM Degradation Model</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Low Risk (92% Health)
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Estimated Remaining Useful Life (RUL):</span>
              <strong className="text-white font-mono">418 Operating Hours</strong>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Vibration Spectral Anomaly Score:</span>
              <span className="text-cyan-400 font-mono font-bold">0.038 / 1.000</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full" style={{ width: '92%' }} />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">AI Recommendation:</p>
            <p>Bearing harmonics are within ISO 10816 vibration guidelines. Schedule standard lubrication at 350 hours.</p>
          </div>
        </div>

        {/* Model 2: Thermal Runaway Predictor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">Thermal Gradient Runaway Detector</h3>
                <p className="text-xs text-slate-500">Multivariate Polynomial Regression</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Stable Thermal State
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">dT/dt Temperature Gradient:</span>
              <strong className="text-white font-mono">+0.04 °C / min</strong>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Predicted Max Peak in 60m:</span>
              <span className="text-purple-400 font-mono font-bold">48.2 °C (Safe &lt; 85°C)</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2 rounded-full" style={{ width: '38%' }} />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">AI Recommendation:</p>
            <p>Heat dissipation optimal. Heat sink airflow delta normal at 2.4 m/s.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
