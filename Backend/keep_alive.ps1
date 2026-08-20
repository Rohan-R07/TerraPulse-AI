$ErrorActionPreference = "Continue"
Write-Output "Starting TerraPulse AI Backend Daemon Keep-Alive..."
while ($true) {
    Write-Output "Launching Uvicorn server at $(Get-Date)..."
    & .\venv\Scripts\python.exe -m uvicorn main:app --port 8000 --host 0.0.0.0
    Write-Output "Uvicorn server stopped unexpectedly at $(Get-Date). Restarting in 3 seconds..."
    Start-Sleep -Seconds 3
}
