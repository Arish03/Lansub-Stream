import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())

    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    device_key = Column(String, unique=True, nullable=False, index=True)
    mqtt_username = Column(String, unique=True, nullable=False)
    mqtt_password = Column(String, nullable=False)
    template = Column(String, default="generic-sensor")
    created_at = Column(DateTime, default=func.now())
    last_seen_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="devices")
    telemetry_records = relationship("Telemetry", back_populates="device", cascade="all, delete-orphan")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    ts = Column(DateTime, default=func.now(), nullable=False)
    payload = Column(JSONB, nullable=False)

    device = relationship("Device", back_populates="telemetry_records")

    __table_args__ = (
        Index("idx_telemetry_device_ts", "device_id", ts.desc()),
    )
