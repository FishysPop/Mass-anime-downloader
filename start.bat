@echo off


REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node is Installed

call npm i


REM Run npm run start
npm run start

REM Pause to keep the window open after npm run start completes
pause