import time
import random
from queue import Queue

DEVICES = [
    "192.168.50.10",
    "192.168.50.11",
    "192.168.50.12",
    "192.168.50.13",
    "192.168.50.14",
]

SERVERS = [
    "8.8.8.8",
    "1.1.1.1",
    "192.168.50.1",
]

def simulate_attack(attack_type: str, que: Queue):
    start_time = time.time()
    print(f"[ATTACK ENGINE] Starting 15-second background attack simulation: {attack_type}")
    
    while time.time() - start_time < 15.0:
        if attack_type == "PORT_SCAN_VERTICAL":
            # Scan 6 unique ports sequentially on a single host
            scanner = random.choice(DEVICES)
            target = random.choice(SERVERS)
            for port in [80, 443, 22, 21, 3389, 8080]:
                pkt = {
                    "src_ip": scanner,
                    "dst_ip": target,
                    "src_port": random.randint(1024, 65535),
                    "dst_port": port,
                    "protocol": "TCP",
                    "bytes": 60,
                    "syn_count": 1,
                    "ack_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "psh_count": 0,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.05)
            time.sleep(1.0)
            
        elif attack_type == "PORT_SCAN_HORIZONTAL":
            # Target the same port across 11 unique destination IPs
            scanner = random.choice(DEVICES)
            scan_port = random.choice([22, 445, 80])
            for i in range(1, 12):
                pkt = {
                    "src_ip": scanner,
                    "dst_ip": f"192.168.50.{100 + i}",
                    "src_port": random.randint(1024, 65535),
                    "dst_port": scan_port,
                    "protocol": "TCP",
                    "bytes": 60,
                    "syn_count": 1,
                    "ack_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "psh_count": 0,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.05)
            time.sleep(1.0)
            
        elif attack_type == "SYN_FLOOD":
            # Volumetric SYN flood
            attacker = random.choice(DEVICES)
            target = random.choice(SERVERS)
            for _ in range(120):
                pkt = {
                    "src_ip": attacker,
                    "dst_ip": target,
                    "src_port": random.randint(1024, 65535),
                    "dst_port": 80,
                    "protocol": "TCP",
                    "bytes": 60,
                    "syn_count": 1,
                    "ack_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "psh_count": 0,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.002)
            time.sleep(1.5)
            
        elif attack_type == "LAND_ATTACK":
            # LAND spoofing signature: source equals destination IP/port
            target_ip = "192.168.50.10"
            target_port = 80
            pkt = {
                "src_ip": target_ip,
                "dst_ip": target_ip,
                "src_port": target_port,
                "dst_port": target_port,
                "protocol": "TCP",
                "bytes": 60,
                "syn_count": 1,
                "ack_count": 0,
                "fin_count": 0,
                "rst_count": 0,
                "psh_count": 0,
                "timestamp": time.time()
            }
            que.put(pkt)
            time.sleep(1.0)
            
        elif attack_type == "STEALTH_SCAN_XMAS":
            # Xmas scan flag profile: FIN and PSH set
            scanner = random.choice(DEVICES)
            target = random.choice(SERVERS)
            for port in [80, 443, 22, 21, 3389, 8080]:
                pkt = {
                    "src_ip": scanner,
                    "dst_ip": target,
                    "src_port": random.randint(1024, 65535),
                    "dst_port": port,
                    "protocol": "TCP",
                    "bytes": 60,
                    "syn_count": 0,
                    "ack_count": 0,
                    "fin_count": 1,
                    "rst_count": 0,
                    "psh_count": 1,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.05)
            time.sleep(1.5)

        elif attack_type == "STEALTH_SCAN_NULL":
            # Null scan flag profile: No flags set
            scanner = random.choice(DEVICES)
            target = random.choice(SERVERS)
            for port in [80, 443, 22, 21, 3389, 8080]:
                pkt = {
                    "src_ip": scanner,
                    "dst_ip": target,
                    "src_port": random.randint(1024, 65535),
                    "dst_port": port,
                    "protocol": "TCP",
                    "bytes": 60,
                    "syn_count": 0,
                    "ack_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "psh_count": 0,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.05)
            time.sleep(1.5)
            
        elif attack_type == "ICMP_FLOOD":
            # Volumetric ICMP flooding
            attacker = random.choice(DEVICES)
            target = random.choice(SERVERS)
            for _ in range(60):
                pkt = {
                    "src_ip": attacker,
                    "dst_ip": target,
                    "src_port": 0,
                    "dst_port": 0,
                    "protocol": "ICMP",
                    "bytes": 64,
                    "syn_count": 0,
                    "ack_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "psh_count": 0,
                    "timestamp": time.time()
                }
                que.put(pkt)
                time.sleep(0.002)
            time.sleep(1.5)
            
        else:
            break
            
    print(f"[ATTACK ENGINE] Finished background attack simulation: {attack_type}")
