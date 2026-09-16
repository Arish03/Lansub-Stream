# Lansub Stream 🌊

> **High-Throughput Industrial IoT & Real-Time Digital Twin Platform**

Lansub Stream is an end-to-end Industrial IoT (IIoT) platform designed for high-frequency telemetry ingestion, real-time digital twin monitoring, and device telemetry visualization. Built with an asynchronous **FastAPI** backend, **PostgreSQL** storage, **Redis** Pub/Sub, and a real-time **Next.js 16** operator dashboard.

---

## 🏗 Architecture

```mermaid
flowchart TD
    subgraph Edge & Ingestion
        D1[IoT Devices / Sensors] -->|MQTT /device/upstream| MQ[MQTT Worker]
        SIM[Device Simulator] -->|POST /v1/telemetry| API
        MQ -->|Internal Ingestion| API[FastAPI Backend]
    end

    subgraph Data & Messaging
        API -->|JSONB Telemetry| PG[(PostgreSQL 16)]
        API -->|Publish telemetry:broadcast| RD[(Redis 7 Pub/Sub)]
    end

    subgraph Streaming & Client
        RD -->|Subscribe| WS[WebSocket Service /ws]
        WS -->|Real-Time Telemetry Stream| UI[Next.js 16 Dashboard]
        UI -->|REST API Requests| API
    end
```

---

## ✨ Features

- **Industrial Telemetry Ingestion**:
  - High-throughput asynchronous HTTP ingestion (`POST /v1/telemetry`).
  - MQTT broker integration with background subscriber (`backend/app/mqtt_worker.py`).
  - Sub-millisecond indexed time-series queries via PostgreSQL JSONB storage.
- **Real-Time Digital Twin & Pub/Sub**:
  - Redis 7 Pub/Sub channel (`lansub:telemetry:broadcast`) decouples ingestion from broadcast.
  - Asynchronous WebSockets (`/ws`) deliver live sensor metrics with low latency directly to operators.
- **Built-in Device Simulator**:
  - Generates realistic multi-sensor telemetry (temperature, vibration, humidity, battery level) automatically for rapid development and testing.
- **Modern Next.js 16 Operator Dashboard**:
  - Built with React 19, TypeScript, Tailwind CSS v4, and Lucide icons.
  - Dedicated operational views for **Digital Twins**, **Devices**, **Analytics**, **Alarms**, **Rules**, **Pipelines**, **Computer Vision / CCTV**, and **Edge Nodes**.
- **Enterprise Security**:
  - JWT token-based authentication with bcrypt password hashing.
  - Per-device authentication keys and granular access controls.

---

## 📁 Repository Structure

```
Lansub-Stream/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── config.py         # App configuration & CORS
│   │   ├── database.py       # Async SQLAlchemy session management
│   │   ├── models.py         # SQLAlchemy ORM models (Users, Devices, Telemetry)
│   │   ├── schemas.py        # Pydantic v2 schemas
│   │   ├── auth.py           # JWT & password hashing
│   │   ├── redis_client.py   # Redis Pub/Sub manager
│   │   ├── simulator.py      # Automated sensor simulator
│   │   ├── mqtt_worker.py    # MQTT background worker
│   │   └── routers/          # API routes (/health, /auth, /devices, /telemetry, /ws)
│   ├── main.py               # FastAPI entrypoint with async lifespan
│   ├── requirements.txt      # Python dependencies
│   ├── test_backend.py       # E2E integration test suite
│   └── .env.example          # Sample backend configuration
├── frontend/                 # Next.js 16 operator dashboard
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (twins, devices, analytics, etc.)
│   │   └── components/       # UI components (Sidebar, TopBar, KPI Cards, etc.)
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript configuration
├── docs/                     # Architecture & subsystem technical specifications
├── schema.sql                # PostgreSQL database initialization schema
└── .gitignore                # Root gitignore for Python, Node, & secrets
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.10+
- **Node.js**: 18+ (Node 20+ recommended)
- **PostgreSQL**: 16+ (or running via Docker)
- **Redis**: 7+ (or running via Docker)

---

### 1. Database & Infrastructure Setup

You can run Postgres and Redis locally or via Docker:

```bash
# Example Docker launch:
docker run -d --name lansub-postgres -p 5432:5432 -e POSTGRES_USER=lansub -e POSTGRES_PASSWORD=lansub -e POSTGRES_DB=lansub postgres:16
docker run -d --name lansub-redis -p 6379:6379 redis:7
```

Initialize the database schema:
```bash
psql -h localhost -U lansub -d lansub -f schema.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Update credentials in .env if needed

# Run FastAPI server
python main.py
```

The API will be available at `http://localhost:8000`.
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

#### Verify Backend
Run the automated end-to-end test suite:
```bash
python test_backend.py
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

The frontend dashboard will be available at `http://localhost:3000`.

---

## 🔒 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://lansub:lansub@localhost:5432/lansub` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `MQTT_BROKER_HOST` | MQTT broker host | `localhost` |
| `MQTT_BROKER_PORT` | MQTT broker port | `1883` |
| `JWT_SECRET` | Secret key for JWT signing | `lansub-stream-secure-dev-secret-key-2026` |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
