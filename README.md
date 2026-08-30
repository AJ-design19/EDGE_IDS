# EdgeIDS — AI-Powered Network Intrusion Detection System

EdgeIDS is a real-time network intrusion detection and monitoring system that combines **machine learning**, **FastAPI**, and a modern **Next.js dashboard** to analyze network activity, detect potential threats, and visualize security events.

The system uses a **TensorFlow Lite model** for lightweight inference and provides real-time communication between the backend and dashboard using **WebSockets**.

---

##  Features

* **ML-Based Intrusion Detection** — TensorFlow Lite model for network traffic classification
*  **Real-Time Monitoring** — Live security events delivered through WebSockets
*  **Interactive Security Dashboard** — Modern Next.js interface for monitoring IDS activity
* **Attack Simulation** — Generate attack scenarios for testing the detection pipeline
*  **REST API** — FastAPI endpoints for interacting with the detection system
*  **WebSocket Communication** — Real-time backend-to-dashboard updates
* **Optional ngrok Support** — Expose the backend for remote testing
* **Local Development Support** — Backend and frontend can run independently on localhost

---

##  System Architecture

```text
                    ┌─────────────────────┐
                    │   Network Traffic   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │     Port 7001       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ TensorFlow Lite ML  │
                    │       Model         │
                    └──────────┬──────────┘
                               │
                     Detection / Prediction
                               │
                    ┌──────────▼──────────┐
                    │ REST + WebSockets   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Next.js Dashboard  │
                    │     Port 3000       │
                    └─────────────────────┘
```

---

##  Tech Stack

### Backend

* Python
* FastAPI
* Uvicorn
* TensorFlow
* TensorFlow Lite
* NumPy
* WebSockets
* Pyngrok
* Python Dotenv

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts
* Framer Motion
* Three.js
* GSAP

---

##  Project Structure

```text
EdgeIDS/
│
├── Backend/
│   ├── main.py
│   ├── genrateTraffic.py
│   ├── requirements.txt
│   ├── model/
│   └── .env
│
├── ids/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── hooks/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

> `.env`, virtual environments, `node_modules`, and build files should never be committed to the repository.

---

# ⚙️ Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Anshd14/EDGEIDS.git
cd EDGEIDS
```

---

## 2. Backend Setup

Python **3.11** is recommended.

```bash
cd Backend
python3.11 -m venv venv
```

Activate the virtual environment.

### macOS / Linux

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

##  Environment Variables

Create:

```text
Backend/.env
```

If ngrok tunneling is required, add:

```env
NGROK_AUTH_TOKEN=your_ngrok_auth_token
```

Never commit `.env`, API keys, authentication tokens, or other credentials to GitHub.

---

## 3. Run the Backend

From the `Backend` directory:

```bash
source venv/bin/activate
python main.py
```

The backend runs at:

```text
http://localhost:7001
```

Health check:

```text
http://localhost:7001/check
```

FastAPI Swagger documentation:

```text
http://localhost:7001/docs
```

---

## 4. Frontend Setup

Open another terminal:

```bash
cd EDGEIDS/ids
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# ▶️ Running EdgeIDS After Initial Setup

Once the dependencies have been installed, EdgeIDS can be started using two terminals.

### Terminal 1 — Backend

```bash
cd EDGEIDS/Backend
source venv/bin/activate
python main.py
```

### Terminal 2 — Frontend

```bash
cd EDGEIDS/ids
npm run dev
```

Then visit:

```text
http://localhost:3000
```

---

##  API & WebSocket Communication

The frontend communicates with the FastAPI backend using REST APIs and WebSockets.

### Backend

```text
http://localhost:7001
```

### WebSocket

```text
ws://localhost:7001/ws
```

### Health Check

```text
GET /check
```

### Attack Simulation

```text
/attack
```

The attack simulation interface can be used to test how the intrusion detection pipeline responds to different network scenarios.

---

##  Machine Learning Pipeline

```text
Network / Input Data
        │
        ▼
Data Processing
        │
        ▼
Feature Sequence
        │
        ▼
TensorFlow Lite Model
        │
        ▼
Prediction
        │
        ▼
Security Event
        │
        ▼
FastAPI + WebSocket
        │
        ▼
Dashboard Visualization
```

The TensorFlow Lite model provides lightweight inference while FastAPI handles API communication and real-time event delivery.

---

##  Testing

Verify that the backend is running:

```bash
curl http://localhost:7001/check
```

Expected response:

```json
{
  "status": "ok"
}
```

Interactive API documentation is available at:

```text
http://localhost:7001/docs
```

---

##  Security Practices

Sensitive credentials should always be stored using environment variables rather than hardcoded in source files.

Local development files ignored by Git include:

```text
Backend/venv/
ids/node_modules/
ids/.next/
.env
Backend/.env
__pycache__/
.DS_Store
```

If a credential is accidentally exposed publicly, it should be revoked and rotated immediately.

---

---

##  Contributing

Contributions, issues, and feature suggestions are welcome.

```bash
git checkout -b feature/your-feature
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

Then open a pull request.

---

##  Disclaimer

EdgeIDS is intended for **educational, research, network-security learning, and authorized cybersecurity testing purposes only**.

Only analyze or test networks and systems that you own or have explicit permission to access.

---

 If you find EdgeIDS useful, consider starring the repository.

