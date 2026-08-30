import random
import time
import requests

URL = "http://127.0.0.1:7001/post"

# -----------------------------------
# SIMULATED DEVICES
# -----------------------------------
devices = [
    "192.168.50.10",
    "192.168.50.11",
    "192.168.50.12",
    "192.168.50.13",
    "192.168.50.14",
]

servers = [
    "8.8.8.8",
    "1.1.1.1",
    "192.168.50.1",
]

protocols = ["TCP", "UDP"]

# -----------------------------------
# HELPER TO SEND PACKET
# -----------------------------------
def send_packet(packet, scenario="NORMAL"):
    try:
        r = requests.post(URL, json=packet, timeout=2)
        print(
            f"[{scenario}] {packet['src_ip']}:{packet.get('src_port', '')} "
            f"-> {packet['dst_ip']}:{packet.get('dst_port', '')} "
            f"| {packet['protocol']} "
            f"| status={r.status_code}"
        )
    except Exception as e:
        print(f"[{scenario}] SEND ERROR: {e}")

# -----------------------------------
# PRE-MADE NORMAL FLOWS
# -----------------------------------
flows = []
for _ in range(10):
    flow = {
        "src_ip": random.choice(devices),
        "dst_ip": random.choice(servers),
        "protocol": random.choice(protocols),
        "src_port": random.randint(1024, 65535),
        "dst_port": random.choice([80, 443, 53, 1883]),
    }
    flows.append(flow)

print("Traffic generator started with rule-based scan simulations...")

