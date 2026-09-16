# Quarkifi Stream — Technical Documentation

> **Version:** 1.0  
> **Last Updated:** September 2026  
> **Product:** Quarkifi Stream — Zero-Code Industrial IoT Platform  
> **Company:** Quarkifi Technologies, Bengaluru, India

---

## What Is Quarkifi Stream?

Quarkifi Stream is a **zero-code Industrial IoT and edge-computing platform** that enables organizations to connect and model devices, ingest and transform telemetry, create real-time dashboards, manage industrial assets, automate operations through visual rules, and apply AI-driven predictive, anomaly and video analytics.

The platform's core pipeline follows a unified data flow:

```
Device → Data → Processing → Visualization → Rules → AI → Action
```

Quarkifi Stream is designed for industrial environments — manufacturing, machine monitoring, predictive maintenance, surveillance, energy management, and other sensor-driven operations — but is extensible to any IoT use case.

---

## Documentation Map

| Document | Description |
|---|---|
| [Architecture Overview](./architecture/overview.md) | High-level system architecture, service topology, and data flow |
| [Core Concepts](./architecture/core-concepts.md) | Foundational abstractions — Device Templates, Digital Twins, Assets |
| [Device Connectivity](./connectivity/mqtt.md) | MQTT and HTTP device connection reference |
| [Device Templates](./devices/templates.md) | Defining sensor models, controls, CCTV models, and navigation models |
| [Device Assets](./devices/assets.md) | Asset hierarchies, grouping parameters, and derived KPIs |
| [Data Pipelines](./data-pipelines/overview.md) | Data transformation, filtering, routing, and integrations |
| [Analytics & KPIs](./analytics/overview.md) | Time-series analytics, OEE, reliability, energy, and quality metrics |
| [Rule Engine](./automation/rule-engine.md) | Visual rule builder — conditions, timers, and actions |
| [AI & Computer Vision](./ai/overview.md) | Prediction, anomaly detection, and video analytics |
| [Edge Computing](./edge/overview.md) | K3s-based edge deployment, orchestration, and lifecycle management |
| [Security](./security/overview.md) | Authentication, TLS, credential management, and best practices |
| [API Reference](./api/overview.md) | MQTT topics, payload schemas, and HTTP API conventions |
| [Glossary](./glossary.md) | Terminology reference for industrial IoT concepts |

---

## Platform Modules at a Glance

| Module | Purpose | Category |
|---|---|---|
| Dashboard | System-wide monitoring and visualization | Visualization |
| Device Templates | Define device schemas and data models | Device Management |
| Device Management | Register and manage physical devices | Device Management |
| Device Assets | Industrial asset hierarchies and KPIs | Device Management |
| Digital Twins | Virtual representation of physical devices | Device Management |
| MQTT / HTTP | Bidirectional device connectivity | Connectivity |
| Data Pipelines | Transform, filter, and route telemetry | Data |
| Analytics | Historical and real-time time-series analysis | Analytics |
| Rule Engine | Conditional automation and alerting | Automation |
| Alarms | Event-driven notifications | Automation |
| Workflows | Business process automation | Automation |
| Forms | Operational data collection | Automation |
| AI Models | Prediction and anomaly detection | Intelligence |
| CCTV | Camera stream management | Intelligence |
| Video Analytics | Computer-vision-based detection and counting | Intelligence |
| Edge Computing | Local processing via K3s containers | Edge |
| OTA | Remote firmware updates | Edge |

---

## Five-Layer Architecture

Quarkifi Stream integrates five distinct layers into a single platform:

```
┌─────────────────────────────────────────────────────────┐
│                  LAYER 5 — AUTOMATION                   │
│  Rules · Timers · Actions · Alarms · Workflows · Commands │
├─────────────────────────────────────────────────────────┤
│                  LAYER 4 — INTELLIGENCE                 │
│  Analytics · AI · Prediction · Anomaly · Vision · OEE   │
├─────────────────────────────────────────────────────────┤
│                  LAYER 3 — DATA                         │
│  Telemetry · Pipelines · MongoDB · MySQL · Kafka · SFTP │
├─────────────────────────────────────────────────────────┤
│                  LAYER 2 — DEVICE ABSTRACTION           │
│  Templates · Digital Twins · Assets · Grouping · KPIs   │
├─────────────────────────────────────────────────────────┤
│                  LAYER 1 — CONNECTIVITY                 │
│  MQTT · HTTP/HTTPS · WebSocket · ESP32 · RPi · Arduino  │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

1. **Create a Device Template** — Define the schema for your device type (sensor, actuator, camera, or GPS).
2. **Register a Device** — Instantiate a physical device from the template and receive MQTT credentials.
3. **Connect the Device** — Publish telemetry over MQTT or HTTP using the provided credentials and topics.
4. **Build a Dashboard** — Create real-time visualizations from the incoming telemetry stream.
5. **Configure Rules** — Set up conditions, timers, and actions to automate responses.
6. **Deploy Analytics** — Apply OEE, reliability, energy, and quality KPIs to your asset hierarchy.

For detailed instructions, see the individual documentation sections linked above.
