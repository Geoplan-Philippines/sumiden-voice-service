#!/usr/bin/env bash
# ==============================================================================
# Sumiden Voice Service - Ubuntu AI Box Background Deployment Script
# ==============================================================================
# This script deploys and runs the voice service as a persistent background daemon
# on an Ubuntu OS AI Box (Edge Device). It automatically runs on system boot,
# restarts on crashes, exposes port 8000 to the local network, and applies DB
# migrations without seeding any data.
# ==============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.aibox.yml"
SERVICE_NAME="sumiden-voice-service"
PORT="8000"
HEALTH_URL="http://127.0.0.1:${PORT}/api/v1"
MAX_HEALTH_RETRIES=30
RETRY_INTERVAL=2

# ─── Colors & Formatting ──────────────────────────────────────────────────────
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
NC="\033[0m"

info()    { echo -e "${CYAN}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌ $1${NC}" >&2; exit 1; }

# ─── Helper: Docker Command Resolution ────────────────────────────────────────
DOCKER_CMD="docker"
if ! command -v docker &>/dev/null; then
  error "Docker is not installed! On Ubuntu, install with:\n  sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2\n  sudo usermod -aG docker \$USER"
fi

if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  error "Docker Compose is not installed! On Ubuntu, install with:\n  sudo apt-get update && sudo apt-get install -y docker-compose-v2"
fi

# Ensure docker daemon is running
if ! docker info &>/dev/null; then
  warn "Docker daemon is not running or current user lacks docker group permissions."
  info "Attempting to start docker service..."
  if command -v systemctl &>/dev/null; then
    sudo systemctl enable --now docker || error "Failed to start docker service. Run with sudo or add user to docker group."
  else
    error "Cannot connect to Docker daemon."
  fi
fi

# ─── Actions ──────────────────────────────────────────────────────────────────

cmd_start() {
  echo ""
  echo -e "${BOLD}🚀 Starting ${SERVICE_NAME} on Ubuntu AI Box...${NC}"
  echo "────────────────────────────────────────────────────────────"

  cd "${SCRIPT_DIR}"

  # 1. Ensure .env exists with default variables if missing
  if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    info "Creating default .env configuration file..."
    cat <<EOF > "${SCRIPT_DIR}/.env"
NODE_ENV=production
PORT=${PORT}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=sumiden
CORS_ALLOWED_ORIGIN=*
EOF
    success "Created .env"
  fi

  # 2. Build and launch containers in background (-d)
  info "Building and launching containers in background (daemon mode)..."
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d --build

  # 3. Wait for database and application healthcheck
  info "Waiting for service to become healthy at ${HEALTH_URL}..."
  local retries=0
  local healthy=false

  while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
    if curl -s -f -m 3 "${HEALTH_URL}" &>/dev/null || wget -qO- "${HEALTH_URL}" &>/dev/null; then
      healthy=true
      break
    fi
    retries=$((retries + 1))
    echo -n "."
    sleep $RETRY_INTERVAL
  done
  echo ""

  if [ "$healthy" = true ]; then
    success "Voice Service API is healthy and running in the background!"
  else
    warn "Healthcheck timed out. Checking container logs..."
    ${COMPOSE_CMD} -f "${COMPOSE_FILE}" logs --tail=30
    error "Deployment started but healthcheck failed. Check logs above."
  fi

  # 4. Display Host IP and helpful endpoints
  local LOCAL_IP
  LOCAL_IP=$(ip -4 addr show scope global | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1 || echo "127.0.0.1")

  echo ""
  echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}🎉 DEPLOYMENT SUCCESSFUL - RUNNING IN BACKGROUND${NC}"
  echo -e "${BOLD}════════════════════════════════════════════════════════════${NC}"
  echo -e "  • Localhost API:    ${CYAN}http://127.0.0.1:${PORT}/api/v1${NC}"
  echo -e "  • Network / LAN IP: ${CYAN}http://${LOCAL_IP}:${PORT}/api/v1${NC}"
  echo -e "  • Swagger / Docs:   ${CYAN}http://${LOCAL_IP}:${PORT}/api/docs${NC}"
  echo -e "  • DB Status:        ${GREEN}Migrated (Tables created, ready for creation)${NC}"
  echo -e "  • Boot Autostart:   ${GREEN}Enabled (restart: always)${NC}"
  echo ""
  echo -e "${BOLD}📋 Management Commands:${NC}"
  echo -e "  • View status:      ${YELLOW}./deploy-aibox.sh status${NC}"
  echo -e "  • View live logs:   ${YELLOW}./deploy-aibox.sh logs${NC}"
  echo -e "  • Restart service:  ${YELLOW}./deploy-aibox.sh restart${NC}"
  echo -e "  • Stop service:     ${YELLOW}./deploy-aibox.sh stop${NC}"
  echo ""
  echo -e "${BOLD}💡 Next Step (Speaker Creation):${NC}"
  echo -e "  Create your speaker using:"
  echo -e "  ${CYAN}curl -X POST http://127.0.0.1:${PORT}/api/v1/cameras \\${NC}"
  echo -e "  ${CYAN}  -H \"Content-Type: application/json\" \\${NC}"
  echo -e "  ${CYAN}  -d '{\"name\":\"Speaker 1\",\"cameraIp\":\"172.16.32.155\",\"port\":80,\"protocol\":\"http\",\"username\":\"root\",\"password\":\"fsci873T\",\"clip\":0,\"volume\":100}'${NC}"
  echo ""
}

