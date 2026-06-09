import time
import requests
import socketio
import sys

# Terminal colors for cool output
CYAN = '\033[96m'
MAGENTA = '\033[95m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

print(f"{MAGENTA}===================================================={RESET}")
print(f"{CYAN}   CIPHERSIGHT TERMINAL SIMULATOR (PYTHON E2E)      {RESET}")
print(f"{MAGENTA}===================================================={RESET}")

BASE_URL = 'http://localhost:5000'

# We use the standard python-socketio client
sio = socketio.Client()

# 1. Authenticate via REST API
print(f"\n[{YELLOW}*{RESET}] Authenticating with backend...")
try:
    # Using the default Admin credentials seeded in app.py
    response = requests.post(f"{BASE_URL}/api/login", json={"badge": "ADMIN-X", "passkey": "root_cipher_zero"})
    response.raise_for_status()
    token = response.json().get('token')
    print(f"[{GREEN}+{RESET}] Authentication Successful! Secure JWT acquired.")
except Exception as e:
    print(f"[{RED}-{RESET}] Authentication failed. Is the backend running? Error: {e}")
    sys.exit(1)

# 2. WebSocket Event Handlers
@sio.on('connect')
def on_connect():
    print(f"[{GREEN}+{RESET}] Connected to CipherSight Secure Socket.IO Grid")

@sio.on('live_tracking')
def on_tracking(data):
    loc = data.get('location')
    status = data.get('status')
    speed = data.get('speed')
    eta = data.get('eta')
    preempted = data.get('preempted', 0)
    
    print(f"  --> {CYAN}[TELEMETRY]{RESET} Status: {YELLOW}{status:<15}{RESET} | Loc: {loc} | Speed: {speed:<2} mph | ETA: {eta}m | Preemptions: {preempted}")
    
    # Auto-Progress the Simulation
    if status == 'AT_PATIENT':
        print(f"\n[{GREEN}+{RESET}] Ambulance arrived at Patient. Stabilizing...")
        time.sleep(2)
        print(f"[{YELLOW}*{RESET}] Initiating transport to Apollo Trauma (Hospital B)...")
        sio.emit('start_transport', {'hospital': 'B'})
        
    elif status == 'ARRIVED':
        print(f"\n[{GREEN}+{RESET}] Mission Complete! Patient safely delivered.")
        sio.disconnect()

# 3. Connect to WebSocket
print(f"\n[{YELLOW}*{RESET}] Connecting to WebSocket server...")
try:
    sio.connect(BASE_URL, auth={'token': token})
except Exception as e:
    print(f"[{RED}-{RESET}] WebSocket connection failed: {e}")
    sys.exit(1)

# 4. Trigger the Mission
print(f"\n[{YELLOW}*{RESET}] Dispatching Sentinel Unit to Emergency Location...")
sio.emit('dispatch_unit')

# 5. Wait for the simulation to finish
sio.wait()

print(f"\n{MAGENTA}===================================================={RESET}")
print(f"{CYAN}   SIMULATION FINISHED                              {RESET}")
print(f"{MAGENTA}===================================================={RESET}")
