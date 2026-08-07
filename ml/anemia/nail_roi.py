import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from pathlib import Path

# Load landmarker once globally
ROOT = Path(__file__).resolve().parent
MODEL_PATH = str(ROOT / "hand_landmarker.task")

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=2)
detector = vision.HandLandmarker.create_from_options(options)

def crop_nail_roi(image: Image.Image, padding_factor=0.2):
    """
    Detects hands using MediaPipe Tasks API and crops the image to tightly bound the fingernails.
    If no hand is detected, returns the original image.
    """
    img_np = np.array(image)
    if img_np.shape[-1] == 4:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)
    elif len(img_np.shape) == 2:
        img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        
    h, w, _ = img_np.shape
    
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
    detection_result = detector.detect(mp_image)
    
    if not detection_result.hand_landmarks:
        return image
        
    x_coords = []
    y_coords = []
    
    # Landmarks for fingernails (distal phalanges)
    nail_landmarks = [3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20]
    
    for hand_landmarks in detection_result.hand_landmarks:
        for idx in nail_landmarks:
            lm = hand_landmarks[idx]
            x_coords.append(lm.x * w)
            y_coords.append(lm.y * h)
            
    if not x_coords or not y_coords:
        return image
        
    x_min, x_max = min(x_coords), max(x_coords)
    y_min, y_max = min(y_coords), max(y_coords)
    
    box_w = x_max - x_min
    box_h = y_max - y_min
    
    # Add padding
    pad_x = box_w * padding_factor
    pad_y = box_h * padding_factor
    
    x_min = max(0, int(x_min - pad_x))
    x_max = min(w, int(x_max + pad_x))
    y_min = max(0, int(y_min - pad_y))
    y_max = min(h, int(y_max + pad_y))
    
    cropped_np = img_np[y_min:y_max, x_min:x_max]
    if cropped_np.size == 0:
        return image
        
    return Image.fromarray(cropped_np)
