@echo off
rem Doppio click per avviare Valutazione posturale su Windows.
cd /d "%~dp0"
start "Valutazione posturale" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
