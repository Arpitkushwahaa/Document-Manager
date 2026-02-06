@echo off
echo ========================================
echo   Document Manager - Setup Script
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the application:
echo   1. Run 'start-backend.bat' in one terminal
echo   2. Run 'start-frontend.bat' in another terminal
echo.
echo Or run 'start-all.bat' to start both automatically
echo.
pause
