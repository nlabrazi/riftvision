Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  RiftVision - Compagnon Overlay In-Game Transparent" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connexion a http://localhost:3000/overlay..." -ForegroundColor Gray
Write-Host "Assurez-vous que RiftVision est demarre (npm run dev)." -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot

if (Get-Command electron -ErrorAction SilentlyContinue) {
    electron "$PSScriptRoot\desktop-overlay.cjs"
} else {
    Write-Host "Electron n'est pas encore installe globalement sur Windows." -ForegroundColor Yellow
    Write-Host "Installation en cours via npm (une seule fois)..." -ForegroundColor Yellow
    npm install -g electron
    electron "$PSScriptRoot\desktop-overlay.cjs"
}
