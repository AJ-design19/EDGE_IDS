import time
import threading
from collections import defaultdict, deque

# Threat Constants
PORT_SCAN_VERTICAL = "PORT_SCAN_VERTICAL"
PORT_SCAN_HORIZONTAL = "PORT_SCAN_HORIZONTAL"
PORT_SCAN_COMPOSITE = "PORT_SCAN_COMPOSITE"
SYN_FLOOD = "SYN_FLOOD"
VOLUMETRIC_FLOOD = "VOLUMETRIC_FLOOD"
LAND_ATTACK = "LAND_ATTACK"
STEALTH_SCAN = "STEALTH_SCAN"
ICMP_FLOOD = "ICMP_FLOOD"

class RulesEngine:
    def __init__(self, scan_window=10.0, flood_window=2.0, cooldown_sec=30.0):
        self.scan_window = scan_window
        self.flood_window = flood_window
        self.cooldown_sec = cooldown_sec

        # Maps src_ip -> deque of packet dicts
        self.history = defaultdict(deque)
        
        # Maps (src_ip, threat_type) -> timestamp
        self.last_alert = {}
        
        # Thread safety lock
        self.lock = threading.Lock()

        # Start background pruning thread to clean up stale source IPs
        self.cleanup_thread = threading.Thread(target=self._global_cleanup_loop, daemon=True)
        self.cleanup_thread.start()

    def _global_cleanup_loop(self):
        """Periodically sweeps and removes inactive IPs from memory to avoid leaks."""
        while True:
            time.sleep(30.0)
            now = time.time()
            with self.lock:
                keys = list(self.history.keys())
            
            for src_ip in keys:
                with self.lock:
                    if src_ip not in self.history:
                        continue
                    # Remove elements older than max window (10.0 seconds)
                    while self.history[src_ip] and (now - self.history[src_ip][0]["time"] > self.scan_window):
                        self.history[src_ip].popleft()
                    
                    # If empty, delete the source IP entry completely
                    if not self.history[src_ip]:
                        del self.history[src_ip]

    def check_packet(self, packet) -> list:
        """
        Process a single packet and return a list of triggered threat constants.
        Keep execution complexity minimal for ingestion performance.
        """
        now = time.time()
        src_ip = packet.get("src_ip")
        dst_ip = packet.get("dst_ip")
        src_port = packet.get("src_port")
        dst_port = packet.get("dst_port")
        syn_count = packet.get("syn_count", 0)
        ack_count = packet.get("ack_count", 0)
        bytes_count = packet.get("bytes", 0)
        protocol = packet.get("protocol", "").upper()

        is_tcp = (protocol == "TCP")
        # An active TCP scan packet is SYN-only (SYN=1, ACK=0)
        is_syn = is_tcp and (syn_count > 0) and (ack_count == 0)

        triggered_threats = []

        with self.lock:
            # 1. Record the packet event details
            self.history[src_ip].append({
                "time": now,
                "dst_ip": dst_ip,
                "dst_port": dst_port,
                "bytes": bytes_count,
                "syn_count": syn_count,
                "ack_count": ack_count,
                "is_syn": is_syn,
                "is_tcp": is_tcp,
                "is_icmp": (protocol == "ICMP")
            })

            # 2. Local pruning: Remove expired entries relative to the maximum scan window
            while self.history[src_ip] and (now - self.history[src_ip][0]["time"] > self.scan_window):
                self.history[src_ip].popleft()

            # If the queue has elements, extract windows
            history_list = list(self.history[src_ip])

        # Separate items for scan window (10s) vs flood window (2s)
        scan_events = [e for e in history_list if (now - e["time"]) <= self.scan_window]
        flood_events = [e for e in history_list if (now - e["time"]) <= self.flood_window]

        # -------------------------
        # PORT SCAN ALGORITHMS
        # -------------------------
        # Only analyze TCP SYN packets for scans to prevent False Positives from standard high-frequency traffic
        syn_events = [e for e in scan_events if e["is_syn"]]
        
        if syn_events:
            # Unique destinations and ports targeted
            destinations = {e["dst_ip"] for e in syn_events}
            ports = {e["dst_port"] for e in syn_events}
            pairs = {(e["dst_ip"], e["dst_port"]) for e in syn_events}

            # PORT_SCAN_HORIZONTAL: Scanning same/different ports across >= 10 unique destination IPs
            if len(destinations) >= 10:
                triggered_threats.append(PORT_SCAN_HORIZONTAL)

            # PORT_SCAN_VERTICAL: Scanning >= 5 unique ports on a single host
            # Group by dst_ip to check vertical scans per destination
            dst_ports_map = defaultdict(set)
            for e in syn_events:
                dst_ports_map[e["dst_ip"]].add(e["dst_port"])
            
            for dst, p_set in dst_ports_map.items():
                if len(p_set) >= 5:
                    triggered_threats.append(PORT_SCAN_VERTICAL)
                    break

            # PORT_SCAN_COMPOSITE: General port sweeping of >= 8 unique host/port endpoints
            if len(pairs) >= 8:
                triggered_threats.append(PORT_SCAN_COMPOSITE)

        # -------------------------
        # FLOOD ALGORITHMS
        # -------------------------
        if flood_events:
            total_syn = sum(e["syn_count"] for e in flood_events if e["is_tcp"])
            total_ack = sum(e["ack_count"] for e in flood_events if e["is_tcp"])
            total_bytes = sum(e["bytes"] for e in flood_events)
            total_packets = len(flood_events)

            # SYN Flood: High rate of SYN packets with very low response rate (SYN >= 100, SYN/ACK >= 10)
            if total_syn >= 100:
                ratio = total_syn / max(total_ack, 1)
                if ratio >= 10.0:
                    triggered_threats.append(SYN_FLOOD)

            # Volumetric Flood (Empirical threshold based on dataset/simulator limits)
            # >= 200 packets or >= 2 MB (2,000,000 bytes) in 2 seconds
            if total_packets >= 200 or total_bytes >= 2000000:
                triggered_threats.append(VOLUMETRIC_FLOOD)

            # ICMP Flood: High rate of ICMP packets (>= 50 ICMP packets) in 2 seconds
            total_icmp = sum(1 for e in flood_events if e["is_icmp"])
            if total_icmp >= 50:
                triggered_threats.append(ICMP_FLOOD)

        # -------------------------
        # PACKET-SIGNATURE RULES
        # -------------------------
        if is_tcp:
            # LAND Attack: TCP packet with identical Source/Destination IPs & Ports
            if src_ip and dst_ip and src_port and dst_port:
                if src_ip == dst_ip and src_port == dst_port:
                    triggered_threats.append(LAND_ATTACK)

            # Stealth Scan (Null/Xmas Scans)
            fin_count = packet.get("fin_count", 0)
            rst_count = packet.get("rst_count", 0)
            psh_count = packet.get("psh_count", 0)
            
            is_null = (syn_count == 0 and ack_count == 0 and fin_count == 0 and rst_count == 0 and psh_count == 0)
            is_xmas = (syn_count == 0 and ack_count == 0 and fin_count > 0 and psh_count > 0)
            if is_null or is_xmas:
                triggered_threats.append(STEALTH_SCAN)

        # Apply alert cooldown system to prevent network spam
        valid_alerts = []
        for threat in triggered_threats:
            cooldown_key = (src_ip, threat)
            last_alert_time = self.last_alert.get(cooldown_key, 0.0)
            if now - last_alert_time >= self.cooldown_sec:
                self.last_alert[cooldown_key] = now
                valid_alerts.append(threat)

        return valid_alerts
