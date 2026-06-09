# CipherSight - Complete Project

This project includes the frontend, backend, and an embedded SQLite database, ready to run.

## Setup & Run Instructions

To make it incredibly easy for you to run everything at once, I have created a `START_PROJECT.bat` file in the main folder.

### **The Quick Way**
1. Double-click on `START_PROJECT.bat` located in this folder (`CipherSight\START_PROJECT.bat`).
2. The script will automatically:
   - Create a Python virtual environment and install backend dependencies.
   - Initialize the SQLite database and seed the default data.
   - Start the Backend server in a new window.
   - Install the Node.js frontend dependencies.
   - Start the Vite frontend server in a new window.

### **Manual Setup (If needed)**

**Backend & Database:**
1. Open a terminal and go into the `ciphersight-backend` folder.
2. Run `python -m venv venv` to create a virtual environment.
3. Activate it: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Initialize the database: `python seed_db.py` (This will create `instance/ciphersight.db` automatically using SQLite, no MySQL required!)
6. Start the backend: `python app.py`

**Frontend:**
1. Open another terminal and go into the `ciphersight-frontend` folder.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

### **Default Credentials**
You can log in to the Operator Dashboard using the following credentials seeded in the database:
- **Badge ID:** `OP-108`
- **Passkey:** `cipher2026`

*(Admin credentials are `ADMIN-X` / `root_cipher_zero`)*
