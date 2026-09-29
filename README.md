# Sumiden Voice Service

An edge audio alert and voice notification microservice designed to control Axis network speakers and AI CCTV cameras via the Axis VAPIX Media Clip API. Built with NestJS, Prisma, and PostgreSQL.

---

## Features

- **Automated VAPIX Playback**: Directly triggers stored media audio clips on Axis network speakers and cameras over local LAN using Digest/Basic authentication.
- **Dynamic Device Management**: Register, update, and manage multiple speaker devices with auto-generated incremental IDs (`CAM-0001`, `CAM-0002`).
- **Comprehensive Audit Trail**: Every trigger attempt (both success and failure) is recorded with full request/response payloads in PostgreSQL.
- **API Key Security**: Endpoints are protected with hashed API keys.
- **Ubuntu AI Box Ready**: One-command background daemon deployment with automated boot recovery and container health checks.

---

## Prerequisites

- **Host OS**: Ubuntu Linux (or any modern Linux distribution)
- **Container Runtime**: Docker & Docker Compose (`docker-compose-v2` recommended)
- **Network**: The host machine / AI Box must be connected to the same local network (LAN / VLAN) as the Axis speakers.
- *(Optional for direct node dev)*: Node.js 22+ and PostgreSQL 17

---

## Quick Start (Ubuntu AI Box Deployment)

### 1. Configure Environment Variables

Create or verify the `.env` file in the project root:

```bash
NODE_ENV=production
PORT=8000
DATABASE_URL="postgresql://postgres:password@sumiden-db:5432/sumiden?schema=public"
CORS_ALLOWED_ORIGIN=*
```

### 2. Launch the Background Service

Run the provided AI Box deployment script. This starts PostgreSQL and the Voice Service API in the background with `restart: always` (auto-starts on system boot):

```bash
# Make script executable
chmod +x deploy-aibox.sh

# Start service in the background
./deploy-aibox.sh start
```

### 3. Verify Health & Background Status

```bash
# Check container status
./deploy-aibox.sh status

# Follow live logs
./deploy-aibox.sh logs
```

The service is healthy once `http://127.0.0.1:8000/api/v1` returns an HTTP 200 response.

---

## Step-by-Step Guide: Managing Devices & Triggering Sound

### Step 1: Generate an API Key

Triggering audio and accessing protected endpoints requires an API Key. Generate one via:

```bash
curl -X POST http://localhost:8000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Edge AI Box Client"
  }'
```

**Sample Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "name": "Edge AI Box Client",
  "apiKey": "svs_live_sample_key_1234567890abcdef",
  "prefix": "svs_live_samp",
  "createdAt": "2026-09-29T12:00:00.000Z"
}
```

> [!IMPORTANT]
> Store the returned `apiKey` securely. It is only displayed once upon creation and is stored as a secure hash in the database.

---

### Step 2: Register a Speaker / Device

Register your network speaker using its local IP, credentials, and default clip index:

```bash
curl -X POST http://localhost:8000/api/v1/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Gate Speaker",
    "cameraIp": "192.168.1.100",
    "port": 80,
    "protocol": "http",
    "username": "sample_user",
    "password": "sample_password",
    "clip": 0,
    "volume": 100
  }'
```

#### Field Reference:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | **Yes** | — | Human-readable name for the device |
| `cameraIp` | `string` | **Yes** | — | Local IP address or hostname of the speaker |
| `port` | `number` | No | `80` | HTTP/HTTPS port (standard is 80) |
| `protocol` | `'http' \| 'https'` | No | `'http'` | Connection protocol |
| `username` | `string` | No | — | Axis device administrator or operator username |
| `password` | `string` | No | — | Axis device password |
| `clip` | `number` | No | `0` | Zero-indexed audio clip to play (`0` = first clip on device) |
| `volume` | `number` | No | `100` | Playback volume percentage (0–1000, 100 = 100%) |
| `repeat` | `number` | No | `0` | Repeat count (`0` = play once, `-1` = loop) |

**Sample Response:**
```json
{
  "id": "e4f5a6b7-c8d9-0123-4567-89abcdef0123",
  "cameraId": "CAM-0001",
  "name": "Sample Gate Speaker",
  "cameraIp": "192.168.1.100",
  "port": 80,
  "protocol": "http",
  "clip": 0,
  "volume": 100,
  "repeat": 0,
  "isActive": true,
  "createdAt": "2026-09-29T12:05:00.000Z",
  "updatedAt": "2026-09-29T12:05:00.000Z"
}
```

Notice the assigned **`cameraId`** (e.g. `CAM-0001`). Use this ID to trigger audio clips.

---

### Step 3: Trigger Sound Playback

Send a trigger request using the `cameraId` and your `x-api-key`:

```bash
curl -X POST http://localhost:8000/api/v1/cctv/trigger-sound \
  -H "Content-Type: application/json" \
  -H "x-api-key: svs_live_sample_key_1234567890abcdef" \
  -d '{
    "cameraId": "CAM-0001"
  }'
```

**Sample Response:**
```json
{
  "status": "playing",
  "camera": {
    "cameraId": "CAM-0001",
    "name": "Sample Gate Speaker",
    "ip": "192.168.1.100",
    "port": 80,
    "protocol": "http",
    "authenticatedUser": "sample_user"
  },
  "clip": 0,
  "volume": 100,
  "repeat": 0,
  "device": {
    "audiodeviceid": 0,
    "audiooutputid": 0
  },
  "vapixCgi": {
    "method": "GET",
    "path": "/axis-cgi/mediaclip.cgi",
    "url": "http://192.168.1.100:80/axis-cgi/mediaclip.cgi?action=play&clip=0&volume=100"
  },
  "cameraResponse": {
    "statusCode": 200,
    "contentType": "text/plain",
    "body": "OK\nplaying=0"
  },
  "triggeredAt": "2026-09-29T12:10:00.000Z"
}
```

---

## Device & Log Management Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/cameras` | Public | Register a new speaker / camera |
| `GET` | `/api/v1/cameras` | API Key | List all active registered devices |
| `GET` | `/api/v1/cameras/:id` | API Key | Get details of a single device (by UUID or `CAM-XXXX`) |
| `PATCH` | `/api/v1/cameras/:id` | API Key | Update device configuration (IP, clip, volume, etc.) |
| `DELETE` | `/api/v1/cameras/:id` | API Key | Deactivate a device |
| `POST` | `/api/v1/cctv/trigger-sound` | API Key | Trigger audio clip playback on a device |
| `GET` | `/api/v1/audit-logs` | API Key | Retrieve paginated history of all trigger events |
| `POST` | `/api/v1/api-keys` | Public | Create a new API key |
| `GET` | `/api/v1/api-keys` | Public | List active API keys |

---

## AI Box Daemon Management (`deploy-aibox.sh`)

| Command | Action |
|---|---|
| `./deploy-aibox.sh start` | Build and start containers in the background (default) |
| `./deploy-aibox.sh stop` | Stop all background service containers |
| `./deploy-aibox.sh restart` | Restart background service |
| `./deploy-aibox.sh status` | Display status and port mappings |
| `./deploy-aibox.sh logs` | Stream live container logs |
| `sudo ./deploy-aibox.sh systemd` | Install and enable an Ubuntu systemd service unit |

---

## License

UNLICENSED (Internal Geoplan / Sumiden Project)
