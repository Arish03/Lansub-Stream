# Edge Computing

> Quarkifi Stream supports edge computing through K3s-based container orchestration on local gateways. This document covers the edge architecture, deployment model, lifecycle management, and use cases for processing data locally rather than in the cloud.

---

## Overview

Edge computing moves processing closer to the data source. Instead of sending all raw telemetry to the cloud, an edge gateway processes, filters, and acts on data locally — sending only relevant results upstream.

```
             CLOUD
     ┌────────────────────┐
     │  Quarkifi Stream   │
     │                    │
     │  ┌── Dashboard     │
     │  ├── Analytics     │
     │  ├── AI Management │
     │  ├── Device Mgmt   │
     │  └── Orchestrator  │◄─── Manages edge
     └──────────┬─────────┘
                │
          Internet / VPN
                │
                ▼
          EDGE GATEWAY
     ┌────────────────────┐
     │  K3s Runtime       │
     │                    │
     │  ┌── AI Models     │
     │  ├── Rules Engine  │
     │  ├── Local Storage │
     │  ├── Video Proc.   │
     │  └── Custom Apps   │
     └──────────┬─────────┘
                │
        Local Industrial LAN
                │
       ┌────────┼──────────┐
       ▼        ▼          ▼
     PLC     Sensors    Cameras
```

---

## Why Edge Computing?

| Challenge | Cloud-Only Approach | Edge Approach |
|---|---|---|
| **Latency** | 50–500ms round trip | < 10ms local processing |
| **Bandwidth** | All raw data traverses WAN | Only aggregated/filtered data sent |
| **Availability** | Offline = no processing | Local processing continues offline |
| **Data Privacy** | Sensitive data crosses network boundaries | Data stays within facility |
| **Video Processing** | Streaming raw video to cloud is impractical | Local inference on video frames |
| **Cost** | High cloud compute and bandwidth costs | One-time gateway hardware cost |

---

## Edge Architecture

### Quarkifi Orchestrator

The **Quarkifi Orchestrator** is the cloud-side management plane for edge deployments. It provides:

| Capability | Description |
|---|---|
| **Provisioning** | Register and configure edge gateways |
| **Deployment** | Push containerized applications to edge nodes |
| **Monitoring** | Track gateway health, resource usage, and connectivity |
| **Lifecycle Management** | Start, stop, update, rollback, and decommission containers |
| **Scaling** | Replicate applications across multiple edge nodes |
| **OTA Updates** | Remote firmware and application updates |

### K3s Runtime

Each edge gateway runs **K3s**, a lightweight Kubernetes distribution optimized for edge and IoT deployments. K3s provides:

- Container orchestration
- Service discovery
- Health monitoring and auto-restart
- Resource management (CPU, memory, GPU)
- Persistent storage management
- Network policy enforcement

### Container Model

```
Edge Gateway (K3s)
       │
       ├── Container: AI Inference
       │    └── TensorFlow/PyTorch model
       │
       ├── Container: Video Analytics
       │    └── Object detection pipeline
       │
       ├── Container: Rule Engine
       │    └── Local condition evaluation
       │
       ├── Container: Data Buffer
       │    └── Store-and-forward for connectivity gaps
       │
       └── Container: Custom Application
            └── Site-specific processing logic
```

---

## Deployment Workflow

### 1. Register Edge Gateway

```
Quarkifi Console
       │
       ▼
Add Edge Gateway
       │
       ├── Gateway Name
       ├── Location
       ├── Hardware Specs (CPU, RAM, GPU, Storage)
       └── Network Configuration
       │
       ▼
Gateway appears in Orchestrator
```

### 2. Deploy Application

```
Select Application
       │
       ├── Pre-built (AI model, analytics agent)
       └── Custom (Docker container image)
       │
       ▼
Configure
       │
       ├── Resource limits (CPU, memory)
       ├── Environment variables
       ├── Network ports
       └── Persistent volumes
       │
       ▼
Deploy to Gateway
       │
       ▼
Container starts on edge K3s
```

### 3. Manage Lifecycle

