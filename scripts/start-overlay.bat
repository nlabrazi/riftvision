@echo off
pushd "%~dp0"
title RiftVision - Overlay In-Game Companion
echo ========================================================
echo   RiftVision - Compagnon Overlay In-Game Transparent
echo ========================================================
echo.
echo Connexion au serveur RiftVision (http://localhost:3000/overlay)...
echo Assurez-vous que RiftVision est demarre (npm run dev).
echo.

where electron >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    electron desktop-overlay.cjs
) else (
    echo Electron n'est pas installe globalement sur Windows.
    echo Installation en cours (une seule fois)...
    call npm install -g electron
    electron desktop-overlay.cjs
)

popd
pause
