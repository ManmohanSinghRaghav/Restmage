@echo off
REM Startup script for Restmage FastAPI Backend
REM This script starts the FastAPI server with all required configuration

echo.
echo ========================================
echo    Restmage FastAPI Backend
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating from .env.example...
    copy .env.example .env
)

echo Starting FastAPI server...
echo.
echo API Documentation: http://localhost:5000/api/docs
echo Health Check: http://localhost:5000/api/health
echo.

REM Start server with Python module
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload

pause
