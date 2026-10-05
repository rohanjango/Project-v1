@echo off
setlocal
cd /d "%~dp0.."
python tools\inspect_saved_profile.py
pause
