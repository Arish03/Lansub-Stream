-- insert a user
INSERT INTO users (id, email, hashed_password)
VALUES (gen_random_uuid(), 'test@example.com', 'not-a-real-hash');

-- insert a device for that user
INSERT INTO devices (id, user_id, name, device_key, mqtt_username, mqtt_password)
SELECT gen_random_uuid(), id, 'Test Sensor', 'dev_test123', 'dev_test123', 'somepass'
FROM users WHERE email = 'test@example.com';

-- insert a telemetry reading
INSERT INTO telemetry (id, device_id, payload)
SELECT gen_random_uuid(), id, '{"temperature": 24.5, "humidity": 55}'::jsonb
FROM devices WHERE device_key = 'dev_test123';

-- confirm the join works and the index is used
EXPLAIN ANALYZE
SELECT * FROM telemetry
WHERE device_id = (SELECT id FROM devices WHERE device_key = 'dev_test123')
ORDER BY ts DESC LIMIT 100;
