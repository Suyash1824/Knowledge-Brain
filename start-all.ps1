# Knowledge Brain - Unified Full-Stack Application Launcher
# Starts both Backend (Port 8000) and Frontend (Port 3000) in concurrent processes

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " KNOWLEDGE BRAIN — UNIFIED FULL-STACK LAUNCHER            " -ForegroundColor Cyan
Write-Host " Backend:  http://127.0.0.1:8000 (FastAPI + Swagger Docs) " -ForegroundColor Cyan
Write-Host " Frontend: http://localhost:3000 (React + 3D Core SPA)   " -ForegroundColor Cyan
Write-Host " Database: Neon Cloud PostgreSQL (pgvector active)        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Launch backend process
Write-Host "Launching backend process..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-File `"$projectRoot\start-backend.ps1`"" -PassThru

Start-Sleep -Seconds 2

# Launch frontend process
Write-Host "Launching frontend process..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-File `"$projectRoot\start-frontend.ps1`"" -PassThru

Write-Host "`nBoth processes launched successfully!" -ForegroundColor Green
Write-Host "To access the application, open your browser at: http://localhost:3000" -ForegroundColor Cyan
