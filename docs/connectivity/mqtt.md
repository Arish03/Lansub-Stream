# Device Connectivity — MQTT Reference

> This document covers how physical devices connect to the Quarkifi Stream platform using MQTT and HTTP protocols, including authentication, topics, payload formats, and security best practices.

---

## Connection Overview

Quarkifi Stream provides bidirectional device connectivity through an MQTT broker. Every registered device receives:

1. **MQTT credentials** — unique username and password
2. **Upstream topic** — for publishing telemetry to the platform
3. **Downstream topic** — for receiving commands from the platform

```
Device                          Quarkifi Stream
  │                                    │
  │── Publish telemetry ──────────────►│  (upstream)
  │                                    │
  │◄── Receive commands ──────────────│  (downstream)
  │                                    │
```

---

## MQTT Broker Details

| Parameter | Value |
|---|---|
| **Host** | `mqtt.qconsole.quarkifi.com` |
| **Port (unsecured)** | `1883` |
| **Port (TLS secured)** | `8883` |
| **Protocol** | MQTT 3.1.1 / 5.0 |
| **Authentication** | Username + Password (per-device) |

> [!WARNING]
> **Always use port 8883 (TLS) for production deployments.** Port 1883 transmits credentials and telemetry in plaintext and should only be used during development and testing.

---

## MQTT Topics

### Upstream (Device → Platform)

```
/device/upstream
```

Devices publish telemetry payloads to this topic. The broker routes messages to the correct device context based on the authenticated credentials.

### Downstream (Platform → Device)

```
/device/downstream
```

Devices subscribe to this topic to receive commands, configuration updates, and OTA instructions from the platform.

---

## Payload Format

Telemetry payloads are JSON objects. Each key must correspond to an attribute defined in the device's template.

### Simple Sensor Payload

```json
{
  "temperature": 42.5,
  "humidity": 68.2,
  "battery": 87
}
```

### Multi-Attribute Payload

```json
{
  "temp_1": 72.3,
  "temp_2": 68.1,
  "pressure": 1.02,
  "vibration_x": 0.003,
  "vibration_y": 0.012,
  "power_kw": 4.7,
  "status": "running"
}
```

### Navigation Payload

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 42.3,
  "direction": "NNE",
  "timestamp": "2026-09-07T13:20:00Z"
}
```

### CCTV / Vision Payload

```json
{
  "person_count": 12,
  "vehicle_count": 3,
  "helmet_detected": true,
  "restricted_zone": false,
  "anomaly": false
}
```

---

## Connection Examples

### Python (paho-mqtt)

```python
import paho.mqtt.client as mqtt
import json
import time

# Device credentials (from Quarkifi Stream console)
BROKER = "mqtt.qconsole.quarkifi.com"
PORT = 8883  # TLS
USERNAME = "<your-device-username>"
PASSWORD = "<your-device-password>"
TOPIC = "/device/upstream"

client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()  # Enable TLS

client.connect(BROKER, PORT, 60)
client.loop_start()

while True:
    payload = {
        "temperature": 42.5,
        "humidity": 68.2,
        "battery": 87
    }
    client.publish(TOPIC, json.dumps(payload))
    time.sleep(10)
```

### ESP32 (Arduino / PlatformIO)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT
const char* mqtt_server = "mqtt.qconsole.quarkifi.com";
const int   mqtt_port = 8883;
const char* mqtt_user = "<your-device-username>";
const char* mqtt_pass = "<your-device-password>";
const char* topic = "/device/upstream";

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  espClient.setInsecure(); // For testing only; use CA cert in production
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32Client", mqtt_user, mqtt_pass)) {
      Serial.println("Connected to Quarkifi Stream");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  StaticJsonDocument<256> doc;
  doc["temperature"] = analogRead(34) * 0.1;
  doc["humidity"] = analogRead(35) * 0.1;

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(topic, buffer);

  delay(10000);
}
```

### Raspberry Pi (Python)

```python
import paho.mqtt.client as mqtt
import json
import time
import Adafruit_DHT

BROKER = "mqtt.qconsole.quarkifi.com"
PORT = 8883
USERNAME = "<your-device-username>"
PASSWORD = "<your-device-password>"
TOPIC = "/device/upstream"
SENSOR = Adafruit_DHT.DHT22
GPIO_PIN = 4

client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()
client.connect(BROKER, PORT, 60)
client.loop_start()

while True:
    humidity, temperature = Adafruit_DHT.read_retry(SENSOR, GPIO_PIN)
    if humidity is not None and temperature is not None:
        payload = {
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2)
        }
        client.publish(TOPIC, json.dumps(payload))
    time.sleep(10)
```

---

## Receiving Commands (Downstream)

To receive commands from the platform, devices subscribe to the downstream topic:

```python
def on_message(client, userdata, msg):
    command = json.loads(msg.payload.decode())
    print(f"Received command: {command}")

    if command.get("action") == "OFF":
        # Turn off motor, relay, etc.
        pass

client.subscribe("/device/downstream")
client.on_message = on_message
```

### Example Downstream Command Payload

```json
{
  "action": "OFF",
  "target": "motor_1",
  "timestamp": "2026-09-07T13:25:00Z"
}
```

---

## HTTP Alternative

For devices that cannot maintain persistent MQTT connections, Quarkifi Stream also accepts telemetry over HTTP/HTTPS:

```
POST https://api.qconsole.quarkifi.com/v1/telemetry
Content-Type: application/json
Authorization: Bearer <device-token>

{
  "temperature": 42.5,
  "humidity": 68.2
}
```

HTTP is suitable for:
- Devices behind corporate firewalls that block MQTT
- Batch uploads of historical data
- Low-frequency reporting (hourly, daily)

For real-time, high-frequency telemetry, MQTT is strongly recommended.

---

## Security Best Practices

| Practice | Recommendation |
|---|---|
| **TLS** | Always use port 8883 with TLS in production |
| **Credentials** | Treat MQTT username/password as secrets — never hardcode in source control |
| **Rotation** | Rotate device credentials periodically; revoke on decommission |
| **Certificate Pinning** | Use CA certificate verification on ESP32/RPi rather than `setInsecure()` |
| **Network** | Restrict MQTT access to known IP ranges where possible |
| **Payload Validation** | The platform validates incoming payloads against the device template schema |
| **Rate Limiting** | Be aware of per-device publish rate limits to avoid throttling |
| **Secret Masking** | The console should mask credentials by default; copy without displaying |

> [!CAUTION]
> If MQTT credentials are exposed (e.g., in a screenshot, commit, or log), **rotate them immediately** through the Quarkifi Stream console. Exposed credentials can allow unauthorized devices to publish false telemetry or subscribe to sensitive command streams.
