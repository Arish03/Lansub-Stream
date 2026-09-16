import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file explicitly
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lansub Stream API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"

    # Database: Default to WSL container IP if localhost is occupied by Windows native Postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://lansub:lansub@172.27.252.246:5432/lansub"
    )
    
    # Redis
    REDIS_URL: str = os.getenv(
        "REDIS_URL", 
        "redis://172.27.252.246:6379/0"
    )
    REDIS_TELEMETRY_CHANNEL: str = "lansub:telemetry:broadcast"

    # MQTT Settings
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "172.27.252.246")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TOPIC_UPSTREAM: str = "/device/upstream"
    MQTT_TOPIC_DOWNSTREAM: str = "/device/downstream"

    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "lansub-stream-secure-dev-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
