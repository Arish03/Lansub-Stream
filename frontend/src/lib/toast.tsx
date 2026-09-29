'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-cyan-400 shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-slate-900 border-emerald-500/40 shadow-emerald-500/10',
  error:   'bg-slate-900 border-rose-500/40 shadow-rose-500/10',
  info:    'bg-slate-900 border-cyan-500/40 shadow-cyan-500/10',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm text-white
        backdrop-blur-sm min-w-[260px] max-w-[380px] animate-in slide-in-from-bottom-4 fade-in duration-300
        ${STYLES[toast.type]}`}
    >
      {ICONS[toast.type]}
      <span className="flex-1 text-slate-100 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-white transition-colors ml-1 cursor-pointer"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // keep max 5
    const timer = setTimeout(() => dismiss(id), 4000);
    timersRef.current.set(id, timer);
  }, [dismiss]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error   = useCallback((msg: string) => toast(msg, 'error'),   [toast]);
  const info    = useCallback((msg: string) => toast(msg, 'info'),     [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {/* Toast container — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
