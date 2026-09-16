# Data Pipelines

> Data Pipelines in Quarkifi Stream enable the transformation, filtering, and routing of device telemetry to external systems and storage backends. This document covers pipeline architecture, execution modes, stages, and integration targets.

---

## Overview

A Data Pipeline defines how telemetry flows from ingestion to one or more destinations. Pipelines decouple device data from its consumers, allowing the same telemetry to be processed differently for different purposes.

```
Device Telemetry
       │
       ▼
   PIPELINE
       │
       ├── Transform (reshape, enrich, compute)
       ├── Filter    (include/exclude by condition)
       └── Route     (send to destinations)
            │
            ├──► MongoDB
            ├──► MySQL
            ├──► Kafka
            ├──► SFTP
            └──► HTTP API
```

---

## Pipeline Architecture

### Visual Builder

Pipelines are constructed using a visual drag-and-drop builder in the Quarkifi Stream console. Each pipeline is a directed graph of stages:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
│  SOURCE   │────►│TRANSFORM │────►│  FILTER  │────►│ DESTINATION  │
│           │     │          │     │          │     │              │
│  Device   │     │  Rename  │     │  IF temp │     │  MongoDB     │
│  Group    │     │  Compute │     │  > 40    │     │  MySQL       │
│  Asset    │     │  Enrich  │     │          │     │  Kafka       │
└──────────┘     └──────────┘     └──────────┘     └──────────────┘
```

### Multi-Destination Routing

A single pipeline can fan out to multiple destinations:

```
Sensor Telemetry
       │
       ▼
   Transform
       │
       ▼
    Filter
       │
       ├──────────────────────────────────────┐
       ▼                   ▼                  ▼
    MongoDB             MySQL              Kafka
       │                   │                  │
       ▼                   ▼                  ▼
  Time-Series           ERP /             Streaming
   Analytics          Relational         Consumers
```

---

## Execution Modes

| Mode | Trigger | Use Case |
|---|---|---|
| **Realtime** | Every incoming telemetry message | Live monitoring, alerting, real-time dashboards |
| **Rule-Based** | When a rule condition evaluates to true | Conditional data routing (e.g., only high-temp readings) |
| **Scheduled** | Cron-based interval | Batch exports, periodic reports, aggregated data transfers |

### Realtime Pipeline

```
Device publishes telemetry
       │
       ▼ (immediately)
Pipeline processes message
       │
       ▼
Data arrives at destination
```

### Rule-Based Pipeline

```
Device publishes telemetry
       │
       ▼
Rule engine evaluates condition
       │
       ▼ (condition true)
Pipeline processes message
       │
       ▼
Data arrives at destination
```

### Scheduled Pipeline

```
Cron triggers (e.g., every hour)
       │
       ▼
Pipeline queries buffered data
       │
       ▼
Batch process and route
       │
       ▼
Data arrives at destination
```

---

## Pipeline Stages

### 1. Source

Defines where the pipeline reads data from:

| Source Type | Description |
|---|---|
| **Single Device** | Telemetry from one specific device |
| **Device Group** | Telemetry from all devices in a group |
| **Asset** | Aggregated telemetry from all devices attached to an asset |
| **All Devices** | Platform-wide telemetry stream |

### 2. Transform

Applies transformations to the telemetry payload:

| Transform | Description | Example |
|---|---|---|
| **Rename** | Rename an attribute key | `temp` → `temperature_celsius` |
| **Compute** | Calculate a new attribute | `power_kw = voltage * current` |
| **Convert** | Unit conversion | `°F` → `°C` |
| **Enrich** | Add metadata | Add `location`, `asset_name`, `timestamp` |
| **Flatten** | Flatten nested objects | `sensor.temp` → `sensor_temp` |
| **Aggregate** | Window-based aggregation | `avg(temperature)` over 5 minutes |

### 3. Filter

Includes or excludes messages based on conditions:

| Filter Type | Example |
|---|---|
| **Threshold** | `temperature > 40` |
| **Range** | `humidity BETWEEN 30 AND 70` |
| **Equality** | `status == "error"` |
| **Null Check** | `battery IS NOT NULL` |
| **Boolean** | `anomaly == true` |
| **Compound** | `temperature > 80 AND vibration > 0.05` |

### 4. Destination

Routes processed data to one or more external systems:

| Destination | Protocol | Use Case |
|---|---|---|
| **MongoDB** | MongoDB Wire Protocol | Time-series storage, analytics queries |
| **MySQL** | MySQL Protocol | Relational storage, ERP integration |
| **Kafka** | Kafka Producer | Real-time streaming to downstream consumers |
| **SFTP** | SFTP | File-based batch exports (CSV, JSON) |
| **HTTP API** | HTTP/HTTPS POST | Webhook, external service integration |

---

## Example Pipelines

### 1. Real-Time Archival

Purpose: Persist all telemetry to MongoDB for historical analysis.

```
Source: All Devices
Mode: Realtime
Transform: Add timestamp, device_id, asset_name
Filter: None (all messages)
Destination: MongoDB → telemetry collection
```

### 2. High-Temperature Alert Routing

Purpose: Route only critical temperature readings to Kafka for downstream alerting.

```
Source: Temperature Sensors (group)
Mode: Realtime
Transform: None
Filter: temperature > 85
Destination: Kafka → critical-alerts topic
```

### 3. Hourly ERP Sync

Purpose: Send aggregated production data to the ERP system every hour.

```
Source: Production Line 1 (asset)
Mode: Scheduled (every hour)
Transform: Aggregate (sum: production_count, avg: cycle_time)
Filter: None
Destination: MySQL → production_summary table
```

### 4. Conditional External Webhook

Purpose: Notify an external system when anomalies are detected.

```
Source: All Vibration Sensors (group)
Mode: Rule-Based (anomaly == true)
Transform: Enrich with asset_name, location
Filter: anomaly == true
Destination: HTTP POST → https://erp.example.com/api/anomaly
```

### 5. Daily Report Export

Purpose: Export daily production reports as CSV to an SFTP server.

```
Source: All Assets
Mode: Scheduled (daily at 06:00)
Transform: Aggregate daily KPIs (OEE, throughput, defect_rate)
Filter: None
Destination: SFTP → /reports/daily/production_{date}.csv
```

---

## Pipeline Monitoring

Each pipeline provides runtime metrics:

| Metric | Description |
|---|---|
| **Messages Processed** | Total messages handled |
| **Messages Filtered** | Messages excluded by filter conditions |
| **Messages Routed** | Messages successfully sent to destinations |
| **Errors** | Failed transformations or delivery failures |
| **Latency** | Average time from ingestion to destination delivery |
| **Last Executed** | Timestamp of most recent execution |

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Start simple** | Begin with a single source → single destination pipeline |
| **Filter early** | Apply filters before transforms to reduce processing load |
| **Monitor errors** | Set up alerts on pipeline error counts |
| **Use scheduling** | For non-time-critical data, prefer scheduled over realtime |
| **Idempotency** | Design transforms to be idempotent for safe re-processing |
| **Naming** | Name pipelines descriptively: `prod-line-1-hourly-erp-sync` |
| **Testing** | Test pipelines with sample data before enabling on production streams |