| Action | Description |
|---|---|
| **Start** | Launch a stopped container |
| **Stop** | Gracefully stop a running container |
| **Restart** | Stop and re-start |
| **Update** | Deploy new version with rolling update |
| **Rollback** | Revert to previous version |
| **Scale** | Increase/decrease replicas |
| **Delete** | Remove application from gateway |
| **Logs** | View container stdout/stderr |
| **Shell** | Open remote terminal into container |

---

## Edge Use Cases

### 1. Local AI Inference

Run AI models on the edge for low-latency predictions without cloud dependency.

```
Sensor Data ──► Edge AI Model ──► Prediction
                                      │
                    ┌─────────────────┤
                    ▼                 ▼
              Local Action       Upload to Cloud
              (alarm, command)   (for analytics)
```

### 2. Video Analytics at the Edge

Process camera feeds locally — never send raw video to the cloud.

```
Camera (RTSP) ──► Edge Video Pipeline ──► Detection Results
                                               │
                         ┌─────────────────────┤
                         ▼                     ▼
                   Local Alert            Counts/Events
                   (safety violation)     uploaded to Cloud
```

### 3. Store-and-Forward

Buffer telemetry locally during connectivity outages, then sync when connection is restored.

```
Normal:    Device ──► Edge Buffer ──► Cloud (real-time)

Offline:   Device ──► Edge Buffer (store locally)
                          │
                          │ ... connectivity restored ...
                          │
                          └──► Cloud (bulk upload)
```

### 4. Data Aggregation

Reduce bandwidth by aggregating raw telemetry at the edge.

```
100 sensors × 1 msg/sec = 100 msgs/sec to cloud

With edge aggregation:
100 sensors ──► Edge ──► 1 aggregated msg/min to cloud
                         (avg, min, max, count)
```

### 5. Local Rule Execution

Execute time-critical rules locally without cloud round-trip.

```
Temperature > 90°C ──► Edge Rule ──► Motor = STOP
                                      │
                          Response time: < 10ms
                          (vs. 200ms+ via cloud)
```

---

## Hardware Requirements

### Minimum Edge Gateway Specs

| Component | Minimum | Recommended |
|---|---|---|
| **CPU** | 2 cores (ARM64 or x86_64) | 4+ cores |
| **RAM** | 2 GB | 8+ GB |
| **Storage** | 32 GB SSD | 128+ GB SSD |
| **GPU** | Not required (for non-vision) | NVIDIA Jetson / Intel NCS (for vision) |
| **Network** | Ethernet (1 Gbps) | Ethernet + WiFi |
| **OS** | Linux (Ubuntu 20.04+, Debian 11+) | Ubuntu 22.04 LTS |

### Supported Hardware

| Platform | Use Case |
|---|---|
| **Raspberry Pi 4/5** | Light edge processing, prototyping |
| **NVIDIA Jetson Nano/Orin** | AI inference, video analytics |
| **Intel NUC** | General-purpose edge computing |
| **Industrial PCs** | Ruggedized factory deployment |
| **Custom Linux Gateway** | Any ARM64/x86_64 Linux system |

---

## Edge Security

| Concern | Mitigation |
|---|---|
| **Communication** | TLS encryption for all cloud-edge communication |
| **Authentication** | Mutual TLS or token-based gateway authentication |
| **Container Isolation** | K3s namespace and network policy isolation |
| **Updates** | Signed container images, verified OTA updates |
| **Physical** | Hardware tamper detection, encrypted storage |
| **Access** | Role-based access to edge management functions |

---

## Best Practices

| Practice | Guidance |
|---|---|
| **Edge-first for latency** | If response time matters (< 100ms), process at the edge |
| **Edge-first for video** | Never stream raw video to the cloud — process locally |
| **Store-and-forward** | Always buffer telemetry locally for connectivity resilience |
| **Resource limits** | Set CPU/memory limits on containers to prevent resource exhaustion |
| **Monitoring** | Monitor gateway health (CPU, memory, disk, temperature) from the cloud |
| **Updates** | Use rolling updates with automatic rollback on failure |
| **Testing** | Test edge applications in a staging environment before production |
