# Glossary

> Terminology reference for Quarkifi Stream and Industrial IoT concepts.

---

## Platform Terms

| Term | Definition |
|---|---|
| **Quarkifi Stream** | Zero-code Industrial IoT and edge-computing platform by Quarkifi Technologies |
| **Project** | Top-level organizational container providing tenant isolation for all resources |
| **Device Template** | Schema definition that describes the data structure and capabilities of a device type |
| **Device Instance** | A physical or logical device registered against a Device Template |
| **Digital Twin** | The platform's virtual representation of a physical device, maintaining latest state and metadata |
| **Asset** | A business-level entity (machine, line, facility) that aggregates data from one or more devices |
| **Grouping Parameter** | A dimension used to aggregate devices or assets for analytics (location, line, type) |
| **Derived Parameter** | A computed KPI calculated from raw device telemetry (OEE, MTBF, etc.) |
| **Data Pipeline** | A configurable flow that transforms, filters, and routes telemetry to external systems |
| **Rule** | A conditional automation definition: condition → timer → action |
| **Alarm** | A platform-generated alert when a rule condition is triggered |
| **Dashboard** | A configurable visualization surface composed of widgets displaying real-time and historical data |
| **Workflow** | A multi-step business process automation |
| **Form** | An operational data collection interface for manual input |

---

## Connectivity Terms

| Term | Definition |
|---|---|
| **MQTT** | Message Queuing Telemetry Transport — lightweight publish/subscribe messaging protocol for IoT |
| **MQTT Broker** | Server that receives, routes, and delivers MQTT messages between publishers and subscribers |
| **Upstream** | Data flow direction from device to platform (telemetry) |
| **Downstream** | Data flow direction from platform to device (commands) |
| **Topic** | MQTT message channel that publishers and subscribers use to exchange messages |
| **QoS** | Quality of Service — MQTT delivery guarantee level (0, 1, or 2) |
| **TLS** | Transport Layer Security — encryption protocol for securing network communication |
| **WebSocket** | Full-duplex communication protocol over a single TCP connection |
| **OTA** | Over-The-Air — remote firmware or software update delivery |

---

## Industrial / Manufacturing Terms

| Term | Definition |
|---|---|
| **OEE** | Overall Equipment Effectiveness — composite metric: Availability × Performance × Quality |
| **Availability** | Percentage of planned production time that equipment is actually available |
| **Performance** | Ratio of actual production speed to ideal production speed |
| **Quality** | Ratio of good output to total output |
| **Utilization** | Percentage of total time that equipment is actively being used |
| **Throughput** | Rate of production output (units per time period) |
| **Yield** | Ratio of good finished product to total started material/units |
| **Cycle Time** | Time required to complete one production cycle |
| **Downtime** | Period when equipment is not operational (planned or unplanned) |
| **Takt Time** | Available production time divided by customer demand rate |

---

## Reliability Terms

| Term | Definition |
|---|---|
| **RUL** | Remaining Useful Life — predicted time until equipment failure |
| **MTBF** | Mean Time Between Failures — average operating time between consecutive failures |
| **MTTR** | Mean Time To Repair — average time required to restore equipment after failure |
| **Health Score** | Composite metric (0–100) reflecting overall equipment condition |
| **Condition Index** | Assessment of current equipment condition based on sensor readings vs. thresholds |
| **Failure Probability** | Statistical likelihood of equipment failure within a defined time window |
| **Predictive Maintenance** | Maintenance strategy based on equipment condition monitoring and failure prediction |
| **Preventive Maintenance** | Maintenance performed on a fixed schedule regardless of condition |
| **Corrective Maintenance** | Maintenance performed after a failure has occurred |

---

## Energy Terms

| Term | Definition |
|---|---|
| **Consumption** | Total energy used over a period (typically in kWh) |
| **Energy Intensity** | Energy consumed per unit of production output |
| **Carbon Footprint** | CO₂ equivalent of energy consumed, based on grid emission factor |
| **Peak Demand** | Maximum instantaneous power draw (in kW) |
| **Power Factor** | Ratio of real power to apparent power (0–1) |
| **Load Factor** | Ratio of average load to peak load over a period |

---

## AI / Machine Learning Terms

| Term | Definition |
|---|---|
| **Anomaly Detection** | Identification of data points or patterns that deviate significantly from expected behavior |
| **Prediction Model** | ML model that forecasts future values based on historical data |
| **Inference** | Running a trained model on new data to produce predictions |
| **Training** | Process of building a model from historical data |
| **Feature** | An input variable used by an ML model (e.g., rolling average of vibration) |
| **Computer Vision** | AI field focused on extracting information from images and video |
| **Object Detection** | Identifying and locating objects within an image or video frame |
| **PPE** | Personal Protective Equipment — helmets, vests, goggles, etc. |

---

## Edge Computing Terms

| Term | Definition |
|---|---|
| **Edge Computing** | Processing data near the source (device/gateway) rather than in a centralized cloud |
| **Edge Gateway** | Local hardware device that runs processing, rules, and AI at the edge |
| **K3s** | Lightweight Kubernetes distribution designed for edge and IoT deployments |
| **Container** | An isolated, portable runtime environment for applications (Docker-compatible) |
| **Orchestrator** | Cloud-side management plane for deploying and managing edge containers |
| **Store-and-Forward** | Buffering data locally during connectivity outages and syncing when connection is restored |

---

## Data Terms

| Term | Definition |
|---|---|
| **Telemetry** | Automated measurement data transmitted from devices to the platform |
| **Time-Series** | Data points indexed by time, typically from continuous sensor measurements |
| **Payload** | The data content of a message (typically JSON in Quarkifi Stream) |
| **MongoDB** | NoSQL document database used for telemetry storage |
| **MySQL** | Relational database used for structured/transactional data |
| **Kafka** | Distributed event streaming platform for real-time data pipelines |
| **SFTP** | Secure File Transfer Protocol for file-based data exchange |
| **ETL** | Extract, Transform, Load — process of moving data between systems |

---

## Device Types

| Term | Definition |
|---|---|
| **Sensor** | Device that measures physical quantities (temperature, humidity, vibration, etc.) |
| **Actuator** | Device that performs physical actions (motor, valve, relay, switch) |
| **PLC** | Programmable Logic Controller — industrial computer for automation |
| **CNC** | Computer Numerical Control — automated machining equipment |
| **CCTV** | Closed-Circuit Television — surveillance camera system |
| **Gateway** | Device that bridges local networks/protocols to the cloud platform |
| **ESP32** | Low-cost microcontroller with WiFi/Bluetooth for IoT applications |
| **Raspberry Pi** | Single-board computer commonly used as an IoT gateway or edge device |
