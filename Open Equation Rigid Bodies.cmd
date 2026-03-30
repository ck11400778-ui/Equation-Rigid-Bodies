@echo off
setlocal
cd /d "%~dp0"

if not exist "package.json" (
  echo package.json was not found. Keep this launcher in the game folder.
  pause
  exit /b 1
)

if not exist "node_modules\electron" (
  echo Electron dependencies were not found.
  echo Run npm.cmd install in this folder first.
  pause
  exit /b 1
)

start "" npm.cmd start
exit /b 0
