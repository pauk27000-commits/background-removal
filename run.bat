@echo off
title Launching Background Removal App

cd /d "%~dp0"

:: 1. Check if python is in system PATH
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Starting local server via system Python...
    python start.py
    goto end
)

:: 2. Check local Python in relative Assets path
set "LOCAL_PYTHON=..\..\Data\Assets\Python310\python.exe"
if exist "%LOCAL_PYTHON%" (
    echo [INFO] Starting local server via local Python 3.10...
    "%LOCAL_PYTHON%" start.py
    goto end
)

:: 3. Fallback to PowerShell
echo [WARNING] Python not found. Trying to start via PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

:end
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start the server.
    pause
)
