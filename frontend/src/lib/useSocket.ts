'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE } from './api';

export interface TelemetryBroadcast {
  device_key: string;
  data: {
    id: string;
    device_id: string;
    device_key: string;
    device_name: string;
    ts: string;
    payload: Record<string, any>;
  };
}

/** Maximum backoff cap: 30 seconds */
const MAX_RETRY_DELAY = 30_000;

export function useTelemetrySocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastReading, setLastReading] = useState<TelemetryBroadcast | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [feed, setFeed] = useState<TelemetryBroadcast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef<number>(1000); // start at 1s
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!isMountedRef.current) return;

    // Clean up any previous socket
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        retryDelayRef.current = 1000; // reset backoff on successful connect
        console.log('[WebSocket] Connected to Lansub telemetry stream.');
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (data && data.device_key && data.data) {
            setLastReading(data);
            setFeed((prev) => [data, ...prev.slice(0, 29)]); // keep last 30
          }
        } catch {
          // ignore non-json frames
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff: double delay up to MAX_RETRY_DELAY, add ±10% jitter
        const base = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY);
        const jitter = base * 0.1 * (Math.random() * 2 - 1);
        retryDelayRef.current = Math.round(base + jitter);

        console.log(`[WebSocket] Disconnected. Reconnecting in ${(retryDelayRef.current / 1000).toFixed(1)}s…`);

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, retryDelayRef.current);
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; let onclose handle reconnect
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        } catch {}
      };
    } catch (e) {
      console.warn('[WebSocket] Unable to create connection:', e);
      // Still schedule a retry even if construction throws
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, retryDelayRef.current);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Heartbeat ping every 15s to keep connection alive through proxies
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15_000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }
    };
  }, [connect]);

  return { isConnected, lastReading, lastMessage, feed };
}
