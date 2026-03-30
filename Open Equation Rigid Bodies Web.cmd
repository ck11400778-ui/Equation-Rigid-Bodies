@echo off
setlocal
cd /d "%~dp0"

if not exist "index.html" (
  echo index.html was not found. Keep this launcher in the game folder.
  pause
  exit /b 1
)

start "" "index.html"
exit /b 0
