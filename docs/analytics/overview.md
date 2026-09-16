# Analytics & KPIs

> Quarkifi Stream provides a configurable time-series analytics interface for monitoring device telemetry, computing industrial KPIs, and generating operational insights. This document covers the analytics framework, time-range selection, metric categories, and dashboard integration.

---

## Overview

The Analytics module transforms raw device telemetry into actionable intelligence. It operates at multiple levels:

```
Device Level ──► Asset Level ──► Line Level ──► Plant Level
```

Each level provides progressively aggregated views, from individual sensor readings to organization-wide KPIs.

---

## Analytics Workflow

```
Select Device / Asset / Group
         │
         ▼
Select Time Range
         │
         ▼
Retrieve Telemetry (from Time-Series DB)
         │
         ▼
Compute Metrics & KPIs
         │
         ▼
Render Visualizations
         │
         ▼
Export / Share / Embed in Dashboard
```

---

## Time Range Selection

The analytics interface provides both predefined and custom time ranges:

### Predefined Ranges

| Range | Description |
|---|---|
| **Now** | Live, real-time data stream |
| **Past One Hour** | Last 60 minutes |
| **Today** | Midnight to current time |
| **Yesterday** | Previous full day |
| **This Week** | Monday to current day |
| **This Month** | 1st of month to current day |

### Custom Range

| Parameter | Format |
|---|---|
| **Start Time** | Date + Time picker (ISO 8601) |
| **End Time** | Date + Time picker (ISO 8601) |

---

## Metric Categories

### Operational Metrics

Measure production efficiency and equipment utilization.

| Metric | Description | Calculation |
|---|---|---|
| **OEE** | Overall Equipment Effectiveness | Availability × Performance × Quality |
| **Availability** | Equipment uptime ratio | (Planned Time − Downtime) / Planned Time |
| **Performance** | Speed efficiency | (Ideal Cycle Time × Total Count) / Operating Time |
| **Utilization** | Active production ratio | Active Time / Total Available Time |
| **Throughput** | Production rate | Units Produced / Time Period |
| **Cycle Time** | Per-unit production time | Operating Time / Units Produced |
| **Yield** | Good output ratio | Good Units / Total Units Started |

### Reliability Metrics

Assess equipment health and predict maintenance needs.

| Metric | Description | Calculation |
|---|---|---|
| **RUL** | Remaining Useful Life | AI/ML prediction from sensor trends |
| **MTBF** | Mean Time Between Failures | Total Operating Time / Number of Failures |
| **MTTR** | Mean Time To Repair | Total Repair Time / Number of Repairs |
| **Health Score** | Composite condition assessment | Weighted sensor readings (0–100) |
| **Condition Index** | Current vs. threshold comparison | Sensor values vs. normal ranges |
| **Failure Probability** | Predicted failure likelihood | ML model output (0–100%) |

### Energy Metrics

Monitor and optimize energy consumption.

| Metric | Description | Unit |
|---|---|---|
| **Consumption** | Total energy used | kWh |
| **Intensity** | Energy per unit of output | kWh/unit |
| **Carbon Footprint** | CO₂ equivalent | kg CO₂ |
| **Peak Demand** | Maximum instantaneous draw | kW |
| **Cost** | Energy expenditure | Currency/period |

### Quality Metrics

Track product quality and defect rates.

| Metric | Description | Calculation |
|---|---|---|
| **Defect Rate** | Proportion of defective output | Defective Units / Total Units × 100 |
| **First Pass Yield** | Units passing QC on first attempt | First Pass Good / Total Inspected |
| **Scrap Rate** | Material wasted | Scrapped Material / Total Material |

---

## Visualization Types

The analytics module supports multiple visualization formats:

| Visualization | Use Case |
|---|---|
| **Line Chart** | Time-series trends (temperature over time) |
| **Bar Chart** | Comparative analysis (OEE by production line) |
| **Gauge** | Real-time single-value display (current temperature) |
| **Heatmap** | Multi-device overview (all sensors color-coded by value) |
| **Table** | Detailed tabular data with sorting and filtering |
| **Map** | Geospatial visualization for navigation/fleet models |
| **Scatter Plot** | Correlation analysis between two variables |
| **Histogram** | Distribution analysis (cycle time distribution) |

---

## Layout Management

The analytics view supports configurable layouts:

- **Add / remove widgets** — drag widgets onto the analytics canvas
- **Resize widgets** — adjust width and height of each visualization
- **Reorder widgets** — drag to rearrange the layout
- **Save layouts** — persist custom analytics views for reuse
- **Share layouts** — share configurations across team members

---

## Analytics Use Cases

### 1. Machine Health Monitoring

```
Select: CNC Machine 01
Time: Past 24 Hours
Metrics: Temperature, Vibration RMS, Health Score
Visualization: Line charts (temp, vibration), Gauge (health)
Alert: Health Score < 60 → Maintenance notification
```

### 2. Production Shift Comparison

```
Select: Production Line 1
Time: This Week (grouped by shift)
Metrics: OEE, Throughput, Defect Rate
Visualization: Bar chart (OEE by shift), Table (detailed)
Insight: Night shift OEE 12% lower than day shift
```

### 3. Energy Optimization

```
Select: Plant Bengaluru (all assets)
Time: This Month
Metrics: Consumption, Peak Demand, Intensity
Visualization: Line chart (daily consumption), Bar chart (by building)
Action: Building B peak demand exceeds contract limit
```

### 4. Predictive Maintenance

```
Select: Motor Bearing Sensor
Time: Past 90 Days
Metrics: Vibration trend, RUL, Failure Probability
Visualization: Trend line with RUL overlay
Decision: Schedule bearing replacement in 15 days
```

---

## Data Export

Analytics data can be exported for external use:

| Format | Description |
|---|---|
| **CSV** | Comma-separated values for spreadsheet analysis |
| **JSON** | Structured data for programmatic consumption |
| **PDF** | Formatted report for management review |
| **API** | REST API for integration with BI tools |

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Start with OEE** | OEE is the most impactful single metric for manufacturing |
| **Baseline first** | Collect 2–4 weeks of data before setting thresholds |
| **Layer metrics** | Start with operational, then add reliability and energy |
| **Compare periods** | Use time-range comparison to identify trends and regressions |
| **Dashboard integration** | Pin key analytics to operational dashboards |
| **Alert on KPIs** | Connect analytics thresholds to the Rule Engine for automation |
