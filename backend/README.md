# Lansub Stream — Python Backend

High-throughput, asynchronous Industrial IoT backend built with **FastAPI**, **PostgreSQL**, **Redis**, and **WebSockets**.

---

## Features

- **PostgreSQL 16 Storage**:
  - `users`: User accounts with bcrypt password hashing and JWT authentication.
  - `devices`: Registered devices, unique public `device_key` identifiers, and MQTT credentials.
  - `telemetry`: Flexible JSONB payload storage with composite index `(device_id, ts DESC)` for sub-millisecond historical queries.
- **Redis 7 Pub/Sub Bridge**:
  - Ingested telemetry is written to Postgres and immediately published to Redis channel `lansub:telemetry:broadcast`.
- **Real-Time WebSockets**:
  - Endpoint `/ws` bridges Redis pub/sub directly to frontend clients without polling the database.
- **Industrial Telemetry Ingestion**:
  - `POST /v1/telemetry`: Ingests sensor readings, updates digital twin state, and notifies WebSocket clients.
  - `backend/app/mqtt_worker.py`: Background worker for MQTT `/device/upstream` topic ingestion.
- **Device Simulator**:
  - `backend/app/simulator.py`: Automatically streams realistic periodic telemetry (bearing temperature, vibration, humidity, battery) so the platform is immediately active.
- **Interactive OpenAPI Documentation**:
  - Swagger UI: `http://localhost:8000/docs`
  - ReDoc: `http://localhost:8000/redoc`

---

## Directory Structure

```
backend/
├── app/
│   ├── config.py          # Environment settings & CORS
│   ├── database.py        # SQLAlchemy AsyncSession engine
│   ├── models.py          # SQLAlchemy ORM models (users, devices, telemetry)
│   ├── schemas.py         # Pydantic v2 validation models
│   ├── auth.py            # Password hashing, JWT token generation & verification
│   ├── redis_client.py    # Redis pub/sub manager
│   ├── simulator.py       # Built-in industrial device simulator
│   ├── mqtt_worker.py     # Background MQTT broker subscriber
│   └── routers/
│       ├── health.py      # /v1/health (Postgres + Redis checks)
│       ├── auth.py        # /v1/auth/register, /v1/auth/login, /v1/auth/me
│       ├── devices.py     # /v1/devices CRUD, commands, and historical telemetry
│       ├── telemetry.py   # /v1/telemetry ingestion endpoint
│       └── ws.py          # /ws real-time WebSocket broadcast endpoint
├── main.py                # FastAPI app entrypoint with lifespan manager
├── requirements.txt       # Python dependencies
├── test_backend.py        # Automated end-to-end integration test
└── .env.example           # Sample environment configuration
```

---

## Quick Start

### 1. Ensure Postgres & Redis are Running
```bash
docker ps
# lansub-postgres (port 5432)
# lansub-redis (port 6379)
```

### 2. Activate Virtual Environment
```bash
cd backend
.venv\Scripts\activate
```

### 3. Run the Backend
```bash
python main.py
```
API runs on `http://localhost:8000`.

### 4. Run Automated Test Suite
```bash
python test_backend.py
```
Verifies health, user registration, JWT login, device provisioning, telemetry ingestion, Redis pub/sub, and WebSocket streaming.
