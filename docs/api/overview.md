# API Reference

> This document provides the API conventions, MQTT topic structure, payload schemas, and HTTP endpoint patterns for integrating with Quarkifi Stream programmatically.

---

## MQTT API

### Broker Connection

| Parameter | Value |
|---|---|
| **Host** | `mqtt.qconsole.quarkifi.com` |
| **Port (unsecured)** | `1883` |
| **Port (TLS)** | `8883` |
| **Protocol** | MQTT 3.1.1 / 5.0 |
| **Auth** | Username + Password (per-device) |

### Topic Structure

#### Upstream (Device → Platform)

```
/device/upstream
```

Devices publish telemetry to this topic. The broker resolves the device context from the authenticated credentials.

**Payload format:** JSON object with keys matching the device template attributes.

```json
{
  "<attribute_name>": <value>,
  "<attribute_name>": <value>
}
```

**Example:**

```json
{
  "temperature": 42.5,
  "humidity": 68.2,
  "battery": 87,
  "status": "running"
}
```

#### Downstream (Platform → Device)

```
/device/downstream
```

Devices subscribe to this topic to receive commands from the platform (rule actions, manual commands, OTA instructions).

**Payload format:** JSON object with action and parameters.

```json
{
  "action": "<command>",
  "target": "<attribute>",
  "value": <value>,
  "timestamp": "<ISO 8601>"
}
```

**Example:**

```json
{
  "action": "SET",
  "target": "motor_speed",
  "value": 1500,
  "timestamp": "2026-09-07T13:25:00Z"
}
```

```json
{
  "action": "OFF",
  "target": "relay_1",
  "timestamp": "2026-09-07T13:25:00Z"
}
```

### MQTT Quality of Service

| QoS Level | Description | Recommended Use |
|---|---|---|
| **QoS 0** | At most once (fire and forget) | High-frequency, non-critical telemetry |
| **QoS 1** | At least once (acknowledged) | Standard telemetry (recommended default) |
| **QoS 2** | Exactly once (four-step handshake) | Critical commands, billing-relevant data |

---

## HTTP API

### Base URL

```
https://api.qconsole.quarkifi.com/v1
```

### Authentication

```
Authorization: Bearer <device-token-or-api-key>
Content-Type: application/json
```

### Endpoints

#### Telemetry Ingestion

```http
POST /v1/telemetry
```

Publish telemetry via HTTP (alternative to MQTT).

**Request body:**

```json
{
  "temperature": 42.5,
  "humidity": 68.2
}
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-09-07T13:20:00Z"
}
```

#### Device Status

```http
GET /v1/devices/{device_id}/status
```

Retrieve the current Digital Twin state.

**Response:**

```json
{
  "device_id": "dev-001",
  "status": "ONLINE",
  "last_seen": "2026-09-07T13:20:00Z",
  "attributes": {
    "temperature": 42.5,
    "humidity": 68.2,
    "battery": 87
  }
}
```

#### Device Command

```http
POST /v1/devices/{device_id}/commands
```

Send a command to a device.

**Request body:**

```json
{
  "action": "SET",
  "target": "motor_speed",
  "value": 1500
}
```

**Response:**

```json
{
  "status": "queued",
  "command_id": "cmd-789",
  "timestamp": "2026-09-07T13:25:00Z"
}
```

#### Telemetry Query

```http
GET /v1/devices/{device_id}/telemetry?start={ISO8601}&end={ISO8601}&attributes={attr1,attr2}
```

Query historical telemetry.

**Response:**

```json
{
  "device_id": "dev-001",
  "start": "2026-09-07T00:00:00Z",
  "end": "2026-09-07T13:00:00Z",
  "data": [
    {
      "timestamp": "2026-09-07T00:00:00Z",
      "temperature": 38.2,
      "humidity": 72.1
    },
    {
      "timestamp": "2026-09-07T01:00:00Z",
      "temperature": 39.5,
      "humidity": 70.3
    }
  ]
}
```

---

## Webhook Payloads

When a rule action triggers an HTTP webhook, the platform sends a POST request:

```http
POST <webhook-url>
Content-Type: application/json
```

**Payload:**

```json
{
  "event": "rule_triggered",
  "rule_id": "rule-overtemp-001",
  "rule_name": "Motor Overtemperature Shutdown",
  "device_id": "dev-001",
  "device_name": "CNC Machine 01 - Temperature Sensor",
  "severity": "CRITICAL",
  "timestamp": "2026-09-07T13:25:00Z",
  "condition": {
    "attribute": "temperature",
    "operator": ">",
    "threshold": 85,
    "actual_value": 91.3
  },
  "actions_taken": [
    "alarm_created",
    "device_command_sent",
    "email_sent"
  ]
}
```

---

## Error Responses

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Attribute 'temperature' expected type float, received string",
    "details": {
      "attribute": "temperature",
      "expected": "float",
      "received": "string",
      "value": "hot"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Device, rule, or resource not found |
| `INVALID_PAYLOAD` | 400 | Payload does not match template schema |
| `RATE_LIMITED` | 429 | Too many requests — back off and retry |
| `INTERNAL_ERROR` | 500 | Server-side error |

---

## Rate Limits

| Context | Limit |
|---|---|
| **MQTT publish (per device)** | Varies by plan (e.g., 1 msg/sec default) |
| **HTTP telemetry (per device)** | Varies by plan |
| **API queries (per API key)** | Varies by plan |
| **Webhook delivery** | Best-effort with retry on failure |

---

## SDK Support

| Platform | Language | Connection |
|---|---|---|
| **Python** | `paho-mqtt` | MQTT + HTTP |
| **ESP32 / Arduino** | `PubSubClient` | MQTT |
| **Raspberry Pi** | `paho-mqtt` (Python) | MQTT + HTTP |
| **Node.js** | `mqtt.js` | MQTT |
| **Go** | `paho.mqtt.golang` | MQTT |
| **Java** | `Eclipse Paho` | MQTT |

See the [MQTT Connectivity Guide](../connectivity/mqtt.md) for platform-specific code examples.
