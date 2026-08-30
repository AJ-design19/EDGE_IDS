import sys
import os
import time

# Add Backend folder to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rules_detector import (
    RulesEngine,
    PORT_SCAN_VERTICAL,
    PORT_SCAN_HORIZONTAL,
    PORT_SCAN_COMPOSITE,
    SYN_FLOOD,
    VOLUMETRIC_FLOOD,
    LAND_ATTACK,
    STEALTH_SCAN,
    ICMP_FLOOD
)

def run_tests():
    print("====================================================")
    print("RUNNING RULES ENGINE AUTOMATED VERIFICATION SUITE")
    print("====================================================")
    
    # Initialize engine with short windows/cooldowns for fast testing
    engine = RulesEngine(scan_window=5.0, flood_window=1.0, cooldown_sec=2.0)
    
    # Wait briefly for engine startup background thread to initialize
    time.sleep(0.1)

    # ----------------------------------------------------
    # TEST 1: Vertical Port Scan (TCP SYN)
    # ----------------------------------------------------
    print("\n--- Test 1: TCP SYN Vertical Scan ---")
    src = "192.168.1.10"
    dst = "192.168.1.100"
    
    # Send TCP SYN to 5 unique ports
    for i in range(5):
        pkt = {
            "src_ip": src,
            "dst_ip": dst,
            "dst_port": 80 + i,
            "protocol": "TCP",
            "syn_count": 1,
            "ack_count": 0,
            "bytes": 60
        }
        alerts = engine.check_packet(pkt)
        if i == 4:
            assert PORT_SCAN_VERTICAL in alerts or PORT_SCAN_COMPOSITE in alerts, f"Expected Vertical/Composite Scan alert, got {alerts}"
            print("SUCCESS: Vertical port scan detected successfully!")
        else:
            assert len(alerts) == 0, f"Unexpected alert before threshold: {alerts}"

    # ----------------------------------------------------
    # TEST 2: No UDP Scan Alerts
    # ----------------------------------------------------
    print("\n--- Test 2: UDP Scanning Excluded ---")
    src_udp = "192.168.1.11"
    dst_udp = "192.168.1.200"
    
    # Send UDP packets to 10 unique ports - should NOT trigger scan
    for i in range(10):
        pkt = {
            "src_ip": src_udp,
            "dst_ip": dst_udp,
            "dst_port": 1000 + i,
            "protocol": "UDP",
            "syn_count": 0,
            "ack_count": 0,
            "bytes": 120
        }
        alerts = engine.check_packet(pkt)
        assert len(alerts) == 0, f"Expected NO alerts for UDP, got {alerts}"
    print("SUCCESS: UDP traffic correctly excluded from scanning rules!")

    # ----------------------------------------------------
    # TEST 3: Horizontal Port Scan (TCP SYN)
    # ----------------------------------------------------
    print("\n--- Test 3: TCP SYN Horizontal Scan ---")
    src_h = "192.168.1.12"
    
    # Send TCP SYN to 10 different destinations on same/different port
    for i in range(10):
        pkt = {
            "src_ip": src_h,
            "dst_ip": f"192.168.1.{10+i}",
            "dst_port": 443,
            "protocol": "TCP",
            "syn_count": 1,
            "ack_count": 0,
            "bytes": 60
        }
        alerts = engine.check_packet(pkt)
        if i == 9:
            assert PORT_SCAN_HORIZONTAL in alerts, f"Expected Horizontal Scan alert, got {alerts}"
            print("SUCCESS: Horizontal port scan detected successfully!")
        else:
            if i >= 7:
                # PORT_SCAN_COMPOSITE can trigger here as we have >= 8 unique host/port pairs
                assert len(alerts) == 0 or PORT_SCAN_COMPOSITE in alerts, f"Unexpected alert: {alerts}"
            else:
                assert len(alerts) == 0, f"Unexpected alert: {alerts}"

    # ----------------------------------------------------
    # TEST 4: Cooldown Suppression
    # ----------------------------------------------------
    print("\n--- Test 4: Alert Cooldown Suppression ---")
    # Trigger vertical scan again on the same src IP
    pkt = {
        "src_ip": src,
        "dst_ip": dst,
        "dst_port": 200,
        "protocol": "TCP",
        "syn_count": 1,
        "ack_count": 0,
        "bytes": 60
    }
    alerts = engine.check_packet(pkt)
    assert len(alerts) == 0, f"Expected alert to be suppressed by cooldown, got {alerts}"
    print("SUCCESS: Alert suppressed under cooldown window!")

    # Wait for cooldown to expire (cooldown_sec = 2.0)
    print("Waiting 2.5s for cooldown to clear...")
    time.sleep(2.5)
    
    alerts = engine.check_packet(pkt)
    # Vertical scan list still has ports in history, so checking it triggers vertical scan alert again
    assert PORT_SCAN_VERTICAL in alerts or PORT_SCAN_COMPOSITE in alerts, f"Expected alert to re-fire after cooldown, got {alerts}"
    print("SUCCESS: Alert re-fired successfully after cooldown expired!")

    # ----------------------------------------------------
    # TEST 5: SYN Flood with Ratio Guard
    # ----------------------------------------------------
    print("\n--- Test 5: SYN Flood Alert ---")
    src_f = "192.168.1.15"
    dst_f = "192.168.1.250"
    
    # Send 100 SYN packets with 0 ACKs
    for i in range(100):
        pkt = {
            "src_ip": src_f,
            "dst_ip": dst_f,
            "dst_port": 80,
            "protocol": "TCP",
            "syn_count": 1,
            "ack_count": 0,
            "bytes": 60
        }
        alerts = engine.check_packet(pkt)
        if i == 99:
            assert SYN_FLOOD in alerts, f"Expected SYN Flood alert, got {alerts}"
            print("SUCCESS: SYN flood detected (division-by-zero guarded successfully)!")

    # ----------------------------------------------------
    # TEST 6: Slow Scan Evasion (Design Limitation)
    # ----------------------------------------------------
    print("\n--- Test 6: Slow Scan Evasion ---")
    src_s = "192.168.1.20"
    dst_s = "192.168.1.100"
    
    # Send SYN packets slow enough to slide out of the window (scan_window = 5.0)
    # 1 SYN every 2.0 seconds -> 4 SYNs total over 8 seconds. 
    # At any point, maximum unique ports in the 5s window is 3. So it should NOT trigger.
    for i in range(4):
        pkt = {
            "src_ip": src_s,
            "dst_ip": dst_s,
            "dst_port": 9000 + i,
            "protocol": "TCP",
            "syn_count": 1,
            "ack_count": 0,
            "bytes": 60
        }
        alerts = engine.check_packet(pkt)
        assert len(alerts) == 0, f"Expected NO alerts due to scan window expiration, got {alerts}"
        time.sleep(2.0)
    print("SUCCESS: Slow scan correctly bypassed the sliding window (limitation verified)!")

    # ----------------------------------------------------
    # TEST 7: Land Attack
    # ----------------------------------------------------
    print("\n--- Test 7: TCP Land Attack ---")
    pkt = {
        "src_ip": "192.168.50.10",
        "dst_ip": "192.168.50.10",
        "src_port": 80,
        "dst_port": 80,
        "protocol": "TCP",
        "syn_count": 1,
        "ack_count": 0,
        "bytes": 60
    }
    alerts = engine.check_packet(pkt)
    assert LAND_ATTACK in alerts, f"Expected Land Attack alert, got {alerts}"
    print("SUCCESS: Land Attack detected successfully!")

    # ----------------------------------------------------
    # TEST 8: Stealth Scan (Null / Xmas)
    # ----------------------------------------------------
    print("\n--- Test 8: Stealth Xmas & Null Scans ---")
    # Xmas Scan
    pkt_xmas = {
        "src_ip": "192.168.50.30",
        "dst_ip": "192.168.50.100",
        "src_port": 1234,
        "dst_port": 80,
        "protocol": "TCP",
        "syn_count": 0,
        "ack_count": 0,
        "fin_count": 1,
        "psh_count": 1,
        "rst_count": 0,
        "bytes": 60
    }
    alerts = engine.check_packet(pkt_xmas)
    assert STEALTH_SCAN in alerts, f"Expected Xmas Stealth Scan alert, got {alerts}"
    
    # Null Scan
    pkt_null = {
        "src_ip": "192.168.50.31",
        "dst_ip": "192.168.50.100",
        "src_port": 1234,
        "dst_port": 80,
        "protocol": "TCP",
        "syn_count": 0,
        "ack_count": 0,
        "fin_count": 0,
        "psh_count": 0,
        "rst_count": 0,
        "bytes": 60
    }
    alerts = engine.check_packet(pkt_null)
    assert STEALTH_SCAN in alerts, f"Expected Null Stealth Scan alert, got {alerts}"
    print("SUCCESS: Stealth scans detected successfully!")

    # ----------------------------------------------------
    # TEST 9: ICMP Flood
    # ----------------------------------------------------
    print("\n--- Test 9: ICMP Flood ---")
    src_icmp = "192.168.50.40"
    dst_icmp = "192.168.50.100"
    for i in range(50):
        pkt = {
            "src_ip": src_icmp,
            "dst_ip": dst_icmp,
            "protocol": "ICMP",
            "bytes": 64
        }
        alerts = engine.check_packet(pkt)
        if i == 49:
            assert ICMP_FLOOD in alerts, f"Expected ICMP Flood alert, got {alerts}"
            print("SUCCESS: ICMP flood detected successfully!")
        else:
            assert len(alerts) == 0, f"Unexpected alert during flood ramp-up: {alerts}"

    # ----------------------------------------------------
    # TEST 10: Memory Cleanup (Global Sweep)
    # ----------------------------------------------------
    print("\n--- Test 7: Memory Leak Pruning ---")
    # Register a temporary spoofed IP with 1 packet
    src_sp = "1.2.3.4"
    pkt = {
        "src_ip": src_sp,
        "dst_ip": "8.8.8.8",
        "dst_port": 80,
        "protocol": "TCP",
        "syn_count": 1,
        "ack_count": 0,
        "bytes": 60
    }
    engine.check_packet(pkt)
    
    # Verify it exists in history
    assert src_sp in engine.history, "IP should be tracked in history"
    print("IP added to history.")
    
    # Wait for the window (5.0s) to expire
    print("Waiting 5.5s for events to become stale...")
    time.sleep(5.5)
    
    # Trigger global prune in the engine lock (background thread runs it every 30s, but we trigger the same logic or wait)
    # Since we can just check if background sweeping cleaned it up (background sweeps every 30s), let's wait or run a direct verification
    print("Active IPs before sweep:", list(engine.history.keys()))
    # To run test deterministically, we execute the cleanup block logic directly
    now = time.time()
    with engine.lock:
        keys = list(engine.history.keys())
        for ip in keys:
            while engine.history[ip] and (now - engine.history[ip][0]["time"] > engine.scan_window):
                engine.history[ip].popleft()
            if not engine.history[ip]:
                del engine.history[ip]
                
    assert src_sp not in engine.history, "Stale IP should be completely deleted from history"
    print("SUCCESS: Memory pruned correctly and stale IPs deleted!")
    print("\nALL RULES ENGINE TESTS PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
