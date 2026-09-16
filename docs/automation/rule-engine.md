# Rule Engine & Automation

> The Rule Engine is Quarkifi Stream's visual automation system. It enables users to define conditional logic that monitors device telemetry, evaluates conditions, applies time-based constraints, and triggers actions — all without writing code. This document covers rule architecture, the flow editor, conditions, timers, actions, and real-world automation patterns.

---

## Overview

The Rule Engine transforms Quarkifi Stream from a monitoring platform into an **automation platform**. Rules follow a simple directed flow:

```
START ──► CONDITION ──► TIMER (optional) ──► ACTION
```

Rules are created using a visual **Flow Editor** that allows drag-and-drop construction of automation logic.

---

## Rule Architecture

```
┌──────────────────────────────────────────────────┐
│                    RULE ENGINE                    │
│                                                  │
│  Telemetry Stream ──► Condition Evaluator         │
│                           │                      │
│                     ┌─────┴──────┐               │
│                     ▼            ▼               │
│                   TRUE         FALSE             │
│                     │                            │
│                     ▼                            │
│              Timer / Debounce                    │
│                     │                            │
│                     ▼                            │
│              Action Dispatcher                   │
│                     │                            │
│         ┌───────────┼───────────┐               │
│         ▼           ▼           ▼               │
│      Alarm      Command     Webhook             │
│      Email      Pipeline    Custom              │
│      SMS        Dashboard   Integration         │
│      WhatsApp                                   │
└──────────────────────────────────────────────────┘
```

---

## Flow Editor

The visual Flow Editor provides a canvas where rules are constructed from four building blocks:

### 1. START — Rule Configuration

Every rule begins with a START node that defines:

| Parameter | Description |
|---|---|
| **Rule Name** | Descriptive name for the rule |
| **Rule Scope** | Device, Asset, or Device Group this rule applies to |
| **Device** | Specific device or asset to monitor |
| **Enabled** | Whether the rule is active |

### 2. Condition

Conditions evaluate telemetry values against thresholds:

| Operator | Example |
|---|---|
| `>` Greater than | `temperature > 80` |
| `<` Less than | `battery < 20` |
| `>=` Greater or equal | `vibration >= 0.05` |
| `<=` Less or equal | `humidity <= 30` |
| `==` Equal | `status == "error"` |
| `!=` Not equal | `power != 0` |
| `BETWEEN` | `temperature BETWEEN 60 AND 80` |

#### Compound Conditions

Multiple conditions can be combined:

```
IF temperature > 85
AND vibration > 0.05
AND humidity < 20
```

```
IF status == "error"
OR health_score < 30
```

### 3. Timer Action

Timers introduce time-based constraints:

| Timer Type | Description | Example |
|---|---|---|
| **Delay** | Wait before triggering action | Wait 30 seconds |
| **Debounce** | Condition must persist for duration | Temperature > 80 for 5 minutes |
| **Interval** | Repeat action periodically | Check every 10 minutes |
| **Schedule** | Trigger at specific times | Run at 06:00 daily |

Timers prevent false alarms from transient spikes:

```
Temperature > 85°C
       │
       ▼
Must persist for 5 minutes (debounce)
       │
       ▼ (still true after 5 min)
Trigger action
```

### 4. Action

Actions are the responses triggered when conditions are met:

| Action Type | Description |
|---|---|
| **Create Alarm** | Generate a platform alarm with severity level |
| **Send Email** | Notification to specified recipients |
| **Send SMS** | Text message alert |
| **Send WhatsApp** | WhatsApp message notification |
| **Device Command** | Send command to a device (ON/OFF, speed change, etc.) |
| **HTTP Webhook** | POST to an external URL |
| **Trigger Pipeline** | Activate a data pipeline |
| **Log Event** | Write to event log |
| **Dashboard Alert** | Display visual alert on dashboard |

---

## Rule Examples

