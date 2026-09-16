# Lansub Stream — Frontend Dashboard

Real-time operator interface and Industrial IoT digital twin dashboard built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🖥 Application Modules

The frontend includes dedicated views for monitoring and managing the industrial platform:

- **Digital Twins (`/twins`)**: Interactive twin state visualization and real-time sensor overlays.
- **Devices (`/devices`)**: Device provisioning, status tracking, and MQTT key management.
- **Analytics (`/analytics`)**: Historical trends and live streaming telemetry charts.
- **Alarms (`/alarms`)**: Threshold alerts, incident triage, and acknowledgment workflows.
- **Rules (`/rules`)**: Automation rule configurations and condition builders.
- **Pipelines (`/pipelines`)**: Data processing workflows and ingestion pipeline monitors.
- **Computer Vision & CCTV (`/cctv`, `/vision`)**: Camera feeds and edge AI vision metrics.
- **AI / Anomaly Detection (`/ai`)**: Machine learning telemetry inference and anomaly logs.
- **Edge Nodes (`/edge`)**: Distributed gateway health and edge deployment statuses.
- **Templates & Assets (`/templates`, `/assets`)**: Device templates and asset hierarchy trees.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```
