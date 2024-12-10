#!/bin/bash

# Exit on error
set -e

# Set project root directory
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Configuration
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$PROJECT_ROOT/gunicorn.pid"
ACCESS_LOG_FILE="$LOG_DIR/gunicorn_access_$(date +%Y%m%d_%H%M%S).log"
ERROR_LOG_FILE="$LOG_DIR/gunicorn_error_$(date +%Y%m%d_%H%M%S).log"

# Create logs directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') Creating logs directory..."
    mkdir -p "$LOG_DIR"
fi

# Function to stop gunicorn
stop_gunicorn() {
    if [ -f "$PID_FILE" ]; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') Stopping existing gunicorn process..."
        if kill -15 $(cat "$PID_FILE") 2>/dev/null; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') Gunicorn process stopped gracefully"
            rm -f "$PID_FILE"
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') No running gunicorn process found"
            rm -f "$PID_FILE"
        fi
    fi
}

# Stop any existing gunicorn process
stop_gunicorn

# Start gunicorn
echo "$(date '+%Y-%m-%d %H:%M:%S') Starting gunicorn..."
exec gunicorn -c gunicorn.conf.py "wsgi:app" \
    --pid "$PID_FILE" \
    --access-logfile "$ACCESS_LOG_FILE" \
    --error-logfile "$ERROR_LOG_FILE" \
    --capture-output \
    --log-level info