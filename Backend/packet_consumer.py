# import time
# import numpy as np
# from feature_engineering import build_feature_vector
# from inference import predict_one


# def consumer( que):
#     # global shared_buffer

#     while True:
#         try:
#             packet = que.get()

#             feat = build_feature_vector(packet)
#             print( "feat " , feat)
#             print(np.min(feat), np.max(feat))
#             prob, lat = predict_one(feat)
#             is_attack = prob > 0.5
#             row = {
#                "timestamp": time.time(),
#                 "src": packet.get("src_ip"),
#                 "dst": packet.get("dst_ip"),
#                 "proto": (packet.get("protocol", "")),
#                 "prob": prob, 
#                 "latency": lat
#                 # "type": traffic_type(prob),
#                 # "risk": risk_level(prob),
#                 # "status": "ATTACK" if is_attack else "SAFE"
#             }

#             # shared_buffer.append(row)
       
#             # if len(shared_buffer) > 20:
#             #     del shared_buffer[:-20]
#             print(row)    
#         except Exception as e:
#             print("🔥 CONSUMER ERROR:", e)

import time
import numpy as np

from feature_engineering import build_feature_vector
from inference import predict_one
from websocket_manager import manager
from rules_detector import RulesEngine

flow_state = {}
rules_engine = RulesEngine()


def consumer(que):

    while True:

        try:

            packet = que.get()

            # -------------------------
            # RULE DETECTOR STAGE (Runs directly on packet arrival)
            # -------------------------
            triggered_threats = rules_engine.check_packet(packet)
            for threat in triggered_threats:
                alert_event = {
                    "timestamp": time.time(),
                    "src": packet["src_ip"],
                    "dst": packet["dst_ip"],
                    "proto": packet["protocol"],
                    "prob": 0.0,  # Maintain pure ML score separated from rule alerts
                    "latency": 0.0,
                    "rule_triggered": True,
                    "threat_type": threat
                }
                print("🚨 RULE TRIGGERED:", alert_event)
                manager.broadcast_sync(alert_event)

            key = (
                packet["src_ip"],
                packet["dst_ip"],
                packet["protocol"]
            )

            # -------------------------
            # CREATE FLOW
            # -------------------------

            if key not in flow_state:

                flow_state[key] = {
                    "packets": [],
                    "start": time.time()
                }

            # -------------------------
            # APPEND PACKET
            # -------------------------

            flow_state[key]["packets"].append(packet)
            print(
                key,
                len(flow_state[key]["packets"])
            )

            packets = flow_state[key]["packets"]

            # -------------------------
            # WAIT FOR FLOW TO GROW
            # -------------------------

            if len(packets) < 10:
                continue

            # -------------------------
            # BUILD FEATURES
            # -------------------------

            feat = build_feature_vector(packets)

            print("feat", feat)

            print(
                np.min(feat),
                np.max(feat)
            )

            # -------------------------
            # INFERENCE
            # -------------------------

            prob, lat = predict_one(feat)

            row = {

                "timestamp": time.time(),

                "src": packet["src_ip"],

                "dst": packet["dst_ip"],

                "proto": packet["protocol"],

                "prob": float(prob),

                "latency": float(lat)
            }

            print("event "  , row)

            # -------------------------
            # BROADCAST TO CLIENTS
            # -------------------------

            manager.broadcast_sync(row)

            # -------------------------
            # RESET FLOW
            # -------------------------

            flow_state[key]["packets"] = packets[-50:]

        except Exception as e:

            print(
                "🔥 CONSUMER ERROR:",
                e
            )