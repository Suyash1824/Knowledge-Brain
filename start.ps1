# Knowledge Brain - Backend Startup Script (Native Windows, No Docker)
# Activates the Python virtual environment and launches FastAPI via Uvicorn

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

# Set PYTHONPATH to include backend directory so "app.main:app" imports seamlessly
$env:PYTHONPATH = "$projectRoot\backend"

# Run Uvicorn ASGI server
Write-Host "Starting Uvicorn server on http://127.0.0.1:8000 (reload enabled)..." -ForegroundColor Green
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
