@echo off
title RentHub AI Microservice
echo =========================================================
echo  Starting RentHub Local AI Microservice on port 8000...
echo =========================================================
cd /d "%~dp0ai-service"
if not exist ".venv\Scripts\python.exe" (
    echo Error: Virtual environment not found in ai-service\.venv
    echo Please make sure the environment is set up.
    pause
    exit /b 1
)
call .venv\Scripts\activate
python main.py
pause
