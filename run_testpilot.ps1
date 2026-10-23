# TestPilot AI - PowerShell One-Click Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            TESTPILOT AI LAUNCHER" -ForegroundColor Cyan
Write-Host "  Autonomous Software Testing & Quality Intelligence" -ForegroundColor DarkCyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

if (-not (Test-Path "$rootDir\.env")) {
    Write-Host "[!] .env not found. Copying .env.example -> .env ..." -ForegroundColor Yellow
    Copy-Item "$rootDir\.env.example" "$rootDir\.env"
}

if (-not (Test-Path "$rootDir\frontend\.env")) {
    Copy-Item "$rootDir\.env" "$rootDir\frontend\.env"
}

Write-Host "[1/3] Starting Target Demo Website (http://localhost:3001) ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\demo-site'; Write-Host '--- Demo Target Site (:3001) ---' -ForegroundColor Yellow; python -m http.server 3001"

Write-Host "[2/3] Starting FastAPI Backend (http://localhost:8000) ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; Write-Host '--- TestPilot Backend API (:8000) ---' -ForegroundColor Cyan; python -m uvicorn main:app --reload --port 8000"

Write-Host "[3/3] Starting React Frontend (http://localhost:5173) ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; Write-Host '--- TestPilot Frontend (:5173) ---' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "All 3 services have been launched in separate windows!" -ForegroundColor Cyan
Write-Host "-> Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "-> Backend Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "-> Demo Site:    http://localhost:3001" -ForegroundColor White
Write-Host ""