cmd_stop() {
  info "Stopping ${SERVICE_NAME} background containers..."
  cd "${SCRIPT_DIR}"
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" down
  success "Service stopped."
}

cmd_restart() {
  info "Restarting ${SERVICE_NAME} background containers..."
  cd "${SCRIPT_DIR}"
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" restart
  success "Service restarted."
}

cmd_status() {
  cd "${SCRIPT_DIR}"
  echo -e "${BOLD}📦 ${SERVICE_NAME} Containers:${NC}"
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" ps
}

cmd_logs() {
  cd "${SCRIPT_DIR}"
  info "Streaming live logs (press Ctrl+C to exit)..."
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" logs -f --tail=100
}

cmd_install_systemd() {
  info "Configuring optional systemd unit for Ubuntu OS..."
  local SYSTEMD_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
  local USER_NAME="${SUDO_USER:-$USER}"

  sudo bash -c "cat <<EOF > ${SYSTEMD_FILE}
[Unit]
Description=Sumiden Voice Service (Docker Compose Daemon)
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${SCRIPT_DIR}
ExecStart=$(command -v docker) compose -f ${COMPOSE_FILE} up -d
ExecStop=$(command -v docker) compose -f ${COMPOSE_FILE} down
ExecReload=$(command -v docker) compose -f ${COMPOSE_FILE} restart
User=${USER_NAME}

[Install]
WantedBy=multi-user.target
EOF"

  sudo systemctl daemon-reload
  sudo systemctl enable "${SERVICE_NAME}"
  success "systemd service installed! You can now manage via: sudo systemctl start|stop|status ${SERVICE_NAME}"
}

# ─── Main Dispatcher ──────────────────────────────────────────────────────────
ACTION="${1:-start}"

case "${ACTION}" in
  start)
    cmd_start
    ;;
  stop)
    cmd_stop
    ;;
  restart)
    cmd_restart
    ;;
  status)
    cmd_status
    ;;
  logs)
    cmd_logs
    ;;
  systemd)
    cmd_install_systemd
    ;;
  help|--help|-h)
    echo "Usage: ./deploy-aibox.sh [start|stop|restart|status|logs|systemd]"
    echo ""
    echo "Commands:"
    echo "  start     (default) Build and start background service on AI Box"
    echo "  stop      Stop all running service containers"
    echo "  restart   Restart background service"
    echo "  status    Show status of background containers and port mappings"
    echo "  logs      Follow live container logs"
    echo "  systemd   Install and enable systemd service unit on Ubuntu"
    ;;
  *)
    error "Unknown command: ${ACTION}. Run './deploy-aibox.sh help' for usage."
    ;;
esac
