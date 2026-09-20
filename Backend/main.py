import os
from queue import Queue
from threading import Thread
import time
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from queue import Full
from pyngrok import ngrok
import uvicorn
from contextlib import asynccontextmanager

from packet_consumer import consumer
from websocket_manager import manager
from attack_generator import simulate_attack

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Capture the current running event loop and pass it to manager
    manager.set_loop(asyncio.get_running_loop())
    yield
    # Cleanup if necessary



app = FastAPI(lifespan=lifespan)
que = Queue(maxsize=10000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

thread = Thread(
    target=consumer,
    args=(que,),
    daemon=True
)





class Packet(BaseModel):

    src_ip: str
    dst_ip: str

    src_port: int
    dst_port: int

    protocol: str

    bytes: int

    timestamp: float

    syn_count: int
    ack_count: int
    fin_count: int
    rst_count: int
    psh_count: int

@app.on_event("startup")
async def startup_event():

    manager.set_loop(
        asyncio.get_running_loop()
    )


@app.get("/check")
def check():
    return {"status": "ok"}
@app.post("/post")
def add_queue(packet: Packet):
    data = packet.dict()
    data["timestamp"] = time.time()
    # print("RECEIVED:", data)

    try:
        que.put(data, timeout=1)
        return {"status": "ok"}
    except Full:
        return {"status": "dropped"}  

@app.post("/attack")
def start_attack(attack_type: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(simulate_attack, attack_type, que)
    return {"status": "started", "attack": attack_type, "duration_seconds": 15}  
    
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, client might send pings
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    thread.start()
    ngrok_token = os.getenv("NGROK_AUTH_TOKEN")
    try:
        ngrok.set_auth_token(ngrok_token)
        public_url = ngrok.connect(7001)
        print("🚀 NGROK Tunnel established:", public_url)
    except Exception as e:
        print("⚠️ Failed to establish NGROK tunnel (starting server locally instead):", e)
        
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7001
    )
# ── MITRE ATT&CK Mapping ──────────────
MITRE_MAP = {
    "Port Scan"        : ("TA0043", "Reconnaissance"),
    "Reconnaissance"   : ("TA0043", "Reconnaissance"),
    "Brute Force SSH"  : ("TA0001", "Initial Access"),
    "DDoS HTTP Flood"  : ("TA0040", "Impact"),
    "DDoS UDP Flood"   : ("TA0040", "Impact"),
    "Mirai Botnet"     : ("TA0011", "Command & Control"),
    "DNS Amplification": ("TA0040", "Impact"),
    "ARP Spoofing"     : ("TA0006", "Credential Access"),
    "MQTT Exploit"     : ("TA0001", "Initial Access"),
    "Anomalous Traffic": ("TA0007", "Discovery"),
}

def get_mitre_stage(attack_type: str):
    return MITRE_MAP.get(
        attack_type,
        ("TA0000", "Unknown")
    )

# ── K-Step Forward Prediction ─────────
def predict_k_steps(features, k: int = 5):
    predictions = []
    current = features.copy()
    for step in range(k):
        prob, lat = predict_one(current)
        atype, sev = get_attack_type(prob)
        mitre_id, mitre_stage = \
            get_mitre_stage(atype)
        predictions.append({
            "step"        : step + 1,
            "prob"        : round(prob, 4),
            "is_attack"   : prob > 0.5,
            "attack_type" : atype,
            "severity"    : sev,
            "mitre_id"    : mitre_id,
            "mitre_stage" : mitre_stage,
            "latency_ms"  : round(lat, 2),
        })
    return predictions
