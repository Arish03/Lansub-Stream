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

export function useTelemetrySocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastReading, setLastReading] = useState<TelemetryBroadcast | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [feed, setFeed] = useState<TelemetryBroadcast[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to Lansub telemetry stream.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (data && data.device_key && data.data) {
            setLastReading(data);
            setFeed((prev) => [data, ...prev.slice(0, 29)]); // keep last 30 readings
          }
        } catch (e) {
          // ignore non-json
        }
      };

      let retryDelay = 5000;

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, retryDelay);
      };

      ws.onerror = () => {
        // WebSocket error event has minimal detail in browsers; avoid noisy warnings
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          }
        } catch {}
      };
    } catch (e) {
      console.warn('[WebSocket] Unable to create connection:', e);
    }
  }, []);

  useEffect(() => {
    connect();

    // Heartbeat ping every 15s
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastReading, lastMessage, feed };
}
