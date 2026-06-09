@echo off
echo ==============================================
echo  CipherSight Setup and Launch Script
echo ==============================================
echo.

echo [1/4] Setting up Backend Dependencies...
cd ciphersight-backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Initializing Database (SQLite)...
python seed_db.py

echo.
echo [3/4] Starting Backend Server...
start "CipherSight Backend" cmd /k "call venv\Scripts\activate.bat && python app.py"
cd ..

echo.
echo [4/4] Setting up and Starting Frontend...
cd ciphersight-frontend
echo Installing Node.js dependencies...
call npm install
echo Starting Vite Dev Server...
start "CipherSight Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ==============================================
echo  ALL SERVICES STARTED!
echo  Backend running on: http://localhost:5000
echo  Frontend running on: http://localhost:5173
echo ==============================================
pause
