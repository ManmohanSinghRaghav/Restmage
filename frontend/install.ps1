# Install frontend dependencies
Set-Location "R:\MiniPro\Restmage\frontend"

Write-Host "Cleaning old dependencies..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
}

Write-Host "Installing Vite and dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host "Run 'npm start' or 'npm run dev' to start the development server" -ForegroundColor Cyan
