@echo off
title TestPilot AI - Launcher
color 0B

echo ===================================================
echo             TESTPILOT AI LAUNCHER
echo   Autonomous Software Testing & Quality Intelligence
echo ===================================================
echo.

if not exist ".env" (
    echo [!] .env not found in root. Copying from .env.example...
    copy .env.example .env >nul
    echo [*] Created .env template. Please add your GEMINI_API_KEY and Firebase keys.
    echo.
)

if not exist "frontend\.env" (
    copy .env frontend\.env >nul
)

echo [*] Starting Demo Target Website on http://localhost:3001 ...
start "TestPilot - Demo Site (:3001)" cmd /k "cd demo-site && python -m http.server 3001"

echo [*] Starting FastAPI Backend on http://localhost:8000 ...
start "TestPilot - Backend (:8000)" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"

echo [*] Starting Vite Frontend on http://localhost:5173 ...
start "TestPilot - Frontend (:5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   All 3 services are launching in separate windows:
echo     1. Frontend App  -^> http://localhost:5173
echo     2. API Backend   -^> http://localhost:8000/docs
echo     3. Target Demo   -^> http://localhost:3001
echo ===================================================
echo.
pause
