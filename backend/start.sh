#!/bin/bash
# Render start script

echo "🚀 Starting Restmage API on Render..."
echo "Environment: $ENVIRONMENT"
echo "Port: $PORT"

# Run database migrations if needed (placeholder)
# python -m app.db.migrations

# Start the FastAPI application
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1
