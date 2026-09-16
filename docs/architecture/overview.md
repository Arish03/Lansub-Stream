# Architecture Overview

> Quarkifi Stream is composed of a cloud-hosted platform core, optional edge gateways, and a bidirectional device connectivity layer. This document describes the system-level architecture, service decomposition, and primary data flows.

---

## System Topology

```
                 ┌─────────────────────────┐
                 │     PHYSICAL DEVICES     │
                 │                          │
                 │  Sensors · PLC · CNC     │
                 │  ESP32 · Raspberry Pi    │
                 │  CCTV · Gateways         │
                 └────────────┬─────────────┘
                              │
                    MQTT / HTTP / HTTPS
                              │
                              ▼
                 ┌─────────────────────────┐
                 │    DEVICE MANAGEMENT     │
                 │                          │
                 │  Device Templates        │
                 │  Device Assets           │
                 │  Device Connections      │
                 │  Digital Twins           │
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │      DATA PIPELINE       │
                 │                          │
                 │  Transform               │
                 │  Filter                  │
                 │  Route                   │
                 │  Schedule                │
                 └────────────┬─────────────┘
                              │
             ┌────────────────┼──────────────────┐
             ▼                ▼                  ▼
          MongoDB           MySQL              Kafka
             │                │                  │
             └────────────────┼──────────────────┘
                              ▼
                 ┌─────────────────────────┐
                 │       ANALYTICS          │
                 │                          │
                 │  OEE · Performance       │
                 │  Reliability · Energy    │
                 │  Quality · Health        │
                 └────────────┬─────────────┘
                              │
                ┌─────────────┴───────────────┐
                ▼                             ▼
       ┌──────────────────┐          ┌────────────────────┐
       │   RULE ENGINE     │          │    AI ENGINE        │
       │                   │          │                    │
       │   Conditions      │          │   Prediction       │
       │   Timers          │          │   Anomaly Detection │
       │   Actions         │          │   Computer Vision   │
       └────────┬──────────┘          └────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                      ┌──────────────────┐
                      │  DASHBOARDS /     │
                      │  ALERTS / ACTIONS │
                      └──────────────────┘
```

---

## Service Decomposition

The platform is internally organized into the following logical services:

```
                    QUARKIFI STREAM
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
 Device Service      Identity Service    Project Service
        │
        ▼
 MQTT Broker
        │
        ▼
 Telemetry Ingestion
        │
        ├───────────────┐
        ▼               ▼
 Data Processing     Event Bus
        │               │
        ▼               ▼
 Time-Series DB      Rule Engine
        │               │
        │               ├── Conditions
        │               ├── Timers
        │               └── Actions
        │
        ├───────────────┐
        ▼               ▼
 Analytics Service   AI Service
        │               │
        ▼               ▼
 OEE / KPI          Prediction
 Reliability        Anomaly
 Energy             Vision
 Quality
        │
        └───────────────┐
                        ▼
                  Dashboard API
                        │
                        ▼
                  Web Application
```

### Service Responsibilities

| Service | Responsibility |
|---|---|
| **Identity Service** | User authentication, authorization, API keys, MQTT credential issuance |
| **Project Service** | Multi-tenant project and organization management |
| **Device Service** | Template CRUD, device registration, connection management, Digital Twins |
| **MQTT Broker** | Bidirectional message routing between devices and platform |
| **Telemetry Ingestion** | High-throughput intake of raw device messages |
| **Data Processing** | Transformation, filtering, enrichment, and routing of telemetry |
| **Event Bus** | Internal publish/subscribe for cross-service communication |
| **Time-Series DB** | Persistent storage of telemetry for historical queries |
| **Rule Engine** | Condition evaluation, timer scheduling, and action dispatch |
| **Analytics Service** | KPI computation — OEE, reliability, energy, quality |
| **AI Service** | Model inference — prediction, anomaly detection, computer vision |
| **Dashboard API** | Widget data retrieval, layout management, real-time push |

---

## Data Flow

### Upstream (Device → Platform)

```
Physical Device
       │
       │  Publish JSON payload to /device/upstream
       ▼
   MQTT Broker
       │
       ▼
Telemetry Ingestion
       │
       ├──► Time-Series DB (persist)
       ├──► Rule Engine (evaluate conditions)
       ├──► Data Pipeline (transform & route)
       └──► Dashboard API (real-time push to UI)
```

### Downstream (Platform → Device)

```
Rule Engine / User Action
       │
       │  Publish command to /device/downstream
       ▼
   MQTT Broker
       │
       ▼
Physical Device
       │
       │  Execute command (ON/OFF, speed change, reset, etc.)
       ▼
   Confirmation
```

### Pipeline Routing

```
Telemetry
     │
     ▼
 Transform
     │
     ▼
  Filter
     │
     ▼
 ┌────────────┬────────────┬────────────┬────────────┐
 ▼            ▼            ▼            ▼            ▼
MongoDB     MySQL        Kafka        SFTP        HTTP API
```

---

## Cloud + Edge Architecture

For latency-sensitive or bandwidth-constrained environments, Quarkifi Stream supports a hybrid cloud-edge deployment model.

```
             CLOUD
     ┌────────────────────┐
     │  Quarkifi Stream   │
     │  Dashboard         │
     │  Analytics         │
     │  AI Management     │
     │  Device Management │
     └──────────┬─────────┘
                │
          Internet / VPN
                │
                ▼
          EDGE GATEWAY
     ┌────────────────────┐
     │  K3s               │
     │  AI Models         │
     │  Rules             │
     │  Local Processing  │
     │  Video Analytics   │
     └──────────┬─────────┘
                │
        Local Industrial LAN
                │
       ┌────────┼──────────┐
       ▼        ▼          ▼
     PLC     Sensors    Cameras
```

### Edge Benefits

| Concern | Cloud-Only | Cloud + Edge |
|---|---|---|
| **Latency** | Depends on internet RTT | Sub-millisecond local processing |
| **Bandwidth** | All raw data sent upstream | Only aggregated/filtered data sent |
| **Availability** | Offline = no processing | Local processing continues offline |
| **Security** | Sensitive data crosses network | Data stays within facility |
| **AI Inference** | Cloud GPU | Local GPU / TPU |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Protocol** | MQTT 3.1.1 / 5.0, HTTP/HTTPS, WebSocket |
| **Broker** | MQTT Broker (port 1883 / 8883 TLS) |
| **Databases** | MongoDB (telemetry), MySQL (relational), Kafka (streaming) |
| **Edge Runtime** | K3s (lightweight Kubernetes) |
| **AI Inference** | TensorFlow / PyTorch models (cloud and edge) |
| **Frontend** | Web application (Next.js) |
| **File Transfer** | SFTP |

---

## Multi-Tenancy

Quarkifi Stream is multi-tenant by design. Each **Project** provides an isolated namespace containing its own:

- Device templates and device instances
- MQTT credentials and topics
- Dashboards and analytics
- Rules and pipelines
- AI models and video feeds
- Edge deployments

Users can belong to multiple projects with role-based access control.
