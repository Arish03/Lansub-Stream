# Device Templates

> Device Templates define the schema and capabilities of a device type. This document covers template creation, the four template categories, attribute types, and usage patterns.

---

## Overview

A Device Template is the blueprint from which device instances are created. It defines:

- **What data the device sends** (telemetry attributes)
- **What commands the device accepts** (control attributes)
- **The data type of each attribute** (float, integer, string, boolean, enum)
- **The device category** (sensor, control, CCTV, navigation)

Templates enforce consistency — every device of the same type shares the same schema, ensuring predictable data structures across dashboards, analytics, pipelines, and rules.

---

## Template Categories

### 01 — Sensor Models

Used for devices that emit measurement data. This is the most common template type.

```
Temperature Sensor
├── temperature  : float    (°C)
├── humidity     : float    (%)
├── pressure     : float    (hPa)
└── battery      : float    (%)
```

```
Vibration Sensor
├── vibration_x  : float    (mm/s)
├── vibration_y  : float    (mm/s)
├── vibration_z  : float    (mm/s)
├── frequency    : float    (Hz)
└── rms          : float    (mm/s)
```

```
Power Meter
├── voltage      : float    (V)
├── current      : float    (A)
├── power_kw     : float    (kW)
├── energy_kwh   : float    (kWh)
└── power_factor : float    (0–1)
```

### 02 — Control / Switch Models

Used for devices that accept commands and can be controlled remotely.

```
Light Switch
├── power        : enum     [ON, OFF]
└── brightness   : integer  (0–100)
```

```
Motor Controller
├── start        : command
├── stop         : command
├── speed        : integer  (0–3000 RPM)
├── direction    : enum     [CW, CCW]
└── reset        : command
```

```
Relay Board
├── relay_1      : boolean  (true/false)
├── relay_2      : boolean  (true/false)
├── relay_3      : boolean  (true/false)
└── relay_4      : boolean  (true/false)
```

### 03 — CCTV Models

Used for camera feeds that produce AI-derived analytics rather than raw video telemetry.

```
Safety Camera
├── person_count       : integer
├── helmet_detected    : boolean
├── vest_detected      : boolean
├── restricted_zone    : boolean
└── anomaly            : boolean
```

```
Traffic Camera
├── vehicle_count      : integer
├── pedestrian_count   : integer
├── avg_speed          : float   (km/h)
├── congestion_level   : enum    [LOW, MEDIUM, HIGH]
└── incident_detected  : boolean
```

### 04 — Navigation Models

Used for mobile or location-aware devices.

```
Fleet Vehicle
├── latitude     : float
├── longitude    : float
├── speed        : float    (km/h)
├── direction    : string
├── altitude     : float    (m)
├── fuel_level   : float    (%)
└── engine_status: enum     [ON, OFF, IDLE]
```

```
Mobile Asset Tracker
├── latitude     : float
├── longitude    : float
├── battery      : float    (%)
├── geofence     : string
└── timestamp    : datetime
```

---

## Attribute Data Types

| Type | Description | Example Values |
|---|---|---|
| `float` | Decimal number | `42.5`, `68.2`, `0.003` |
| `integer` | Whole number | `12`, `3000`, `0` |
| `boolean` | True/false | `true`, `false` |
| `string` | Text value | `"NNE"`, `"Zone A"` |
| `enum` | Predefined set of values | `[ON, OFF]`, `[LOW, MEDIUM, HIGH]` |
| `command` | Executable action (downstream only) | `start`, `stop`, `reset` |
| `datetime` | ISO 8601 timestamp | `"2026-09-07T13:20:00Z"` |

---

## Template Lifecycle

```
Define Template
      │
      ▼
Add Attributes (name, type, unit, constraints)
      │
      ▼
Save Template
      │
      ▼
Create Device Instances from Template
      │
      ▼
Devices inherit schema ──► Telemetry validated against schema
      │
      ▼
Update Template (add/remove attributes)
      │
      ▼
Propagate changes to all device instances
```

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Naming** | Use clear, descriptive names: `temperature_celsius`, not `t1` |
| **Units** | Include units in attribute metadata: `°C`, `kWh`, `mm/s` |
| **Granularity** | One template per device type — don't combine sensors and actuators |
| **Versioning** | When changing a template schema, consider backward compatibility |
| **Validation** | Define min/max ranges to catch invalid telemetry at ingestion |
| **Reuse** | Design templates for reuse across sites and deployments |
