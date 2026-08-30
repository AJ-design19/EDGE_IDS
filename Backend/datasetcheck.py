import numpy as np
from inference import predict_one

X = np.load("X_test_sample.npy")
y = np.load("y_test_sample.npy")

for i in range(20):

    feat = X[i]

    prob, lat = predict_one(feat)

    print(
        f"Label={y[i]} "
        f"Prob={prob:.4f}"
    )