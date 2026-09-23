import uuid
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserOut(UserBase):
    id: uuid.UUID | str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# Device Schemas
class DeviceBase(BaseModel):
    name: str
    template: Optional[str] = "generic-sensor"

class DeviceCreate(DeviceBase):
    pass

class DeviceOut(DeviceBase):
    id: uuid.UUID
    user_id: uuid.UUID
    device_key: str
    mqtt_username: str
    template: str
    created_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    telemetry: Optional[dict[str, Any]] = None  # latest telemetry for digital twin

    class Config:
        from_attributes = True


# Telemetry Schemas
class TelemetryCreate(BaseModel):
    device_key: str
    payload: dict[str, Any]

class TelemetryOut(BaseModel):
    id: uuid.UUID
    device_id: uuid.UUID
    ts: datetime
    payload: dict[str, Any]

    class Config:
        from_attributes = True

# Command / Action Schema
class CommandSend(BaseModel):
    action: str
    target: Optional[str] = None
    value: Optional[Any] = None


# Rule Schemas
class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scope: str = "Device"
    target_id: Optional[str] = None
    parameter: str
    operator: str
    threshold: str
    unit: Optional[str] = None
    debounce_seconds: Optional[str] = "0s"
    actions: list[dict[str, Any]] = Field(default_factory=list)
    enabled: bool = True

class RuleOut(BaseModel):
    id: uuid.UUID | str
    user_id: uuid.UUID | str
    name: str
    description: Optional[str] = None
    scope: str = "Device"
    target_id: Optional[str] = None
    parameter: str
    operator: str
    threshold: str
    unit: Optional[str] = None
    debounce_seconds: Optional[str] = "0s"
    actions: list[dict[str, Any]] = Field(default_factory=list)
    enabled: bool = True
    triggers_count: int = 0
    last_triggered_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Alarm Schemas
class AlarmOut(BaseModel):
    id: uuid.UUID | str
    user_id: uuid.UUID | str
    device_id: Optional[uuid.UUID | str] = None
    rule_id: Optional[uuid.UUID | str] = None
    severity: str = "HIGH"
    title: str
    message: str
    status: str = "ACTIVE"
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    telemetry_snapshot: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Device Template Schemas
class TemplateCreate(BaseModel):
    name: str
    category: str = "Sensor"
    description: Optional[str] = None
    parameters: list[dict[str, Any]] = Field(default_factory=list)

class TemplateOut(BaseModel):
    id: uuid.UUID | str
    user_id: uuid.UUID | str
    name: str
    category: str
    description: Optional[str] = None
    parameters: list[dict[str, Any]] = Field(default_factory=list)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Asset Schemas
class AssetCreate(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID | str] = None
    type: str = "Equipment"
    criticality: str = "B"
    health_score: int = 98
    metadata_json: dict[str, Any] = Field(default_factory=dict)

class AssetOut(BaseModel):
    id: uuid.UUID | str
    user_id: uuid.UUID | str
    parent_id: Optional[uuid.UUID | str] = None
    name: str
    type: str
    criticality: str
    health_score: int
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

