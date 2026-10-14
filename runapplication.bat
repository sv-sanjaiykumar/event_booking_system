@echo off
setlocal
pushd "%~dp0"

if not exist "backend\.venv\Scripts\activate.bat" (
    echo Error: The backend virtual environment was not found.
    echo Run setupdev.bat from the project root first.
    popd
    exit /b 1
)

if not exist "frontend\package.json" (
    echo Error: The frontend package.json was not found.
    popd
    exit /b 1
)

if not exist "frontend\node_modules\vite\bin\vite.js" (
    echo Error: Frontend dependencies were not found.
    echo Run setupdev.bat from the project root first.
    popd
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo Error: npm is not installed or is not available on PATH.
    popd
    exit /b 1
)

echo Starting backend in a new terminal window...
start "Event Booking API" /D "%~dp0backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --reload"

echo Starting frontend in a new terminal window...
start "Event Booking Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo The backend and frontend are starting in separate terminal windows.
echo Wait for each server's ready message before opening the application.
echo API documentation: http://127.0.0.1:8000/docs
echo Frontend: http://localhost:5173
popd
exit /b 0
