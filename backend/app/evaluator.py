import re
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Alarm, Device, Rule
from app.redis_client import redis_manager

logger = logging.getLogger("evaluator")


def extract_numeric(val) -> float | None:
    if isinstance(val, (int, float)):
        return float(val)
    if val is None:
        return None
    matches = re.findall(r"[-+]?(?:\d*\.\d+|\d+)", str(val))
    if matches:
        return float(matches[0])
    return None


async def evaluate_rules_for_telemetry(
    db: AsyncSession,
    device: Device,
    payload: dict,
):
    """
    Evaluates all active rules for the given device's user against the incoming telemetry payload.
    Creates alarms when thresholds are breached without spamming multiple ACTIVE alarms for the same rule.
    """
    try:
        stmt = select(Rule).where(
            Rule.user_id == device.user_id,
            Rule.enabled == True,
        )
        res = await db.execute(stmt)
        rules = res.scalars().all()

        if not rules:
            return

        for rule in rules:
            # Check target filtering
            if rule.scope == "Device" and rule.target_id:
                target = rule.target_id.strip()
                if target not in (device.device_key, str(device.id), device.name, "all"):
                    continue

            # Check if metric exists in payload
            if rule.parameter not in payload:
                continue

            num_val = extract_numeric(payload[rule.parameter])
            thresh_val = extract_numeric(rule.threshold)

            if num_val is None or thresh_val is None:
                continue

            # Evaluate operator
            op = rule.operator.strip()
            triggered = False
            if op == ">":
                triggered = num_val > thresh_val
            elif op == "<":
                triggered = num_val < thresh_val
            elif op == ">=":
                triggered = num_val >= thresh_val
            elif op == "<=":
                triggered = num_val <= thresh_val
            elif op in ("==", "="):
                triggered = num_val == thresh_val
            elif op == "!=":
                triggered = num_val != thresh_val

            if not triggered:
                continue

            # Update rule trigger statistics
            rule.triggers_count = (rule.triggers_count or 0) + 1
            rule.last_triggered_at = datetime.now(timezone.utc)

            # Prevent duplicate ACTIVE alarms for the same rule & device
            alarm_check = select(Alarm).where(
                Alarm.rule_id == rule.id,
                Alarm.device_id == device.id,
                Alarm.status == "ACTIVE",
            )
            alarm_res = await db.execute(alarm_check)
            if alarm_res.scalar_one_or_none():
                # Active alarm already exists, do not duplicate
                continue

            # Extract severity
            severity = "HIGH"
            for act in (rule.actions or []):
                if isinstance(act, dict) and act.get("type") == "alarm":
                    detail_str = f"{act.get('label', '')} {act.get('detail', '')}".upper()
                    if "CRITICAL" in detail_str:
                        severity = "CRITICAL"
                    elif "MEDIUM" in detail_str:
                        severity = "MEDIUM"
                    elif "LOW" in detail_str:
                        severity = "LOW"

            new_alarm = Alarm(
                id=uuid.uuid4(),
                user_id=device.user_id,
                device_id=device.id,
                rule_id=rule.id,
                severity=severity,
                title=f"{rule.name}",
                message=f"{device.name}: {rule.parameter} ({num_val}{rule.unit or ''}) breached threshold ({rule.operator} {rule.threshold}{rule.unit or ''})",
                status="ACTIVE",
                telemetry_snapshot=payload,
                created_at=datetime.now(timezone.utc),
            )
            db.add(new_alarm)
            logger.warning(f"Alarm triggered: {new_alarm.title} on {device.name}")

            # Real-time alert broadcast
            await redis_manager.publish_telemetry(
                device_key=device.device_key,
                reading={
                    "type": "alarm",
                    "alarm": {
                        "id": str(new_alarm.id),
                        "title": new_alarm.title,
                        "message": new_alarm.message,
                        "severity": new_alarm.severity,
                        "device_name": device.name,
                        "created_at": new_alarm.created_at.isoformat(),
                    }
                }
            )
    except Exception as e:
        logger.error(f"Error evaluating rules for device {device.name}: {e}")
