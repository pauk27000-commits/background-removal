@echo off
title Launching Background Removal App

cd /d "%~dp0"

:: 1. Check if python is working and start.py runs
python -c "import sys" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Starting local server via system Python...
    python start.py
    if %errorlevel% equ 0 goto end
)

:: 2. Check local Python in relative Assets path
set "LOCAL_PYTHON=..\..\Data\Assets\Python310\python.exe"
if exist "%LOCAL_PYTHON%" (
    echo [INFO] Starting local server via local Python 3.10...
    "%LOCAL_PYTHON%" start.py
    if %errorlevel% equ 0 goto end
)

:: 3. Fallback to PowerShell
echo [WARNING] Python not found or failed. Starting via PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"

:end
