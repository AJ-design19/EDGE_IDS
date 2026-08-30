import time
from feature_engineering import build_feature_vector
from inference import predict_one


packet = {
    "src_ip": "192.168.1.10",
    "dst_ip": "8.8.8.8",
    "protocol": "TCP",
    "timestamp": time.time(),
    "syn_count": 500,
    "bytes": 100000,
    "packets": 1000,
    "ack_count": 0,
    "fin_count": 0,
    "rst_count": 0,
    "psh_count": 0
}

feat = build_feature_vector([packet])

print(feat)


prob, lat = predict_one(feat)

event = {
    "src_ip": packet["src_ip"],
    "probability": prob,
    "latency": lat
}
print(event)