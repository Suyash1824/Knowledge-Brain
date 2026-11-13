# Knowledge Brain - Acceptance & Integration Verification Runner
$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Executing Knowledge Brain E2E Integration Suite          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

& "$projectRoot\venv\Scripts\python.exe" "$projectRoot\scripts\verify_e2e_integration.py"

