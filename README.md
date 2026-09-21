# Lansub Stream 🌊

> **High-Throughput Industrial IoT & Real-Time Digital Twin Platform**

Lansub Stream is an end-to-end Industrial IoT (IIoT) platform designed for high-frequency telemetry ingestion, real-time digital twin monitoring, and device telemetry visualization. Built with an asynchronous **FastAPI** backend, **PostgreSQL** storage, **Redis** Pub/Sub, and a real-time **Next.js 16** operator dashboard.

---

## 🏗 Architecture

```mermaid
flowchart TD
    subgraph Edge & Ingestion
        D1[IoT Devices / Sensors] -->|MQTT /device/upstream| MQ[Mosquitto MQTT Broker :1884]
        SIM[Device Simulator] -->|POST /v1/telemetry| API
        MQ -->|Internal Ingestion| API[FastAPI Backend :8501]
    end

    subgraph Data & Messaging
        API -->|JSONB Telemetry| PG[(PostgreSQL 16 :5433)]
        API -->|Publish telemetry:broadcast| RD[(Redis 7 Pub/Sub :6380)]
    end

    subgraph Streaming & Client
        RD -->|Subscribe| WS[WebSocket Service /ws]
        API -.->|Direct Broadcast Fallback| WS
        WS -->|Real-Time Telemetry Stream| UI[Next.js 16 Dashboard :8500]
        UI -->|REST API Requests| API
    end
```

---

## ✨ Key Features

- **Industrial Telemetry Ingestion**:
  - High-throughput asynchronous HTTP ingestion (`POST /v1/telemetry`).
  - Background MQTT worker (`backend/app/mqtt_worker.py`) ingesting from Mosquitto broker.
  - Sub-millisecond indexed time-series queries via PostgreSQL JSONB storage (`idx_telemetry_device_ts`).
- **Real-Time Digital Twin & Pub/Sub**:
  - Redis 7 Pub/Sub channel (`lansub:telemetry:broadcast`) decouples ingestion from broadcast.
  - Asynchronous WebSockets (`/ws`) deliver live sensor metrics with sub-second latency directly to operators.
- **Fail-Safe Device Simulator**:
  - Automatically generates realistic multi-sensor telemetry (temperature, humidity, vibration, spindle RPM, battery level).
  - Works out of the box even without external databases via direct in-memory WebSocket broadcasting and demo device fallbacks.
  - Standalone execution support (`python -m app.simulator`).
- **Modern Next.js 16 Operator Dashboard**:
  - Built with React 19, TypeScript, Tailwind CSS v4, and Lucide icons.
  - **Dark & Light Mode Switcher**: Integrated in the Top Navigation bar with `localStorage` persistence and zero-flicker hydration.
  - Dedicated operational views for **Digital Twins**, **Devices**, **Analytics**, **Alarms**, **Rules**, **Pipelines**, **CCTV / Vision**, and **Edge Nodes**.
- **Containerized & Non-Conflicting**:
  - Fully Dockerized stack with host port remapping (`8500`, `8501`, `5433`, `6380`, `1884`) to eliminate port conflicts with existing local services.

---

## 📁 Repository Structure

