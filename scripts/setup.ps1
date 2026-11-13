# Knowledge Brain - Helper script to run root setup.ps1
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Item $PSScriptRoot).Parent.FullName
}
& "$projectRoot\setup.ps1"
