# Knowledge Brain - Frontend Startup Script
# Starts the Vite React 18 production/development server on port 3000

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}
Set-Location "$projectRoot\frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Knowledge Brain Frontend (UI)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Frontend server running at http://localhost:3000 (Proxying /api -> http://127.0.0.1:8000)" -ForegroundColor Green
npm.cmd run dev
