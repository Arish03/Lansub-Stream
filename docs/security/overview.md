# Security

> This document covers security architecture, authentication, device credential management, TLS configuration, and security best practices for Quarkifi Stream deployments.

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LAYER 1 — TRANSPORT SECURITY                   │   │
│  │  TLS 1.2+ for all MQTT, HTTP, and WebSocket     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LAYER 2 — AUTHENTICATION                       │   │
│  │  User accounts, API keys, device credentials     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LAYER 3 — AUTHORIZATION                        │   │
│  │  Role-based access control, project isolation    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LAYER 4 — DATA SECURITY                        │   │
│  │  Encryption at rest, payload validation          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  LAYER 5 — OPERATIONAL SECURITY                 │   │
│  │  Audit logs, credential rotation, monitoring     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Transport Security (TLS)

All communication between devices and the platform must use TLS encryption in production.

### MQTT TLS Configuration

| Parameter | Development | Production |
|---|---|---|
| **Port** | 1883 (unsecured) | 8883 (TLS) |
| **TLS Version** | — | TLS 1.2 or TLS 1.3 |
| **Certificate** | — | Platform-issued or custom CA |
| **Verification** | — | Full certificate chain validation |

> [!CAUTION]
> **Port 1883 transmits all data — including credentials — in plaintext.** It must never be used in production environments. Use port 8883 with TLS for all non-development deployments.

### HTTP/HTTPS

| Endpoint | Protocol |
|---|---|
| Console UI | HTTPS only |
| API | HTTPS only |
| Telemetry ingestion | HTTPS (preferred) or MQTT over TLS |
| Webhooks (outbound) | HTTPS required for action endpoints |

---

## Authentication

### User Authentication

| Method | Description |
|---|---|
| **Email + Password** | Standard account login |
| **API Keys** | Programmatic access to platform APIs |
| **Session Tokens** | JWT-based session management |

### Device Authentication

Each registered device receives unique MQTT credentials:

| Credential | Description |
|---|---|
| **Username** | Unique device identifier |
| **Password** | Device-specific secret |
| **Topics** | Scoped to upstream and downstream for that device |

Credentials are issued when a device is created and can be regenerated through the console.

```
Device Registration
       │
       ▼
Credentials Issued (username + password)
       │
       ▼
Device uses credentials to connect to MQTT broker
       │
       ▼
Broker authenticates and authorizes topic access
```

### Edge Gateway Authentication

| Method | Description |
|---|---|
| **Token-based** | Gateway registers with a provisioning token |
| **Mutual TLS** | Gateway and cloud authenticate each other via certificates |

---

## Authorization (RBAC)

Role-Based Access Control governs what each user can do within a project:

| Role | Capabilities |
|---|---|
| **Admin** | Full access — create/delete projects, manage users, all modules |
| **Editor** | Create/edit devices, templates, rules, dashboards, pipelines |
| **Viewer** | Read-only access to dashboards, analytics, device status |
| **Operator** | Execute commands, acknowledge alarms, limited editing |

### Project Isolation

Each project is a fully isolated tenant:

- Devices in Project A cannot see or interact with devices in Project B
- MQTT topics are scoped per project
- Users must be explicitly added to a project
- API keys are project-scoped

---

## Credential Management

### Device Credential Lifecycle

```
CREATE   ──► Device registered, credentials issued
USE      ──► Device connects using credentials
ROTATE   ──► New credentials generated, old invalidated
REVOKE   ──► Credentials permanently invalidated
DELETE   ──► Device decommissioned, all credentials removed
```

### Best Practices

| Practice | Guidance |
|---|---|
| **Never expose credentials** | Don't display passwords in screenshots, logs, or commit history |
| **Mask by default** | Console should mask credential values; copy without displaying |
| **Rotate periodically** | Rotate device credentials on a schedule (quarterly minimum) |
| **Revoke on compromise** | If credentials are exposed, revoke and reissue immediately |
| **Unique per device** | Never share credentials across multiple devices |
| **Secure storage** | Store credentials in device secure storage / TPM where available |
| **Environment variables** | In code, load credentials from environment variables, not source files |

---

## Payload Validation

The platform validates all incoming telemetry against the device template schema:

| Validation | Action |
|---|---|
| **Unknown attribute** | Reject or log warning |
| **Wrong data type** | Reject (e.g., string where float expected) |
| **Out of range** | Flag or reject (if min/max defined in template) |
| **Missing required** | Accept partial payload (optional attributes may be absent) |
| **Malformed JSON** | Reject entire message |
| **Oversized payload** | Reject if exceeds maximum payload size |

---

## Network Security

| Control | Description |
|---|---|
| **IP Whitelisting** | Restrict MQTT access to known device/gateway IP ranges |
| **Rate Limiting** | Per-device message rate limits to prevent abuse |
| **DDoS Protection** | Cloud infrastructure-level DDoS mitigation |
| **Firewall Rules** | Restrict edge gateway inbound/outbound traffic |
| **VPN** | Optional VPN tunnel between edge gateways and cloud |

---

## Audit Logging

All security-relevant events are logged:

| Event | Logged Data |
|---|---|
| **User login** | User, IP, timestamp, success/failure |
| **Device connection** | Device ID, IP, timestamp, protocol |
| **Credential rotation** | Device ID, initiated by, timestamp |
| **Rule modification** | Rule ID, changed by, before/after |
| **Command execution** | Device, command, initiated by, timestamp |
| **API access** | Endpoint, API key, IP, timestamp |
| **Edge deployment** | Gateway, application, action, timestamp |

---

## Security Checklist

### Development

- [ ] Use port 1883 only in local development
- [ ] Never commit credentials to version control
- [ ] Use `.env` files for device credentials in development code
- [ ] Add `.env` to `.gitignore`

### Staging

- [ ] Switch to TLS (port 8883) for all MQTT connections
- [ ] Enable certificate verification on devices
- [ ] Test credential rotation procedures
- [ ] Verify RBAC permissions for all roles

### Production

- [ ] TLS 1.2+ enforced on all connections
- [ ] Certificate pinning enabled on devices where possible
- [ ] IP whitelisting configured for MQTT broker
- [ ] Rate limiting enabled per device
- [ ] Credential rotation schedule established
- [ ] Audit logging enabled and reviewed regularly
- [ ] Edge gateways use mutual TLS
- [ ] All webhooks use HTTPS endpoints
- [ ] Dashboard access restricted by role
- [ ] OTA updates are signed and verified
