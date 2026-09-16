# AI & Computer Vision

> Quarkifi Stream integrates AI-driven analytics across three domains: predictive modeling, anomaly detection, and computer vision. This document covers AI capabilities, model management, video analytics features, and deployment patterns.

---

## AI Architecture

```
                    AI ENGINE
                       │
         ┌─────────────┼──────────────┐
         ▼             ▼              ▼
    PREDICTION    ANOMALY         COMPUTER
                  DETECTION       VISION
         │             │              │
         ▼             ▼              ▼
    Forecast      Alert on         Detect objects,
    failures,     unusual           people, PPE,
    trends,       patterns          vehicles,
    RUL           in telemetry      zones
```

---

## 1. Predictive Analytics

Predictive models analyze historical telemetry to forecast future behavior.

### Use Cases

| Use Case | Input Data | Prediction |
|---|---|---|
| **Remaining Useful Life** | Vibration, temperature trends | Days/hours until failure |
| **Demand Forecasting** | Production history, orders | Expected output requirements |
| **Energy Prediction** | Consumption patterns, schedules | Future energy demand |
| **Quality Prediction** | Process parameters | Defect probability for current batch |

### Prediction Flow

```
Historical Telemetry (90+ days)
         │
         ▼
Feature Engineering
         │
         ├── Rolling averages
         ├── Rate of change
         ├── Statistical features
         └── Time-based features
         │
         ▼
Model Training
         │
         ├── Regression (RUL prediction)
         ├── Classification (failure type)
         └── Time-series forecasting
         │
         ▼
Inference (real-time telemetry)
         │
         ▼
Prediction Output
         │
         ├──► Dashboard (RUL gauge, trend overlay)
         ├──► Rule Engine (trigger maintenance alert)
         └──► Data Pipeline (export to ERP/CMMS)
```

### Example: Motor Bearing RUL

```
Inputs:
  - vibration_rms (90-day history)
  - temperature (90-day history)
  - operating_hours (cumulative)
  - load_factor (average)

Model: Survival regression

Output:
  - RUL: 42 days ± 5 days
  - Confidence: 87%
  - Recommended action: Schedule replacement in 30 days
```

---

## 2. Anomaly Detection

Anomaly detection identifies unusual patterns in device telemetry that deviate from learned normal behavior.

### Detection Methods

| Method | Description | Best For |
|---|---|---|
| **Statistical** | Z-score, IQR-based detection | Simple, single-variable anomalies |
| **Clustering** | DBSCAN, Isolation Forest | Multi-variable anomalies |
| **Deep Learning** | Autoencoder reconstruction error | Complex, temporal anomalies |
| **Rule Hybrid** | ML detection + rule confirmation | Reducing false positives |

### Anomaly Detection Flow

```
Normal Operation
  │
  │  Learn baseline behavior
  ▼
Baseline Model
  │
  │  Monitor incoming telemetry
  ▼
Real-Time Scoring
  │
  ├── Score within normal range ──► Continue monitoring
  │
  └── Score exceeds threshold ──► ANOMALY DETECTED
                                        │
                                        ▼
                                  ┌──────────────┐
                                  │  Alert        │
                                  │  Log event    │
                                  │  Trigger rule │
                                  │  Dashboard    │
                                  └──────────────┘
```

### Example: Compressor Anomaly

```
Normal behavior:
  - Temperature: 45–55°C
  - Vibration: 0.01–0.03 mm/s
  - Power: 3.2–3.8 kW

Anomaly detected:
  - Temperature: 52°C (normal)
  - Vibration: 0.02 mm/s (normal)
  - Power: 5.1 kW (ANOMALY — 34% above baseline)

  Individual readings appear normal, but the power-to-vibration
  ratio is abnormal → potential bearing degradation or
  mechanical resistance increase
```

This demonstrates the value of multivariate anomaly detection over simple threshold-based alerting.

---

## 3. Computer Vision

Quarkifi Stream manages CCTV and video streams for AI-powered visual analytics. The video analytics subsystem covers three phases:

