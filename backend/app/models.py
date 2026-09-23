import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Integer, Boolean
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
    alarms = relationship("Alarm", back_populates="device", cascade="all, delete-orphan")


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


class Rule(Base):
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    scope = Column(String, default="Device")  # Device, Asset, Global
    target_id = Column(String, nullable=True)  # device_key or device_id or 'all'
    parameter = Column(String, nullable=False)  # temperature, vibration, etc.
    operator = Column(String, nullable=False)   # >, <, >=, <=, ==, !=
    threshold = Column(String, nullable=False)  # numeric threshold string
    unit = Column(String, nullable=True)        # °C, %, mm/s, RPM
    debounce_seconds = Column(String, default="0s")
    actions = Column(JSONB, default=list)       # list of actions: alarm, email, command
    enabled = Column(Boolean, default=True)
    triggers_count = Column(Integer, default=0)
    last_triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    alarms = relationship("Alarm", back_populates="rule", cascade="all, delete-orphan")


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True, index=True)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("rules.id", ondelete="SET NULL"), nullable=True, index=True)
    severity = Column(String, default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")   # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    telemetry_snapshot = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    device = relationship("Device", back_populates="alarms")
    rule = relationship("Rule", back_populates="alarms")


class DeviceTemplate(Base):
    __tablename__ = "device_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    category = Column(String, default="Sensor")  # Sensor, Control, CCTV, Navigation
    description = Column(String, nullable=True)
    parameters = Column(JSONB, default=list)     # list of schema definitions
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="Equipment")   # Site, Area, Line, Cell, Equipment
    criticality = Column(String, default="B")     # A, B, C
    health_score = Column(Integer, default=98)
    metadata_json = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    parent = relationship("Asset", remote_side=[id], backref="children")

