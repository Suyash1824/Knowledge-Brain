# Knowledge Brain - Backend Startup Script
# Activates the Python virtual environment and launches FastAPI on port 8000

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting Knowledge Brain Backend Server " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path "$projectRoot\venv\Scripts\Activate.ps1")) {
    Write-Warning "Virtual environment not found. Running setup first..."
    & "$projectRoot\setup.ps1"
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "$projectRoot\venv\Scripts\Activate.ps1"

# Set PYTHONPATH
$env:PYTHONPATH = "$projectRoot\backend"

# Run Uvicorn ASGI server
Write-Host "FastAPI server running at http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)" -ForegroundColor Green
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
