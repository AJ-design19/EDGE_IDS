import shap
import numpy as np

FEATURE_NAMES = [
    "pkt_len_mean", "pkt_len_std",
    "pkt_len_min",  "pkt_len_max",
    "flow_bytes",   "iat_mean",
    "iat_std",      "iat_min",
    "iat_max",      "flow_duration",
    "pkt_rate",     "byte_rate",
    "syn_count",    "ack_count",
    "rst_count",    "fin_count",
    "psh_count",    "win_mean",
    "win_std",      "has_tcp",
    "has_udp",      "has_icmp",
    "rst_ratio",    "ack_ratio",
    "hdr_len_mean", "hdr_len_std",
    "dst_port",     "protocol",
    "fwd_pkts",     "bwd_pkts",
]

def explain_prediction(
    features: np.ndarray,
    predict_fn,
    top_k: int = 5
):
    """
    Returns top K features driving
    the attack/benign prediction
    Uses SHAP KernelExplainer
    """
    def model_fn(x):
        return np.array([
            predict_fn(xi)[0]
            for xi in x
        ])

    background = features.reshape(1, -1)
    explainer  = shap.KernelExplainer(
        model_fn, background
    )
    shap_vals  = explainer.shap_values(
        features.reshape(1, -1),
        nsamples=100
    )

    importances = np.abs(shap_vals[0])
    top_idx     = np.argsort(
        importances
    )[::-1][:top_k]

    return [
        {
            "feature"    : FEATURE_NAMES[i],
            "shap_value" : round(
                float(shap_vals[0][i]), 4
            ),
            "importance" : round(
                float(importances[i]), 4
            ),
            "direction"  : "attack"
                           if shap_vals[0][i] > 0
                           else "benign",
        }
        for i in top_idx
    ]
