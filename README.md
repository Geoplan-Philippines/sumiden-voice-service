# Sumiden Voice Service

A high-performance microservice built with NestJS, Prisma, and PostgreSQL to manage Axis CCTV cameras / network speakers and trigger audio playback via Axis VAPIX Media Clip API.

---

## 📌 Authentication Notice

> **Note:** API key authorization has been **removed** from speaker triggering and all management endpoints (`cctv`, `cameras`, `audit-logs`). You **do not** need to provide `x-api-key` or `Authorization` headers when calling these endpoints.
>
> The API Key service (`/api/v1/api-keys`) remains active in the codebase for key management if needed.

---

## 🌐 Base URL & Port

- **Port**: `8005` (configurable via `.env`)
- **API Prefix**: `/api/v1`
- **Base Endpoint**: `http://<host>:8005/api/v1`

---

## 🚀 API Endpoints & Payload Formats

### 1. 🔊 Trigger Speaker Audio Clip

Plays the configured audio clip on an Axis CCTV camera or network horn speaker via VAPIX.

- **Method**: `POST`
- **Path**: `/api/v1/cctv/trigger-sound`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Authentication**: None (no API key required)

#### Request Payload:
```json
{
  "cameraId": "CAM_001"
}
```

> **Field Description:**
> - `cameraId` *(string, required)*: The camera code (e.g. `"CAM_001"`) or internal database UUID of the target speaker.

#### cURL Example:
```bash
curl -X POST http://127.0.0.1:8005/api/v1/cctv/trigger-sound \
  -H "Content-Type: application/json" \
  -d '{
    "cameraId": "CAM_001"
  }'
```

#### Successful Response (`200 OK`):
```json
{
  "status": "playing",
  "camera": {
    "cameraId": "CAM_001",
    "name": "Front Gate Speaker",
    "ip": "172.16.32.155",
    "port": 80,
    "protocol": "http",
    "authenticatedUser": "root"
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
    "url": "http://172.16.32.155:80/axis-cgi/mediaclip.cgi?action=play&clip=0&volume=100&repeat=0&audiodeviceid=0&audiooutputid=0"
  },
  "cameraResponse": {
    "statusCode": 200,
    "contentType": "text/plain",
    "body": "OK"
  },
  "triggeredAt": "2026-10-02T03:30:00.000Z"
}
```

---

### 2. 📷 Camera / Speaker Management

Manage registered Axis cameras and speakers.

#### A. Register New Speaker / Camera
- **Method**: `POST`
- **Path**: `/api/v1/cameras`
- **Headers**: `Content-Type: application/json`
- **Authentication**: None

**Request Payload:**
```json
{
  "name": "Front Gate Speaker",
  "cameraIp": "172.16.32.155",
  "port": 80,
  "protocol": "http",
  "username": "root",
  "password": "your-camera-password",
  "clip": 0,
  "volume": 100,
  "repeat": 0,
  "audiodeviceid": 0,
  "audiooutputid": 0
}
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | - | Descriptive name for speaker/camera |
| `cameraIp` | `string` | **Yes** | - | IP address of Axis speaker/camera |
| `port` | `number` | No | `80` | Port of camera web service (1-65535) |
| `protocol` | `string` | No | `"http"` | `"http"` or `"https"` |
| `username` | `string` | No | - | VAPIX Digest auth username |
| `password` | `string` | No | - | VAPIX Digest auth password |
| `clip` | `number` | No | `0` | Audio clip index to play |
| `volume` | `number` | No | `100` | Playback volume (0 - 1000) |
| `repeat` | `number` | No | `0` | Playback repetitions (0 = once, -1 = loop) |
| `audiodeviceid` | `number` | No | `0` | Audio device index on the camera |
| `audiooutputid` | `number` | No | `0` | Audio output index on the camera |

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8005/api/v1/cameras \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Front Gate Speaker",
    "cameraIp": "172.16.32.155",
    "port": 80,
    "protocol": "http",
    "username": "root",
    "password": "your-camera-password",
    "clip": 0,
    "volume": 100
  }'
```

#### B. List All Speakers / Cameras
- **Method**: `GET`
- **Path**: `/api/v1/cameras`
- **Authentication**: None

```bash
curl -X GET http://127.0.0.1:8005/api/v1/cameras
```

#### C. Get Speaker / Camera by ID
- **Method**: `GET`
- **Path**: `/api/v1/cameras/:id`
- **Authentication**: None

```bash
curl -X GET http://127.0.0.1:8005/api/v1/cameras/<id>
```

#### D. Update Speaker / Camera
- **Method**: `PATCH`
- **Path**: `/api/v1/cameras/:id`
- **Headers**: `Content-Type: application/json`
- **Authentication**: None

**Request Payload:**
```json
{
  "volume": 150,
  "clip": 1
}
```

```bash
curl -X PATCH http://127.0.0.1:8005/api/v1/cameras/<id> \
  -H "Content-Type: application/json" \
  -d '{"volume": 150, "clip": 1}'
```

#### E. Delete Speaker / Camera
- **Method**: `DELETE`
- **Path**: `/api/v1/cameras/:id`
- **Authentication**: None

```bash
curl -X DELETE http://127.0.0.1:8005/api/v1/cameras/<id>
```

---

### 3. 📜 Audit Logs

Trace all audio trigger attempts and actions.

- **Method**: `GET`
- **Path**: `/api/v1/audit-logs`
- **Authentication**: None
- **Query Parameters**:
  - `page`: Page number (default: `1`)
  - `limit`: Records per page (default: `20`, max: `100`)
  - `action`: Filter by action (e.g. `trigger-sound`)
  - `status`: Filter by status (`success` | `failed`)
  - `cameraId`: Filter by camera ID

**cURL Example:**
```bash
curl -X GET "http://127.0.0.1:8005/api/v1/audit-logs?page=1&limit=20&status=success"
```

---

### 4. 🔑 API Key Service

The API key service remains available for managing API credentials.

- **Create Key**: `POST /api/v1/api-keys` (`{"name": "Client Name"}`)
- **List Keys**: `GET /api/v1/api-keys`
- **Revoke Key**: `DELETE /api/v1/api-keys/:id`

---

## 🛠 Deployment & Management

Run the deployment script on the Ubuntu AI Box:

```bash
# Check status of containers
./deploy-aibox.sh status

# View live container logs
./deploy-aibox.sh logs

# Restart service
./deploy-aibox.sh restart

# Stop service
./deploy-aibox.sh stop
```
