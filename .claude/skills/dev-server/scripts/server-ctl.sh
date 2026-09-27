#!/usr/bin/env bash
# server-ctl.sh - Safely start, stop, restart, and inspect dev servers on macOS / Linux.

ACTION="$1"
PORT="${2:-3000}"
COMMAND="${3:-npm run dev}"
URL="${4:-http://localhost:$PORT}"

get_pid() {
  lsof -ti :"$PORT" 2>/dev/null
}

stop_server() {
  local pids
  pids=$(get_pid)
  if [ -z "$pids" ]; then
    echo "No process listening on port $PORT."
    return 0
  fi
  echo "Terminating process(es) on port $PORT (PID(s): $pids)..."
  kill -9 $pids 2>/dev/null
  sleep 1
  if [ -z "$(get_pid)" ]; then
    echo "Port $PORT is now free."
  else
    echo "Warning: Port $PORT may still be occupied."
  fi
}

check_health() {
  curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -q '^[23]'
}

start_server() {
  local existing
  existing=$(get_pid)
  if [ -n "$existing" ]; then
    echo "Port $PORT is already in use by PID $existing."
    echo "Use restart to stop and start fresh."
    return 1
  fi
  echo "Starting dev server: $COMMAND on port $PORT..."
  nohup $COMMAND > /dev/null 2>&1 &
  for i in $(seq 1 15); do
    sleep 1
    if check_health; then
      echo "Server is UP and responding on $URL!"
      return 0
    fi
  done
  echo "Server started in background (PID: $(get_pid))."
}

status_server() {
  local pids
  pids=$(get_pid)
  if [ -n "$pids" ]; then
    echo "Port $PORT: OCCUPIED (PID: $pids)"
    if check_health; then
      echo "Health Check: $URL is RESPONDING."
    else
      echo "Health Check: $URL is not responding yet."
    fi
  else
    echo "Port $PORT: FREE (No server running)."
  fi
}

case "$ACTION" in
  stop) stop_server ;;
  start) start_server ;;
  restart)
    stop_server
    sleep 1
    start_server
    ;;
  status) status_server ;;
  *)
    echo "Usage: $0 {start|stop|restart|status} [port] [command] [health_url]"
    exit 1
    ;;
esac
