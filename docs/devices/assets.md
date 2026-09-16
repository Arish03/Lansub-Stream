# Device Assets

> Device Assets represent the business-level equipment and operational entities that devices are attached to. This document covers asset hierarchies, grouping parameters, and derived KPI computation.

---

## Asset vs. Device

A fundamental distinction in Quarkifi Stream:

| Concept | Represents | Example |
|---|---|---|
| **Device** | A data source — sensor, controller, camera | Temperature Sensor #471 |
| **Asset** | The operational entity the device monitors | CNC Machine 01 |

One asset may aggregate telemetry from many devices:

```
CNC Machine 01 (Asset)
 ├── Temperature Sensor     (Device)
 ├── Vibration Sensor       (Device)
 ├── Power Meter            (Device)
 └── Status Controller      (Device)
```

---

## Asset Hierarchy

Assets can be organized into a hierarchical tree that mirrors the physical or organizational structure of a facility.

```
Quarkifi Manufacturing (Organization)
 └── Plant Bengaluru
      ├── Building A
      │    ├── Production Line 1
      │    │    ├── CNC Machine 01
      │    │    ├── CNC Machine 02
      │    │    └── CNC Machine 03
      │    └── Production Line 2
      │         ├── Lathe 01
      │         └── Lathe 02
      └── Building B
           └── Packaging Line 1
                ├── Conveyor 01
                ├── Labeler 01
                └── Palletizer 01
```

### Hierarchy Levels

| Level | Example | Typical Use |
|---|---|---|
| Organization | Quarkifi Technologies | Top-level company |
| Plant / Site | Plant Bengaluru | Physical location |
| Building / Zone | Building A | Facility subdivision |
| Line / Area | Production Line 1 | Functional grouping |
| Machine / Equipment | CNC Machine 01 | Individual asset |

---

## Grouping Parameters

Grouping parameters define how devices and assets are aggregated for analytics, dashboards, and reports. They enable queries at higher abstraction levels.

### Configuration

Each asset can have one or more grouping parameters. Common grouping dimensions:

| Dimension | Purpose | Example Values |
|---|---|---|
| **Location** | Physical grouping | Building A, Floor 2, Zone 3 |
| **Plant** | Site-level grouping | Mumbai, Bengaluru, Chennai |
| **Production Line** | Manufacturing context | Line 1, Line 2, Line 3 |
| **Machine Type** | Equipment category | CNC, Lathe, Press, Assembly |
| **Department** | Organizational grouping | Manufacturing, QC, Packaging |
| **Shift** | Time-based grouping | Morning, Afternoon, Night |

### Aggregation Queries

Grouping enables aggregation across multiple assets:

| Query Level | Example |
|---|---|
| Device | "Temperature of Sensor #471" |
| Asset | "Average temperature of CNC Machine 01" |
| Line | "Average temperature of Production Line 1" |
| Building | "Total energy consumption of Building A" |
| Plant | "OEE of Plant Bengaluru" |

---

## Derived Parameters (KPIs)

Derived parameters are computed metrics that transform raw device telemetry into actionable industrial KPIs. They are defined at the asset level and computed automatically.

### Operational KPIs

| KPI | Formula / Description | Unit |
|---|---|---|
| **Utilization** | Active production time / Total available time | % |
| **Availability** | (Planned time − Downtime) / Planned time | % |
| **Load Factor** | Actual output / Maximum rated capacity | % |
| **Performance** | (Ideal cycle time × Total count) / Operating time | % |
| **OEE** | Availability × Performance × Quality | % |
| **Throughput** | Units produced / Time period | units/hr |
| **Yield** | Good units / Total units started | % |
| **Cycle Time** | Total operating time / Units produced | seconds |

#### OEE Computation

```
        Raw Telemetry
             │
             ▼
  ┌──────────────────────┐
  │  Machine Runtime      │ ──► Availability
  │  Machine Downtime     │
  │  Planned Stops        │
  ├──────────────────────┤
  │  Actual Output        │ ──► Performance
  │  Ideal Cycle Time     │
  │  Operating Time       │
  ├──────────────────────┤
  │  Good Units           │ ──► Quality
  │  Total Units          │
  │  Defect Count         │
  └──────────────────────┘
             │
             ▼
  OEE = Availability × Performance × Quality

  Example:
  Availability = 90%
  Performance  = 85%
  Quality      = 98%
  OEE          = 0.90 × 0.85 × 0.98 = 74.97%
```

### Reliability KPIs

| KPI | Formula / Description | Unit |
|---|---|---|
| **RUL** | Remaining Useful Life — predicted time to next failure | days / hours |
| **MTBF** | Total operating time / Number of failures | hours |
| **MTTR** | Total repair time / Number of repairs | hours |
| **Health** | Composite score from sensor readings and AI models | 0–100 |
| **Condition Index** | Weighted assessment of current sensor values vs. thresholds | 0–100 |
| **Failure Probability** | ML-predicted likelihood of failure within time window | % |

#### Reliability Flow

```
Machine Telemetry
       │
       ▼
Historical Failure Patterns
       │
       ▼
Reliability Model
       │
       ├──► RUL: Motor Bearing — 42 days remaining
       ├──► MTBF: 720 hours (30 days)
       ├──► MTTR: 4.5 hours average
       └──► Health: 78/100
       │
       ▼
Maintenance Decision
       │
       ├── Schedule preventive maintenance
       ├── Order replacement parts
       └── Adjust production schedule
```

### Energy KPIs

| KPI | Formula / Description | Unit |
|---|---|---|
| **Consumption** | Total energy consumed over period | kWh |
| **Intensity** | Energy consumed / Units produced | kWh/unit |
| **Carbon** | Consumption × Grid emission factor | kg CO₂ |
| **Peak Demand** | Maximum instantaneous power draw | kW |

### Quality KPIs

| KPI | Formula / Description | Unit |
|---|---|---|
| **Defect Rate** | Defective units / Total units × 100 | % |

---

## Asset Configuration Workflow

```
Create Asset
      │
      ▼
Assign Name, Location, Type
      │
      ▼
Attach Devices (1 or more)
      │
      ▼
Define Grouping Parameters
      │
      ▼
Configure Derived Parameters (KPIs)
      │
      ▼
Asset begins computing KPIs from device telemetry
      │
      ▼
KPIs available in Dashboards, Analytics, Rules
```

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Hierarchy depth** | Keep to 4–5 levels maximum for usability |
| **Naming convention** | Use consistent naming: `{Type}-{Location}-{ID}` (e.g., `CNC-B1L1-03`) |
| **Device mapping** | Attach all relevant sensors to the asset for complete KPI computation |
| **KPI selection** | Start with Availability, Performance, and OEE; add reliability KPIs as data matures |
| **Grouping** | Define grouping parameters that align with how your organization reports |
| **Baseline** | Establish KPI baselines before setting alert thresholds |
