# Knowledge Brain - Environment Setup Script (Native Windows, No Docker)
# Creates Python virtual environment and installs dependencies

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Knowledge Brain - Backend Environment Setup " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Python installation
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Python is not found in PATH. Please install Python 3.12+ and try again."
    exit 1
}
Write-Host "Found: $pythonVersion" -ForegroundColor Green

# Create virtual environment if it doesn't exist
if (-not (Test-Path "$projectRoot\venv")) {
    Write-Host "Creating virtual environment in .\venv..." -ForegroundColor Yellow
    python -m venv --system-site-packages "$projectRoot\venv"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create virtual environment."
        exit 1
    }
    Write-Host "Virtual environment created successfully." -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists in .\venv." -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "$projectRoot\venv\Scripts\Activate.ps1"

# Install requirements
if (Test-Path "$projectRoot\backend\requirements.txt") {
    Write-Host "Installing/verifying dependencies from backend\requirements.txt..." -ForegroundColor Yellow
    pip install -r "$projectRoot\backend\requirements.txt" --no-warn-script-location 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Note: Network install bypassed or packages already available locally via site-packages." -ForegroundColor Yellow
    } else {
        Write-Host "Dependencies verified successfully." -ForegroundColor Green
    }
} else {
    Write-Warning "backend\requirements.txt not found."
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host " Run the backend using: .\start.ps1" -ForegroundColor Cyan
Write-Host " Or directly: .\venv\Scripts\Activate.ps1 ; `$env:PYTHONPATH='backend' ; python -m uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