# -----------------------------------
# MAIN LOOP
# -----------------------------------
while True:
    roll = random.random()

    # Scenario A: Simulate TCP SYN Vertical Port Scan (5% chance)
    if roll < 0.05:
        scanner = random.choice(devices)
        target = random.choice(servers)
        print(f"\n[ATTACK] SIMULATING VERTICAL PORT SCAN ATTACK from {scanner} to {target}...")
        
        # Target 6 unique ports on the same destination host
        for port in [80, 443, 22, 21, 3389, 8080]:
            packet = {
                "src_ip": scanner,
                "dst_ip": target,
                "src_port": random.randint(1024, 65535),
                "dst_port": port,
                "protocol": "TCP",
                "bytes": 60,
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": 1,   # Active SYN scanning
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": 0,
                "psh_count": 0
            }
            send_packet(packet, scenario="VERTICAL SCAN")
            time.sleep(0.1) # Fast sequential scanning
        time.sleep(2.0)

    # Scenario B: Simulate TCP SYN Horizontal Port Scan (5% chance)
    elif roll < 0.10:
        scanner = random.choice(devices)
        scan_port = random.choice([22, 445, 80])
        print(f"\n[ATTACK] SIMULATING HORIZONTAL PORT SCAN ATTACK from {scanner} to port {scan_port}...")
        
        # Target same port across 11 unique destination IPs
        for i in range(1, 12):
            packet = {
                "src_ip": scanner,
                "dst_ip": f"192.168.50.{100 + i}",
                "src_port": random.randint(1024, 65535),
                "dst_port": scan_port,
                "protocol": "TCP",
                "bytes": 60,
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": 1,   # Active SYN scanning
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": 0,
                "psh_count": 0
            }
            send_packet(packet, scenario="HORIZONTAL SCAN")
            time.sleep(0.1)
        time.sleep(2.0)

    # Scenario C: Simulate SYN Flood (5% chance)
    elif roll < 0.15:
        attacker = random.choice(devices)
        target = random.choice(servers)
        print(f"\n[ATTACK] SIMULATING SYN FLOOD ATTACK from {attacker} to {target}...")
        
        # Send 120 SYN packets in under 1 second with no ACKs
        for _ in range(120):
            packet = {
                "src_ip": attacker,
                "dst_ip": target,
                "src_port": random.randint(1024, 65535),
                "dst_port": 80,
                "protocol": "TCP",
                "bytes": 60,
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": 1,
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": 0,
                "psh_count": 0
            }
            send_packet(packet, scenario="SYN FLOOD")
            time.sleep(0.005)
        time.sleep(2.0)

    # Scenario E: Simulate TCP Land Attack (5% chance)
    elif roll < 0.20:
        target_ip = "192.168.50.10"
        target_port = 80
        print(f"\n[ATTACK] SIMULATING TCP LAND ATTACK on {target_ip}:{target_port}...")
        packet = {
            "src_ip": target_ip,
            "dst_ip": target_ip,
            "src_port": target_port,
            "dst_port": target_port,
            "protocol": "TCP",
            "bytes": 60,
            "packets": 1,
            "timestamp": time.time(),
            "syn_count": 1,
            "ack_count": 0,
            "fin_count": 0,
            "rst_count": 0,
            "psh_count": 0
        }
        send_packet(packet, scenario="LAND ATTACK")
        time.sleep(2.0)

    # Scenario F: Simulate Stealth Scan (Null / Xmas Scans) (5% chance)
    elif roll < 0.25:
        scanner = random.choice(devices)
        target = random.choice(servers)
        is_xmas = random.choice([True, False])
        scan_type = "XMAS" if is_xmas else "NULL"
        print(f"\n[ATTACK] SIMULATING STEALTH {scan_type} SCAN from {scanner} to {target}...")
        
        # Scan 6 unique ports
        for port in [80, 443, 22, 21, 3389, 8080]:
            packet = {
                "src_ip": scanner,
                "dst_ip": target,
                "src_port": random.randint(1024, 65535),
                "dst_port": port,
                "protocol": "TCP",
                "bytes": 60,
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": 0,
                "ack_count": 0,
                "fin_count": 1 if is_xmas else 0,
                "rst_count": 0,
                "psh_count": 1 if is_xmas else 0
            }
            send_packet(packet, scenario=f"STEALTH {scan_type} SCAN")
            time.sleep(0.1)
        time.sleep(2.0)

    # Scenario G: Simulate ICMP Flood (5% chance)
    elif roll < 0.30:
        attacker = random.choice(devices)
        target = random.choice(servers)
        print(f"\n[ATTACK] SIMULATING ICMP FLOOD ATTACK from {attacker} to {target}...")
        
        # Send 60 ICMP packets in under 1 second
        for _ in range(60):
            packet = {
                "src_ip": attacker,
                "dst_ip": target,
                "src_port": 0,
                "dst_port": 0,
                "protocol": "ICMP",
                "bytes": 64,
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": 0,
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": 0,
                "psh_count": 0
            }
            send_packet(packet, scenario="ICMP FLOOD")
            time.sleep(0.005)
        time.sleep(2.0)

    # Scenario D: Standard Normal / ML Attack Traffic (70% chance)
    else:
        flow = random.choice(flows)
        # 15% of normal flows are simulated ML anomalies
        is_ml_attack = random.random() < 0.15

        if not is_ml_attack:
            packet = {
                "src_ip": flow["src_ip"],
                "dst_ip": flow["dst_ip"],
                "src_port": flow["src_port"],
                "dst_port": flow["dst_port"],
                "protocol": flow["protocol"],
                "bytes": random.randint(60, 1500),
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": random.choice([0, 1]),
                "ack_count": random.randint(1, 3),
                "fin_count": random.choice([0, 1]),
                "rst_count": 0,
                "psh_count": random.choice([0, 1])
            }
            delay = random.uniform(0.1, 0.4)
        else:
            # Send high rate SYN/RST anomalies for ML detector
            packet = {
                "src_ip": flow["src_ip"],
                "dst_ip": flow["dst_ip"],
                "src_port": flow["src_port"],
                "dst_port": flow["dst_port"],
                "protocol": "TCP",
                "bytes": random.randint(40, 300),
                "packets": 1,
                "timestamp": time.time(),
                "syn_count": random.randint(5, 20),
                "ack_count": random.choice([0, 0, 1]),
                "fin_count": 0,
                "rst_count": random.choice([0, 1]),
                "psh_count": 0
            }
            delay = random.uniform(0.01, 0.05)

        send_packet(packet, scenario="NORMAL" if not is_ml_attack else "ML ANOMALY")
        time.sleep(delay)