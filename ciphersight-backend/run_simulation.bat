@echo off
color 0b
echo ====================================================
echo      CIPHERSIGHT AUTO-RUNNER (BACKEND + SIMULATOR)
echo ====================================================
echo.

echo [1/3] Checking and installing Python dependencies...
pip install requests "python-socketio[client]" flask flask-socketio flask-sqlalchemy flask-cors pymysql cryptography
echo.

echo [2/3] Starting CipherSight Backend (app.py) in a new window...
start "CipherSight Backend Server" cmd /k "python app.py"

echo.
echo Waiting 5 seconds for the backend to initialize and connect to MySQL...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Starting the End-to-End Python Simulator...
python sim_runner.py

echo.
pause
