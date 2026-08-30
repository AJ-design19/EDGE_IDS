
import tensorflow as tf
import numpy as np
import time


interpreter = tf.lite.Interpreter(
    model_path=
    './model/model_quantized.tflite'
)
interpreter.allocate_tensors()
inp_d = interpreter.get_input_details()
out_d = interpreter.get_output_details()

print(inp_d)
print(out_d)
print("Model loaded successfully")
print("Input shape:", inp_d[0]['shape'])
print("Output shape:", out_d[0]['shape'])



def predict_one(features):

    """Single packet inference"""
    t0 = time.perf_counter()
    if len(inp_d[0]['shape']) == 3:
        nf = inp_d[0]['shape'][1]
        x  = features[:nf].reshape(
            1, nf, 1
        ).astype(np.float32)
    else:
        nf = inp_d[0]['shape'][-1]
        # x  = features[:nf].reshape(
        #     1, nf
        # ).astype(np.float32)
        x = features.reshape(1, 30).astype(np.float32)

    interpreter.set_tensor(
        inp_d[0]['index'], x
    )
    interpreter.invoke()
    prob = float(
        interpreter.get_tensor(
            out_d[0]['index']
        )[0][0]
    )
    
    raw = interpreter.get_tensor(
        out_d[0]['index']
    )

    print(raw)
    lat = (time.perf_counter()-t0)*1000
    return prob, lat



# dummy = np.random.rand(30).astype(np.float32)

# prob, lat = predict_one(dummy)

# print("Probability:", prob)
# print("Latency:", lat)