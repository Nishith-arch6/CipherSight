# 🛡️ CipherSight: Intelligent Emergency Vehicle Preemption & Traffic Control Grid

CipherSight is a real-time, AI-driven traffic preemption and emergency vehicle dispatch tracking system. It integrates computer vision, web sockets, database persistence, and a responsive frontend dashboard to prioritize emergency vehicles (ambulances) during critical dispatches, creating a dynamic "green wave" at intersections.

This project is fully ready to run locally (with SQLite/Flask/Socket.io backend) or in a standalone cloud mode (deployed to Vercel with automatic browser-side offline fallback simulations).

---

## 🚀 Key Features

1. **Dual-Mode System & Standalone Vercel Fallback**:
   - **Online Mode:** Connected to the Flask/Python backend, leveraging real-time WebSockets (Socket.io) for live GPS updates and SQLAlchemy/SQLite for user registration and analytics.
   - **Offline/Vercel Mode:** If the backend is offline or the app is deployed to Vercel without a database, the frontend automatically transitions to **Offline Fallback**. It uses `localStorage` for operator authentication and runs browser-based simulation loops to emulate live tracking.

2. **Full 4-Hospital Grid Synchronization**:
   - Plots markers for all 4 central hospitals on the map:
     - 🟢 **City Central Hospital** (Trauma II)
     - 🔵 **Apollo Trauma Center** (Trauma I - Specialized)
     - 🟡 **General Medical Center** (Trauma III)
     - 🟣 **St. Mary's Care Hospital** (General)
   - Real-time capacity grids tracking ICU beds, ventilators, blood bank supplies, operating rooms, and active staff.
   - Hospital statistics are synced across the map, reports panel, right sidebar widget, and hospital selection controls.

3. **Google Maps-Style Light Theme**:
   - Leaflet map rendering utilizes CartoDB Voyager light tiles for a clean, professional appearance.

4. **Ambulance Dispatch & Precise Route-Following**:
   - High-fidelity route tracing with 15–21 dense geographic waypoints for all 4 hospitals.
   - The ambulance icon accurately follows road paths during transit.

5. **AI Computer Vision Intersection Verify**:
   - Real-time vehicle classification (cars, trucks, motorcycles, buses) using a **YOLOv8** model analyzing camera streams.
   - Dynamic CCTV camera feed modal showing bounding boxes. Falls back to a local packaged `traffic.mp4` video with client-side canvas bounding box overlays in offline mode.

6. **Interactive Admin Dashboard**:
   - Manage operator registries (active, offline, revoked badges).
   - Live health tracking for global infrastructure nodes with remote reboot capabilities.
   - Real-time security and JWT event log stream.

---

## 🛠️ Setup & Run Instructions

To make it easy for you to run everything at once, a script is included in the main folder.

### **The Quick Way**
1. Double-click on `START_PROJECT.bat` located in the root folder (`CipherSight\START_PROJECT.bat`).
2. The script will automatically:
   - Create a Python virtual environment and install backend dependencies.
   - Initialize the SQLite database and seed the default data.
   - Start the Backend server in a new window.
   - Install the Node.js frontend dependencies.
   - Start the Vite frontend server in a new window.

### **Manual Setup (If needed)**

#### **Backend & Database:**
1. Open a terminal and go into the `ciphersight-backend` folder.
2. Run `python -m venv venv` to create a virtual environment.
3. Activate it: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Initialize the database: `python seed_db.py` (This will create `instance/ciphersight.db` automatically using SQLite).
6. Start the backend: `python app.py`

#### **Frontend:**
1. Open another terminal and go into the `ciphersight-frontend` folder.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

---

## 🔐 Default Credentials
You can log in to the system using the following seeded credentials:

*   **Operator Dashboard:**
    *   **Badge ID:** `OP-108`
    *   **Passkey:** `cipher2026`
*   **Admin Dashboard:**
    *   **Badge ID:** `ADMIN-X`
    *   **Passkey:** `root_cipher_zero`

---

## 💻 Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Leaflet Map (React-Leaflet), Recharts, Socket.io-Client, Cobe (3D Globe).
- **Backend:** Python Flask, Flask-SocketIO, PyJWT, SQLite, SQLAlchemy.
- **AI Engine:** YOLOv8 (Ultralytics) & OpenCV.
