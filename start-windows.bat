@echo off
REM Sarah's Brain — Windows launcher
REM Double-click this file to start the app.

setlocal
set DIR=%~dp0

echo.
echo   Starting Sarah's Brain...
echo.

REM Install server dependencies if needed
if not exist "%DIR%server\node_modules" (
  echo   Installing server dependencies (first run only)...
  npm install --prefix "%DIR%server"
)

REM Build client if dist folder is missing
if not exist "%DIR%client\dist" (
  echo   Installing client dependencies (first run only)...
  npm install --prefix "%DIR%client"
  echo   Building the app (first run only, takes ~30 seconds)...
  "%DIR%client\node_modules\.bin\vite.cmd" build --outDir "%DIR%client\dist"
)

REM Kill any process on port 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001"') do (
  taskkill /f /pid %%a >nul 2>&1
)

REM Start server
start "Sarah's Brain Server" /min node "%DIR%server\index.js"

REM Wait for server
timeout /t 2 /nobreak >nul

REM Open browser
start "" "http://localhost:3001"

echo   Sarah's Brain is open in your browser.
echo   The server is running in the background.
echo   To stop it, close the minimized "Sarah's Brain Server" window.
echo.
pause
