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
    id: uuid.UUID
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
