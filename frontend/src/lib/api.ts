export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/v1';
// Ordered candidate bases: configured URL first, then local-dev fallbacks (deduped).
const CANDIDATE_BASES: string[] = [
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/v1',
  'http://localhost:8501/v1',
  'http://127.0.0.1:8501/v1',
  'http://localhost:8000/v1',
  'http://127.0.0.1:8000/v1',
].filter((v, i, a) => a.indexOf(v) === i);

/**
 * Resilient fetch: tries each candidate base URL in order.
 * Hard network errors ("Failed to fetch") advance to the next candidate.
 * HTTP 4xx/5xx from the first reachable server are returned as-is.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (const base of CANDIDATE_BASES) {
    try {
      return await fetch(`${base}${path}`, init);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
export const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws';

export interface DeviceData {
  id: string;
  name: string;
  template: string;
  device_key: string;
  mqtt_username?: string;
  mqtt_password?: string;
  created_at?: string;
  last_seen_at?: string;
  telemetry?: Record<string, any> | null;
  status?: 'online' | 'warning' | 'offline';
}

export interface TelemetryRecord {
  id: string;
  device_id: string;
  ts: string;
  payload: Record<string, any>;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'offline';
  services: {
    postgres: string;
    redis: string;
  };
}

export async function getAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('lansub_token');
    if (stored) return stored;
  }
  return '';
}

export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const res = await apiFetch(`/health`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
    return { status: 'degraded', services: { postgres: 'unreachable', redis: 'unreachable' } };
  } catch (err) {
    return { status: 'offline', services: { postgres: 'offline', redis: 'offline' } };
  }
}

export async function fetchDevices(): Promise<DeviceData[]> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/devices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const devices: DeviceData[] = await res.json();
      return devices.map((d) => ({
        ...d,
        status: d.last_seen_at ? 'online' : 'offline',
      }));
    }
  } catch (err) {
    console.warn('Error fetching devices from backend:', err);
  }
  return [];
}

export async function registerDevice(name: string, template: string = 'generic-sensor'): Promise<DeviceData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, template }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to register device:', err);
  }
  return null;
}

export async function removeDevice(deviceId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete device:', err);
    return false;
  }
}

export async function fetchHistoricalTelemetry(deviceId: string, limit: number = 50): Promise<TelemetryRecord[]> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/devices/${deviceId}/telemetry?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error fetching telemetry history:', err);
  }
  return [];
}

export async function sendCommand(deviceId: string, action: string, target?: string, value?: any): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/devices/${deviceId}/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, target, value }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to dispatch device command:', err);
    return false;
  }
}

export async function sendTelemetryPayload(deviceKey: string, payload: Record<string, any>): Promise<boolean> {
  try {
    const res = await apiFetch(`/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_key: deviceKey, payload }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to send telemetry reading:', err);
    return false;
  }
}

// Rule & Alarm Types & API Functions
export interface RuleData {
  id: string;
  name: string;
  description?: string;
  scope: string;
  target_id?: string;
  parameter: string;
  operator: string;
  threshold: string;
  unit?: string;
  debounce_seconds?: string;
  actions: Array<{ type: string; label?: string; detail?: string }>;
  enabled: boolean;
  triggers_count: number;
  last_triggered_at?: string;
  created_at?: string;
}

export interface AlarmData {
  id: string;
  user_id?: string;
  device_id?: string;
  rule_id?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_at?: string;
  resolved_at?: string;
  telemetry_snapshot?: Record<string, any>;
  created_at?: string;
}

export async function fetchRules(): Promise<RuleData[]> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/rules`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching rules:', err);
  }
  return [];
}

export async function createRule(rule: Partial<RuleData>): Promise<RuleData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rule),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error creating rule:', err);
  }
  return null;
}

export async function toggleRule(ruleId: string): Promise<RuleData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/rules/${ruleId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error toggling rule:', err);
  }
  return null;
}

export async function deleteRule(ruleId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/rules/${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting rule:', err);
    return false;
  }
}

export async function fetchAlarms(status?: string): Promise<AlarmData[]> {
  try {
    const token = await getAuthToken();
    const path = status ? `/alarms?status=${encodeURIComponent(status)}` : '/alarms';
    const res = await apiFetch(path, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching alarms:', err);
  }
  return [];
}

export async function acknowledgeAlarm(alarmId: string): Promise<AlarmData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/alarms/${alarmId}/acknowledge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error acknowledging alarm:', err);
  }
  return null;
}

export async function resolveAlarm(alarmId: string): Promise<AlarmData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/alarms/${alarmId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error resolving alarm:', err);
  }
  return null;
}

// Device Template Types & APIs
export interface TemplateData {
  id: string;
  name: string;
  category: string;
  description?: string;
  parameters: Array<{
    key: string;
    name: string;
    type: string;
    unit?: string;
    min?: number;
    max?: number;
    icon?: string;
  }>;
  created_at?: string;
}

export async function fetchTemplates(): Promise<TemplateData[]> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/templates`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching templates:', err);
  }
  return [];
}

export async function createTemplate(template: Partial<TemplateData>): Promise<TemplateData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(template),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error creating template:', err);
  }
  return null;
}

export async function deleteTemplate(templateId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/templates/${templateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting template:', err);
    return false;
  }
}

// Hierarchical Asset Types & APIs
export interface AssetData {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
  criticality: string;
  health_score: number;
  metadata_json?: Record<string, any>;
  created_at?: string;
}

export async function fetchAssets(parentId?: string): Promise<AssetData[]> {
  try {
    const token = await getAuthToken();
    const path = parentId ? `/assets?parent_id=${encodeURIComponent(parentId)}` : '/assets';
    const res = await apiFetch(path, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching assets:', err);
  }
  return [];
}

export async function createAsset(asset: Partial<AssetData>): Promise<AssetData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(asset),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error creating asset:', err);
  }
  return null;
}

export async function deleteAsset(assetId: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/assets/${assetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting asset:', err);
    return false;
  }
}

// Telemetry Aggregation & KPIs Types & APIs
export interface AggregateResponse {
  metric: string;
  device_key: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  series: Array<{ ts: string; time: string; value: number }>;
}

export interface FleetKPIs {
  total_devices: number;
  online_devices: number;
  total_telemetry: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  mtbf_hours: number;
  rul_days: number;
}

export async function fetchAggregatedTelemetry(
  deviceKey?: string,
  metric: string = 'temperature',
  limit: number = 50
): Promise<AggregateResponse | null> {
  try {
    const token = await getAuthToken();
    const query = new URLSearchParams({ metric, limit: limit.toString() });
    if (deviceKey && deviceKey !== 'all') query.append('device_key', deviceKey);
    const res = await apiFetch(`/telemetry/aggregate?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching aggregated telemetry:', err);
  }
  return null;
}

export async function fetchFleetKPIs(): Promise<FleetKPIs | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/telemetry/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching fleet KPIs:', err);
  }
  return null;
}

// Dashboard Builder Types & APIs
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'gauge' | 'sparkline' | 'stat' | 'switch' | 'status' | 'terminal' | 'multibar';
  deviceKey: string;
  metric: string;
  unit?: string;
  min?: number;
  max?: number;
  warnThreshold?: number;
  critThreshold?: number;
  colSpan?: 1 | 2 | 3;
}

export interface DashboardData {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  layout: DashboardWidget[];
  created_at?: string;
  updated_at?: string;
}

export async function fetchDashboards(): Promise<DashboardData[]> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/dashboards`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching dashboards:', err);
  }
  return [];
}

export async function createDashboard(data: Partial<DashboardData>): Promise<DashboardData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/dashboards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error creating dashboard:', err);
  }
  return null;
}

export async function updateDashboard(id: string, data: Partial<DashboardData>): Promise<DashboardData | null> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/dashboards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('Error updating dashboard:', err);
  }
  return null;
}

export async function deleteDashboard(id: string): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const res = await apiFetch(`/dashboards/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Error deleting dashboard:', err);
    return false;
  }
}


