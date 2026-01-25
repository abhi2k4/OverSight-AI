Write-Host "Starting OverSight Backend with Uvicorn..." -ForegroundColor Green
Write-Host ""
Set-Location (Split-Path $PSScriptRoot -Parent)
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
