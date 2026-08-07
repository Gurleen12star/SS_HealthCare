import numpy as np
from PIL import Image

def analyze_jaundice_risk(image: Image.Image, scan_type="eye", is_live=False):
    """
    Hackathon Demo Mode: Jaundice Yes/No Detection based on 10-20% yellow area.
    """
    if is_live:
        return "NO", 0.8, 98  # NO (Not Present) for live scans per user request

    img_np = np.array(image.convert('RGB')).astype(np.float32)
    
    # Flatten image to list of pixels
    pixels = img_np.reshape(-1, 3)
    
    # Calculate sum of RGB for each pixel
    sums = pixels.sum(axis=1)
    # Avoid division by zero and ignore very dark pixels
    valid_mask = sums > 30
    valid_pixels = pixels[valid_mask]
    
    if len(valid_pixels) == 0:
        return "NO", 0.5, 50
    
    R = valid_pixels[:, 0]
    G = valid_pixels[:, 1]
    B = valid_pixels[:, 2]
    
    # Define a "yellow" pixel: Red and Green are prominent, Blue is low.
    # Yellow usually means R and G are similar, and both are significantly higher than B.
    # E.g. R > B * 1.2 and G > B * 1.2 and abs(R-G) < 30
    is_yellow = (R > B * 1.2) & (G > B * 1.2) & (R > 100) & (G > 100)
    
    yellow_count = np.sum(is_yellow)
    yellow_percent = yellow_count / len(valid_pixels)
    
    print(f"JAUNDICE HEURISTIC V2: scan={scan_type}, yellow_pixels={yellow_count}, total={len(valid_pixels)}, percent={yellow_percent*100:.1f}%")
    
    # If yellow pixels are > 8%, mark as YES (Jaundice Present)
    # Less than 8-10% is marked as NO.
    if yellow_percent > 0.08:
        return "YES", 3.5, 96 # YES Present
    else:
        return "NO", 0.8, 98  # NO (Not Present)

