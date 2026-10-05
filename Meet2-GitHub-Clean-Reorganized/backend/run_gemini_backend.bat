@echo off
setlocal
cd /d "%~dp0"
echo Installing Meet 2 Form 5 backend dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Failed to install dependencies. Check your internet connection/Python setup.
  pause
  exit /b 1
)
python gemini_form5_backend.py
pause
