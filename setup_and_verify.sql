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

-- insert a user
INSERT INTO users (id, email, hashed_password)
VALUES (gen_random_uuid(), 'test@example.com', 'not-a-real-hash')
ON CONFLICT (email) DO NOTHING;

-- insert a device for that user
INSERT INTO devices (id, user_id, name, device_key, mqtt_username, mqtt_password)
SELECT gen_random_uuid(), id, 'Test Sensor', 'dev_test123', 'dev_test123', 'somepass'
FROM users WHERE email = 'test@example.com'
ON CONFLICT (device_key) DO NOTHING;

-- insert a telemetry reading
INSERT INTO telemetry (id, device_id, payload)
SELECT gen_random_uuid(), id, '{"temperature": 24.5, "humidity": 55}'::jsonb
FROM devices WHERE device_key = 'dev_test123';

-- confirm the join works and the index is used
EXPLAIN ANALYZE
SELECT * FROM telemetry
WHERE device_id = (SELECT id FROM devices WHERE device_key = 'dev_test123')
ORDER BY ts DESC LIMIT 100;
