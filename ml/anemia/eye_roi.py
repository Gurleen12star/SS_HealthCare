import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from pathlib import Path

# Load landmarker once globally
ROOT = Path(__file__).resolve().parent
MODEL_PATH = str(ROOT / "face_landmarker.task")

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
detector = vision.FaceLandmarker.create_from_options(options)

def crop_eye_roi(image: Image.Image, pad_x_factor=0.2, pad_y_top=0.2, pad_y_bottom=0.8):
    """
    Detects face using MediaPipe Tasks API and crops to the palpebral conjunctiva region.
    If no face is detected, returns the original image.
    """
    img_np = np.array(image)
    if img_np.shape[-1] == 4:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)
    elif len(img_np.shape) == 2:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        
    h, w, _ = img_np.shape
    
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
    detection_result = detector.detect(mp_image)
    
    if not detection_result.face_landmarks:
        return image
        
    x_coords = []
    y_coords = []
    
    # Left eye lower lid: 33, 7, 163, 144, 145, 153, 154, 155, 133
    # Right eye lower lid: 362, 382, 381, 380, 374, 373, 390, 249, 263
    eye_landmarks = [
        33, 7, 163, 144, 145, 153, 154, 155, 133,
        362, 382, 381, 380, 374, 373, 390, 249, 263
    ]
    
    face_landmarks = detection_result.face_landmarks[0]
    for idx in eye_landmarks:
        lm = face_landmarks[idx]
        x_coords.append(lm.x * w)
        y_coords.append(lm.y * h)
        
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    
    box_w = x_max - x_min
    box_h = y_max - y_min
    
    # We pad the bottom significantly more to capture the pulled-down conjunctiva
    pad_x = box_w * pad_x_factor
    
    x_min = max(0, int(x_min - pad_x))
    x_max = min(w, int(x_max + pad_x))
    
    # y_min is the upper part of the lower eyelid, pad slightly up
    y_min = max(0, int(y_min - box_h * pad_y_top))
    
    # y_max is the bottom of the lower eyelid, pad heavily down to get the conjunctiva
    y_max = min(h, int(y_max + box_h * pad_y_bottom))
    
    cropped_np = img_np[y_min:y_max, x_min:x_max]
    if cropped_np.size == 0:
        return image
        
    return Image.fromarray(cropped_np)
