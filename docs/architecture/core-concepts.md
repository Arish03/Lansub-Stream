# Core Concepts

> This document defines the foundational abstractions used throughout Quarkifi Stream. Understanding these concepts is essential before working with any platform module.

---

## Concept Hierarchy

```
Organization
 └── Project
      ├── Device Template  ──►  Device Instance  ──►  Digital Twin
      │
      ├── Asset
      │    ├── Grouping Parameters
      │    └── Derived Parameters (KPIs)
      │
      ├── Dashboard
      ├── Data Pipeline
      ├── Rule
      ├── AI Model
      └── Edge Deployment
```

---

## 1. Device Template

A **Device Template** is a schema definition that describes the structure and capabilities of a device type. Templates define what data a device will send and/or receive — its telemetry attributes, command interfaces, and metadata.

Templates are created once and reused across multiple device instances.

### Template Types

| Type | Purpose | Example Attributes |
|---|---|---|
| **Sensor Model** | Devices that emit telemetry | `temperature`, `humidity`, `pressure`, `battery` |
| **Control / Switch** | Devices that receive commands | `power` (ON/OFF), `speed`, `reset` |
| **CCTV Model** | Camera feeds with AI attributes | `person_count`, `helmet_detected`, `anomaly` |
| **Navigation Model** | Location-aware mobile devices | `latitude`, `longitude`, `speed`, `direction` |

### Example: Temperature Sensor Template

```
Temperature Sensor
├── temperature  : float
├── humidity     : float
├── pressure     : float
└── battery      : float
```

### Example: Motor Control Template

```
Motor
├── Start   : command
├── Stop    : command
├── Speed   : integer (0–100)
└── Reset   : command
```

---

## 2. Device Instance

A **Device Instance** is a physical or logical device registered against a Device Template. When a device is created:

1. It inherits the schema from its template
2. It receives unique MQTT credentials (username, password)
3. It is assigned upstream and downstream topics
4. It begins appearing in dashboards, analytics, and rule scopes

### Lifecycle

```
Template Created
       │
       ▼
Device Registered
       │
       ▼
Credentials Issued
       │
       ▼
Device Connected (MQTT/HTTP)
       │
       ▼
Telemetry Flowing
       │
       ▼
Rules / Analytics / Dashboards Active
```

---

## 3. Digital Twin

A **Digital Twin** is the platform's virtual representation of a physical device. It maintains:

- **Latest known state** — the most recent values of every telemetry attribute
- **Connection status** — whether the device is online, offline, or in error
- **Metadata** — location, firmware version, deployment date, configuration
- **Command queue** — pending downstream commands

The Digital Twin serves as the single source of truth for any component querying a device's current state (dashboards, rules, analytics, AI models).

```
Physical Device                Digital Twin (Platform)
┌──────────────┐              ┌──────────────────────┐
│ temperature   │ ──MQTT──►  │ temperature: 42.5     │
│ humidity      │             │ humidity: 68.2        │
│ battery       │             │ battery: 87           │
│               │ ◄──MQTT──  │ pending_cmd: null      │
│               │             │ status: ONLINE         │
│               │             │ last_seen: 2026-09-07  │
└──────────────┘              └──────────────────────┘
```

---

## 4. Asset

An **Asset** is a business-level abstraction that represents a physical piece of equipment, a production line, a facility, or any operational entity. Assets are distinct from devices:

- A **device** is a data source (sensor, controller, camera)
- An **asset** is the operational entity the device is attached to (machine, line, building)

One asset can aggregate data from multiple devices.

### Example: CNC Machine Asset

```
CNC Machine 01 (Asset)
 ├── Temperature Sensor  (Device)
 ├── Vibration Sensor    (Device)
 └── Power Meter         (Device)
```

### Asset Hierarchy

Assets can be organized into hierarchies reflecting the physical or organizational structure:

```
Plant
 └── Factory A
      └── Production Line 1
           ├── CNC Machine 01
           ├── CNC Machine 02
           └── CNC Machine 03
```

---

