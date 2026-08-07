import os
import cv2
import pandas as pd
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
ROI_DIR = PROCESSED_DIR / "roi"
ROI_DIR.mkdir(parents=True, exist_ok=True)

def extract_conjunctiva(image_path, output_path):
    img = cv2.imread(str(image_path))
    if img is None:
        return False
        
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Range for pink/red tissue
    lower_red1 = np.array([0, 40, 40])
    upper_red1 = np.array([15, 255, 255])
    lower_red2 = np.array([165, 40, 40])
    upper_red2 = np.array([180, 255, 255])
    
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    tissue_mask = cv2.bitwise_or(mask1, mask2)
    
    contours, _ = cv2.findContours(tissue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return False
        
    # Find largest contour
    largest_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest_contour)
    
    img_area = img.shape[0] * img.shape[1]
    if area / img_area < 0.005:
        return False
        
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Add a small margin
    margin = 10
    x = max(0, x - margin)
    y = max(0, y - margin)
    w = min(img.shape[1] - x, w + 2 * margin)
    h = min(img.shape[0] - y, h + 2 * margin)
    
    cropped = img[y:y+h, x:x+w]
    cv2.imwrite(str(output_path), cropped)
    return True

def process_split(split_csv):
    df = pd.read_csv(PROCESSED_DIR / split_csv)
    roi_paths = []
    
    for idx, row in df.iterrows():
        source_path = ROOT / row['image_path']
        fname = source_path.name
        out_path = ROI_DIR / fname
        
        success = extract_conjunctiva(source_path, out_path)
        
        # If extraction fails, we just copy the original image to avoid breaking the dataset size
        if not success:
            import shutil
            shutil.copy(source_path, out_path)
            
        # Store relative path for dataset
        rel_path = f"datasets/processed/anemia/roi/{fname}"
        roi_paths.append(rel_path)
        
    df['roi_path'] = roi_paths
    df.to_csv(PROCESSED_DIR / f"roi_{split_csv}", index=False)
    print(f"Processed {len(df)} images for {split_csv}")

if __name__ == "__main__":
    print("Extracting ROIs...")
    process_split("ghana_train.csv")
    process_split("ghana_val.csv")
    process_split("ghana_test.csv")
    print("Done!")
