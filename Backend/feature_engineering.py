import time
import numpy as np


# OLD FLOW STATE SYSTEM
# flow_state = {}


def stats(arr):

    if not arr:
        return (0, 0, 0, 0)

    return (
        np.min(arr),
        np.max(arr),
        np.mean(arr),
        np.std(arr)
    )


# OLD VERSION
# def build_feature_vector(p):


def build_feature_vector(packets):

    # -------------------------
    # BASIC FLOW INFO
    # -------------------------

    total_packets = len(packets)

    total_bytes = sum(
        p.get("bytes", 0)
        for p in packets
    )

    timestamps = [
        p.get("timestamp", time.time())
        for p in packets
    ]

    timestamps.sort()

    duration = max(
        timestamps[-1] - timestamps[0],
        1.0
    )

    # -------------------------
    # PACKET SIZES
    # -------------------------

    pkt_sizes = [
        p.get("bytes", 0)
        for p in packets
    ]

    pkt_min, pkt_max, pkt_mean, pkt_std = stats(pkt_sizes)

    # -------------------------
    # IAT
    # -------------------------

    iats = []

    for i in range(1, len(timestamps)):

        iats.append(
            timestamps[i] - timestamps[i - 1]
        )

    iat_min, iat_max, iat_mean, iat_std = stats(iats)

    # -------------------------
    # RATES
    # -------------------------

    pkt_rate = total_packets / duration

    byte_rate = total_bytes / duration

    # -------------------------
    # PROTOCOL
    # -------------------------

    proto = packets[0].get(
        "protocol",
        ""
    ).upper()

    is_tcp = 1 if proto == "TCP" else 0

    is_udp = 1 if proto == "UDP" else 0

    is_icmp = 1 if proto == "ICMP" else 0

    # -------------------------
    # FLAGS
    # -------------------------

    syn = sum(
        p.get("syn_count", 0)
        for p in packets
    )

    ack = sum(
        p.get("ack_count", 0)
        for p in packets
    )

    fin = sum(
        p.get("fin_count", 0)
        for p in packets
    )

    rst = sum(
        p.get("rst_count", 0)
        for p in packets
    )

    psh = sum(
        p.get("psh_count", 0)
        for p in packets
    )

    # -------------------------
    # FEATURE VECTOR
    # -------------------------

    feat = [

        duration,

        total_packets,

        total_bytes,

        pkt_min,
        pkt_max,
        pkt_mean,
        pkt_std,

        iat_min,
        iat_max,
        iat_mean,
        iat_std,

        pkt_rate,
        byte_rate,

        syn,
        ack,
        fin,
        rst,
        psh,

        is_tcp,
        is_udp,
        is_icmp,

        total_bytes / (total_packets + 1),

        total_packets / (duration + 1),

    ]

    # -------------------------
    # PAD TO 30
    # -------------------------

    if len(feat) < 30:

        feat.extend(
            [0] * (30 - len(feat))
        )

    # -------------------------
    # NORMALIZATION
    # -------------------------

    feat = np.array(
        feat,
        dtype=np.float32
    )

    feat = (
        feat - np.mean(feat)
    ) / (
        np.std(feat) + 1e-6
    )

    return feat