### 1. Temperature Overheating Alert

```
START
  │  Scope: CNC Machine 01
  ▼
CONDITION
  │  temperature > 85°C
  ▼
TIMER
  │  Debounce: 30 seconds
  ▼
ACTION
  ├── Create Alarm (severity: CRITICAL)
  ├── Send Email → maintenance@company.com
  └── Send WhatsApp → Plant Manager
```

### 2. Motor Auto-Shutdown

```
START
  │  Scope: Motor Controller
  ▼
CONDITION
  │  temperature > 90°C
  │  AND vibration > 0.1 mm/s
  ▼
TIMER
  │  Debounce: 60 seconds
  ▼
ACTION
  ├── Create Alarm (severity: CRITICAL)
  ├── Device Command → Motor = STOP
  ├── Send SMS → Operator
  └── Log Event → "Emergency motor shutdown"
```

### 3. Low Battery Warning

```
START
  │  Scope: All Battery-Powered Sensors (group)
  ▼
CONDITION
  │  battery < 20%
  ▼
ACTION
  ├── Create Alarm (severity: WARNING)
  └── Send Email → iot-admin@company.com
```

### 4. Scheduled Production Report

```
START
  │  Scope: Production Line 1
  ▼
TIMER
  │  Schedule: Every day at 18:00
  ▼
ACTION
  ├── Trigger Pipeline → daily-production-export
  └── Send Email → production-manager@company.com
```

### 5. Multi-Stage Safety Rule

```
START
  │  Scope: Factory Floor (asset group)
  ▼
CONDITION
  │  gas_level > 500 ppm
  │  AND zone == "confined_space"
  ▼
TIMER
  │  Debounce: 10 seconds
  ▼
ACTION (Stage 1)
  │  Create Alarm (severity: CRITICAL)
  │  Activate ventilation system → Ventilation = ON
  ▼
TIMER
  │  Delay: 2 minutes
  ▼
CONDITION
  │  gas_level still > 500 ppm
  ▼
ACTION (Stage 2)
  │  Trigger evacuation alert
  │  Send SMS → Safety Officer
  │  HTTP Webhook → Emergency Response System
```

---

## Rule Lifecycle

```
Draft ──► Active ──► Triggered ──► Action Executed
  │                                       │
  │                                       ▼
  │                               Execution History
  ▼
Disabled
```

| State | Description |
|---|---|
| **Draft** | Rule is being edited, not yet active |
| **Active** | Rule is monitoring telemetry and evaluating conditions |
| **Triggered** | Condition evaluated to true, action is being executed |
| **Disabled** | Rule exists but is not evaluating |

---

## Execution History

Each rule maintains an execution log:

| Field | Description |
|---|---|
| **Timestamp** | When the rule was triggered |
| **Condition Values** | Actual telemetry values at trigger time |
| **Actions Executed** | Which actions were performed |
| **Result** | Success, failure, or partial |
| **Duration** | Time from trigger to action completion |

---

## Alarm Severity Levels

| Level | Color | Use Case |
|---|---|---|
| **INFO** | Blue | Informational event, no action required |
| **WARNING** | Yellow | Attention needed, non-critical |
| **CRITICAL** | Red | Immediate action required |
| **EMERGENCY** | Red (flashing) | Safety-critical, automatic response triggered |

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Use debounce** | Always add a timer to prevent false alarms from transient spikes |
| **Start conservative** | Set thresholds wider initially, then tighten based on data |
| **Layer severity** | Use WARNING before CRITICAL to give operators lead time |
| **Test rules** | Test with known telemetry data before enabling in production |
| **Document rules** | Use descriptive names: `motor-overtemp-shutdown`, not `rule-1` |
| **Review history** | Periodically review execution history for false positives |
| **Limit actions** | Don't send SMS for every minor alert — reserve for critical events |
| **Combine rules** | Use multi-stage rules for escalation workflows |