## 5. Grouping Parameters

**Grouping Parameters** define how devices and assets are aggregated for analytics and dashboards. Instead of querying individual devices, users can query groups.

| Grouping Basis | Example |
|---|---|
| Location | Building A, Floor 2, Zone 3 |
| Plant | Plant Mumbai, Plant Bengaluru |
| Production Line | Line 1, Line 2, Line 3 |
| Machine Type | CNC, Lathe, Press, Assembly |
| Department | Manufacturing, Packaging, QC |

### Example Query Shift

| Without Grouping | With Grouping |
|---|---|
| "What is Device 392's temperature?" | "What is the average temperature of Line 2?" |
| "Is Device 847 online?" | "How many machines in Building A are online?" |

---

## 6. Derived Parameters (KPIs)

**Derived Parameters** are computed metrics calculated from raw device telemetry. They transform low-level data into actionable industrial KPIs.

### Categories

#### Operational

| KPI | Description |
|---|---|
| **Utilization** | Percentage of time the asset is actively producing |
| **Availability** | Percentage of planned production time the asset is available |
| **Load Factor** | Actual output relative to maximum capacity |
| **Performance** | Actual throughput relative to ideal throughput |
| **OEE** | Overall Equipment Effectiveness = Availability × Performance × Quality |
| **Throughput** | Units produced per unit time |
| **Yield** | Ratio of good output to total output |
| **Cycle Time** | Time to complete one production cycle |

#### Reliability

| KPI | Description |
|---|---|
| **RUL** | Remaining Useful Life — predicted time before failure |
| **MTBF** | Mean Time Between Failures — average uptime duration |
| **MTTR** | Mean Time To Repair — average downtime per failure event |
| **Health** | Composite health score (0–100) |
| **Condition Index** | Current condition assessment based on sensor readings |
| **Failure Probability** | Likelihood of failure within a given time window |

#### Energy

| KPI | Description |
|---|---|
| **Consumption** | Total energy consumed (kWh) |
| **Intensity** | Energy per unit of output |
| **Carbon** | CO₂ equivalent of energy consumed |
| **Peak Demand** | Maximum instantaneous power draw |

#### Quality

| KPI | Description |
|---|---|
| **Defect Rate** | Percentage of defective output |

### Computation Flow

```
Raw Telemetry
     │
     ▼
Machine Runtime + Downtime + Production Count + Defect Count
     │
     ▼
Availability = Runtime / Planned Time
Performance  = Actual Output / Ideal Output
Quality      = Good Output / Total Output
     │
     ▼
OEE = Availability × Performance × Quality
```

---

## 7. Dashboard

A **Dashboard** is a configurable visualization surface composed of widgets. Each widget is bound to a device, asset, or derived parameter. Dashboards support:

- Real-time telemetry display
- Historical time-series charts
- Gauges, maps, tables, and custom widgets
- Configurable layouts
- Time range selectors (Now, Past Hour, Today, This Week, This Month, Custom)

---

## 8. Data Pipeline

A **Data Pipeline** defines how telemetry flows from ingestion to external systems. Pipelines support:

- **Transform** — reshape, enrich, or compute values
- **Filter** — select/exclude records based on conditions
- **Route** — send data to one or more destinations (MongoDB, MySQL, Kafka, SFTP, HTTP)
- **Schedule** — execute on a cron schedule rather than in real-time

Execution modes: **Realtime**, **Rule-Based**, **Scheduled**.

---

## 9. Rule

A **Rule** defines conditional automation logic using a visual flow editor:

```
START (scope: device or asset)
   │
   ▼
CONDITION (evaluate telemetry against thresholds)
   │
   ▼
TIMER (optional delay or debounce)
   │
   ▼
ACTION (alert, command, API call, pipeline trigger)
```

Rules enable the platform to function as an automation engine, not just a monitoring dashboard.

---

## 10. Project

A **Project** is the top-level organizational container. All resources (devices, templates, assets, dashboards, rules, pipelines, AI models, edge deployments) belong to a project. Projects provide tenant isolation.
