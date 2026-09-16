'use client';

import { useState } from 'react';
import { 
  Video, Shield, AlertTriangle, CheckCircle2, Play, 
  Maximize2, Eye, Radio, RefreshCw, SlidersHorizontal, Camera
} from 'lucide-react';

interface CameraStream {
  id: string;
  name: string;
  zone: string;
  fps: number;
  status: 'streaming' | 'buffering' | 'offline';
  detections: { label: string; count: number; color: string }[];
  resolution: string;
}

const CAMERAS: CameraStream[] = [
  {
    id: 'CAM-01',
    name: 'Assembly Cell 01 — Overhead',
    zone: 'Assembly Line A',
    fps: 30,
    status: 'streaming',
    detections: [
      { label: 'Personnel', count: 4, color: 'text-cyan-400' },
      { label: 'Helmet Compliant', count: 4, color: 'text-emerald-400' }
    ],
    resolution: '1920x1080 @ 30fps'
  },
  {
    id: 'CAM-02',
    name: 'Spindle Machining Bay Cam',
    zone: 'CNC Sector 02',
    fps: 28,
    status: 'streaming',
    detections: [
      { label: 'Machinist', count: 1, color: 'text-cyan-400' },
      { label: 'Safety Enclosure', count: 1, color: 'text-emerald-400' }
    ],
    resolution: '1920x1080 @ 30fps'
  },
  {
    id: 'CAM-03',
    name: 'AGV & Forklift Transit Corridor',
    zone: 'Intralogistics Gate 4',
    fps: 25,
    status: 'streaming',
    detections: [
      { label: 'AGV Unit', count: 2, color: 'text-indigo-400' },
      { label: 'Pedestrian Crossing', count: 0, color: 'text-slate-400' }
    ],
    resolution: '1280x720 @ 25fps'
  },
  {
    id: 'CAM-04',
    name: 'Perimeter Loading Bay West',
    zone: 'Logistics Dock 03',
    fps: 30,
    status: 'streaming',
    detections: [
      { label: 'Truck Bay', count: 1, color: 'text-amber-400' },
      { label: 'Dock Lock Active', count: 1, color: 'text-emerald-400' }
    ],
    resolution: '1920x1080 @ 30fps'
  }
];

export default function CCTVPage() {
  const [cameras, setCameras] = useState<CameraStream[]>(CAMERAS);
  const [selectedCam, setSelectedCam] = useState<CameraStream>(CAMERAS[0]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <Video className="w-3.5 h-3.5 animate-pulse" /> Computer Vision & Surveillance
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">CCTV & Safety Streams</h1>
          <p className="text-sm text-slate-400 mt-1">
            High-definition edge camera streams, real-time safety bounding boxes, and worker PPE compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            4 Streams Live (RTSP / WebRTC)
          </span>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cameras.map(cam => (
          <div
            key={cam.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition-all"
          >
            {/* Stream View Simulation Canvas */}
            <div className="relative aspect-video bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
              {/* Scanline Background Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Simulated Bounding Box Overlay */}
              <div className="absolute top-1/3 left-1/4 w-32 h-36 border-2 border-emerald-400/80 rounded bg-emerald-500/10 flex flex-col justify-between p-1.5 text-[10px] font-mono text-emerald-300">
                <span className="bg-emerald-950/80 px-1 py-0.5 rounded w-max">PERSON 98%</span>
                <span className="bg-emerald-950/80 px-1 py-0.5 rounded w-max self-end">HELMET: YES</span>
              </div>

              {/* Stream Overlay Header */}
              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-mono font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  LIVE • {cam.id}
                </span>
                <span className="font-mono text-[11px] text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {cam.resolution}
                </span>
              </div>

              {/* Stream Overlay Footer */}
              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="text-white font-medium text-shadow bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                  {cam.name}
                </span>
                <span className="text-emerald-400 font-mono text-[11px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                  {cam.fps} FPS
                </span>
              </div>
            </div>

            {/* Camera Metadata Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Zone: <strong className="text-slate-200">{cam.zone}</strong></span>
                <div className="flex items-center gap-2">
                  {cam.detections.map((det, i) => (
                    <span key={i} className={`font-semibold ${det.color}`}>
                      {det.count} {det.label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedCam(cam)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-medium transition-colors cursor-pointer"
              >
                Inspect Stream &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