```
Camera Management ──► AI Model Configuration ──► Analytics & Alerts
```

### Camera Management

| Capability | Description |
|---|---|
| **CCTV Registration** | Register IP cameras, RTSP streams |
| **Live Feed Monitoring** | View real-time camera feeds in the platform |
| **Multi-Camera Support** | Manage multiple cameras per site |
| **Stream Health** | Monitor camera connectivity and frame rates |

### AI Detection Models

| Model Type | Detects | Example Use Case |
|---|---|---|
| **People Counting** | Number of people in frame | Occupancy monitoring, crowd management |
| **PPE Detection** | Helmets, vests, goggles | Safety compliance in factories |
| **Vehicle Analytics** | Vehicle count, type, speed | Parking, logistics, traffic |
| **Object Detection** | Custom objects | Equipment, products, tools |
| **Zone Detection** | Presence in restricted areas | Safety zone enforcement |
| **Anomaly Detection** | Unusual visual patterns | Spill detection, equipment tampering |

### Video Analytics Architecture

```
Camera
  │
  │  RTSP / HTTP stream
  ▼
Video Ingestion
  │
  ▼
Frame Extraction
  │
  ▼
AI Model Inference
  │
  ├── Person count: 12
  ├── Helmet: 10 detected, 2 missing
  ├── Restricted zone: 1 violation
  └── Anomaly: none
  │
  ▼
CCTV Device Template
  │
  ├── person_count: 12
  ├── helmet_detected: true
  ├── helmet_missing: 2
  ├── restricted_zone: true
  └── anomaly: false
  │
  ▼
Platform (same as any device telemetry)
  │
  ├──► Dashboard (live counts, violation alerts)
  ├──► Rule Engine (IF helmet_missing > 0 → Alert)
  ├──► Analytics (hourly zone violation trends)
  └──► Data Pipeline (export to safety system)
```

### Zone-Based Alerts

Define virtual zones on camera views and trigger alerts when violations occur:

```
Camera View
┌──────────────────────────────────┐
│                                  │
│    ┌─────────────┐               │
│    │ RESTRICTED  │    Safe Area  │
│    │    ZONE     │               │
│    │     ⚠️      │               │
│    └─────────────┘               │
│                                  │
│              ┌──────────┐        │
│              │ LOADING  │        │
│              │  DOCK    │        │
│              └──────────┘        │
└──────────────────────────────────┘

Rules:
  - Person in RESTRICTED ZONE → Immediate alarm
  - Vehicle in LOADING DOCK for > 30 min → Alert logistics
  - Person count in any zone > 50 → Overcrowding warning
```

---

## Model Management

### Model Lifecycle

```
Define Objective
      │
      ▼
Collect Training Data
      │
      ▼
Train / Generate Model
      │
      ▼
Validate (accuracy, precision, recall)
      │
      ▼
Deploy (cloud or edge)
      │
      ▼
Monitor Performance
      │
      ▼
Retrain (as needed)
```

### Cloud vs. Edge Deployment

| Deployment | Pros | Cons |
|---|---|---|
| **Cloud** | Unlimited compute, easy updates | Latency, bandwidth, connectivity dependency |
| **Edge** | Low latency, works offline, data stays local | Limited compute, harder to update |

For video analytics, **edge deployment** is strongly recommended due to:
- High bandwidth requirements of video streams
- Low-latency requirements for safety-critical detection
- Privacy concerns with streaming video to the cloud

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Data quality** | AI models are only as good as input data — ensure clean, complete telemetry |
| **Baseline period** | Collect 30–90 days of normal operation data before training |
| **False positives** | Tune thresholds to balance sensitivity vs. alert fatigue |
| **Edge for video** | Deploy computer vision models at the edge whenever possible |
| **Retrain schedule** | Retrain models quarterly or when equipment/process changes occur |
| **Human review** | AI predictions should inform decisions, not replace human judgment |
| **Model versioning** | Track model versions and maintain rollback capability |
