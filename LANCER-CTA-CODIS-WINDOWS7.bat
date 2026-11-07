@echo off
setlocal
cd /d "%~dp0"
if not exist "index.html" (
  echo CTA CODIS : fichier index.html introuvable.
  pause
  exit /b 1
)
start "" "%~dp0index.html"
exit /b 0
