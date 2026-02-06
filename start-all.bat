@echo off
echo ========================================
echo   Document Manager - Starting...
echo ========================================
echo.

echo Starting Backend Server...
start "Document Manager Backend" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Document Manager Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit (servers will keep running)
pause > nul
