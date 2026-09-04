@echo off
:: Hassan Traderz POS — Windows Desktop App Launcher
:: Launches the POS system in standalone dedicated application mode
title Hassan Traderz POS Launcher

:: Check for Microsoft Edge or Google Chrome
set APP_URL=http://localhost:5173

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=%APP_URL% --window-size=1280,800
    exit
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=%APP_URL% --window-size=1280,800
    exit
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=%APP_URL% --window-size=1280,800
    exit
)

:: Fallback default browser
start %APP_URL%
exit
