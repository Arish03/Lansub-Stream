CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users: one row per registered account
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- devices: one row per device a user registers
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    device_key VARCHAR UNIQUE NOT NULL,       -- used in the MQTT topic path
    mqtt_username VARCHAR UNIQUE NOT NULL,
    mqtt_password VARCHAR NOT NULL,
    template VARCHAR DEFAULT 'generic-sensor',
    created_at TIMESTAMP DEFAULT now(),
    last_seen_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_key ON devices(device_key);

-- telemetry: one row per reading received
CREATE TABLE IF NOT EXISTS telemetry (
    id UUID PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    ts TIMESTAMP DEFAULT now(),
    payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_ts ON telemetry(device_id, ts DESC);

-- rules: automation conditions and actions
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    scope VARCHAR DEFAULT 'Device',
    target_id VARCHAR,
    parameter VARCHAR NOT NULL,
    operator VARCHAR NOT NULL,
    threshold VARCHAR NOT NULL,
    unit VARCHAR,
    debounce_seconds VARCHAR DEFAULT '0s',
    actions JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT true,
    triggers_count INT DEFAULT 0,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);

-- alarms: active and historical system alerts
CREATE TABLE IF NOT EXISTS alarms (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
    severity VARCHAR DEFAULT 'HIGH',
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR DEFAULT 'ACTIVE',
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    telemetry_snapshot JSONB,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status);

-- device_templates: reusable schema definitions
CREATE TABLE IF NOT EXISTS device_templates (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    category VARCHAR DEFAULT 'Sensor',
    description TEXT,
    parameters JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_templates_user_id ON device_templates(user_id);

-- assets: hierarchical industrial entity tree (Site -> Area -> Line -> Cell -> Machine)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    type VARCHAR DEFAULT 'Equipment',
    criticality VARCHAR DEFAULT 'B',
    health_score INT DEFAULT 98,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_parent_id ON assets(parent_id);