```
Lansub-Stream/
├── .env                      # Root Docker environment & port mapping configuration
├── docker-compose.yml        # Multi-container stack (Postgres, Redis, Mosquitto, Backend, Frontend)
├── schema.sql                # PostgreSQL database initialization schema
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── config.py         # App settings & CORS configuration
│   │   ├── database.py       # Async SQLAlchemy session management
│   │   ├── models.py         # SQLAlchemy ORM models (Users, Devices, Telemetry)
│   │   ├── schemas.py        # Pydantic v2 validation schemas
│   │   ├── auth.py           # JWT token authentication & password hashing
│   │   ├── redis_client.py   # Redis Pub/Sub async manager
│   │   ├── simulator.py      # Automated sensor simulator with fallback mode
│   │   ├── mqtt_worker.py    # MQTT background ingestion worker
│   │   └── routers/          # API routes (/health, /auth, /devices, /telemetry, /ws)
│   ├── Dockerfile            # Python 3.11 slim backend image
│   ├── .dockerignore         # Docker build exclusions
│   ├── main.py               # FastAPI entrypoint with async lifespan
│   ├── requirements.txt      # Python dependencies
│   ├── test_backend.py       # E2E integration test suite
│   └── .env.example          # Sample backend configuration
├── frontend/                 # Next.js 16 operator dashboard
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (twins, devices, analytics, rules, etc.)
│   │   ├── components/       # Reusable components (Sidebar, TopBar, Theme toggle, etc.)
│   │   └── lib/              # API client, WebSocket hook, and Theme provider
│   ├── Dockerfile            # Multi-stage Node 20 alpine production image
│   ├── .dockerignore         # Frontend build exclusions
│   ├── package.json          # Node dependencies
│   └── tsconfig.json         # TypeScript configuration
├── mosquitto/
│   └── mosquitto.conf        # Mosquitto MQTT broker configuration
└── docs/                     # Technical architecture specifications & subsystem guides
```

---

## 🚀 Getting Started

### Method 1: One-Click Docker Compose (Recommended)

Run the entire platform with all services pre-configured:

```bash
docker compose up -d --build
```

#### 🌐 Service Endpoints

| Service | URL / Port | Description |
| :--- | :--- | :--- |
| **Operator Dashboard** | [http://localhost:8500](http://localhost:8500) | Next.js 16 Web Dashboard |
| **FastAPI Backend API** | [http://localhost:8501/docs](http://localhost:8501/docs) | Interactive Swagger Documentation |
| **WebSocket Stream** | `ws://localhost:8501/ws` | Real-time telemetry broadcast |
| **PostgreSQL 16** | `localhost:5433` | Database (`lansub` / `lansub`) |
| **Redis 7** | `localhost:6380` | Pub/Sub streaming cache |
| **Mosquitto MQTT** | `localhost:1884` | Sensor ingestion broker |

To stop all containers:
```bash
docker compose down
```

To view live container logs:
```bash
docker compose logs -f
```

---

### Method 2: Local Manual Setup

#### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ (Node 20+ recommended)
- **PostgreSQL**: 16+
- **Redis**: 7+

#### 1. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI backend server
python main.py
```

The API will be available at `http://localhost:8000` (or configured port).
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

#### Run Standalone Device Simulator (Optional)
To run only the sensor simulator without the web server:
```bash
python -m app.simulator
```

#### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
```

The operator dashboard will be available at `http://localhost:3000`.

---

## 🔒 Environment Variables

### Root Docker Configuration (`.env`)

| Variable | Description | Remapped Default |
| :--- | :--- | :--- |
| `FRONTEND_PORT` | Host port for Next.js operator dashboard | `8500` |
| `BACKEND_PORT` | Host port for FastAPI backend & Swagger | `8501` |
| `POSTGRES_PORT` | Host port for PostgreSQL database | `5433` |
| `REDIS_PORT` | Host port for Redis cache & Pub/Sub | `6380` |
| `MQTT_PORT` | Host port for Mosquitto MQTT broker | `1884` |
| `NEXT_PUBLIC_API_URL` | Frontend REST API URL | `http://localhost:8501/v1` |
| `NEXT_PUBLIC_WS_URL` | Frontend WebSocket stream URL | `ws://localhost:8501/ws` |

### Backend Local Configuration (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://lansub:lansub@localhost:5432/lansub` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `MQTT_BROKER_HOST` | MQTT broker host | `localhost` |
| `MQTT_BROKER_PORT` | MQTT broker port | `1883` |
| `JWT_SECRET` | Secret key for JWT signing | `lansub-stream-secure-dev-secret-key-2026` |

---

## 🧪 Testing

Run the automated backend integration test suite:
```bash
cd backend
python test_backend.py
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
