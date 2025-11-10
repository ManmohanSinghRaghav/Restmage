# Start Restmage Backend and Frontend

Write-Host "Starting Restmage Application..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[Backend] Starting API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd R:\MiniPro\Restmage\backend
Write-Host 'Backend Starting on http://localhost:5000' -ForegroundColor Green
C:\Users\manmo\AppData\Local\Microsoft\WindowsApps\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\python.exe main.py
"@

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[Frontend] Starting Vite..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd R:\MiniPro\Restmage\frontend
Write-Host 'Frontend Starting on http://localhost:3000' -ForegroundColor Green
npm run dev
"@

Write-Host ""
Write-Host "Both servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000/api/docs" -ForegroundColor White
Write-Host "   Health Check: http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
