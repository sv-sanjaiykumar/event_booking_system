@echo off
setlocal
pushd "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Error: Python is not installed or is not available on PATH.
    echo Install Python 3.9 or newer, then run this script again.
    popd
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo Error: npm is not installed or is not available on PATH.
    echo Install Node.js and npm, then run this script again.
    popd
    exit /b 1
)

echo Setting up backend...
pushd backend
if errorlevel 1 (
    echo Error: Could not enter the backend directory.
    popd
    exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
    if errorlevel 1 goto backend_error
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 goto backend_error

python -m pip install --upgrade pip
if errorlevel 1 goto backend_error

python -m pip install -e ".[test]"
if errorlevel 1 goto backend_error

if not exist ".env" (
    copy ".env.example" ".env" >nul
    if errorlevel 1 goto backend_error
)

python -c "from pathlib import Path; import secrets; p=Path('.env'); s=p.read_text(encoding='utf-8'); k='JWT_SECRET_KEY='; old=next((x for x in s.splitlines() if x.startswith(k)),None); p.write_text(s.replace(old,k+secrets.token_hex(32),1) if old is not None and not old[len(k):].strip() else s if old is not None else s.rstrip()+'\n'+k+secrets.token_hex(32)+'\n',encoding='utf-8')"
if errorlevel 1 goto backend_error

alembic upgrade head
if errorlevel 1 goto backend_error
popd

echo Setting up frontend...
pushd frontend
if errorlevel 1 (
    echo Error: Could not enter the frontend directory.
    popd
    exit /b 1
)

npm install
if errorlevel 1 (
    popd
    popd
    exit /b 1
)
popd

echo Setup complete.
echo Start the backend from the backend folder with:
echo   .venv\Scripts\activate
echo   uvicorn app.main:app --reload
echo Start the frontend from the frontend folder with:
echo   npm run dev
popd
exit /b 0

:backend_error
echo Error: Backend setup failed. Review the command output above.
popd
popd
exit /b 1
