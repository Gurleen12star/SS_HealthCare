import os
import re
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]

RAW_DIR = ROOT / "datasets" / "raw" / "anemia" / "ghana" / "Application of Machine Learning in Detecting Iron Deficiency Anemia Using  Conjunctiva image Dataset from Ghana"

OUTPUT_MANIFEST = ROOT / "datasets" / "processed" / "anemia" / "ghana_original_manifest.csv"

def get_base_name(filename):
    """
    Extract the core patient identity from the filename.
    Removes augmentations like ' (2)', 'FV', 'RA', ' - Copy'.
    """
    name = os.path.splitext(filename)[0]
    
    # Remove ' (X)' or ' - Copy'
    name = re.sub(r'\s*\(\d+\)\s*', '', name)
    name = name.replace(' - Copy', '')
    name = name.replace('png', '')
    
    # Remove 'FV' or 'RA' augmentations at the end of the base string
    name = re.sub(r'(FV|RA)$', '', name)
    
    return name.strip()

def is_unaugmented_name(filename):
    """
    Returns True if the filename looks like the pristine original 
    (no parentheses, no FV/RA, no Copy).
    """
    if '(' in filename or ')' in filename or 'Copy' in filename:
        return False
    name = os.path.splitext(filename)[0]
    if name.endswith('FV') or name.endswith('RA'):
        return False
    return True

def main():
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"Dataset directory not found: {RAW_DIR}")
        
    OUTPUT_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    
    files = [f for f in os.listdir(RAW_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    # Group files by their extracted base patient ID
    groups = {}
    for f in files:
        base = get_base_name(f)
        if base not in groups:
            groups[base] = []
        groups[base].append(f)
        
    print(f"Total files found: {len(files)}")
    print(f"Total unique patient bases identified: {len(groups)}")
    
    # We expect ~710 unique bases based on the Mendeley paper.
    # We will pick exactly one representative 'original' image for each base.
    records = []
    
    for base, group_files in groups.items():
        # Try to find the file that has no augmentation tags
        originals = [f for f in group_files if is_unaugmented_name(f)]
        
        if originals:
            # Pick the shortest name just to be safe, or just the first one
            chosen = sorted(originals, key=len)[0]
        else:
            # Fallback: if no purely unaugmented name exists, sort and pick the first
            chosen = sorted(group_files)[0]
            
        label = 1 if base.lower().startswith('anemic') else 0
        
        path_rel = str((RAW_DIR / chosen).relative_to(ROOT))
        
        records.append({
            "image_path": path_rel,
            "patient_id": base,
            "label": label,
            "source": "ghana_mendeley"
        })
        
    df = pd.DataFrame(records)
    df.to_csv(OUTPUT_MANIFEST, index=False)
    
    print(f"Created {OUTPUT_MANIFEST} with {len(df)} original images.")
    print("Label distribution:")
    print(df['label'].value_counts())

if __name__ == "__main__":
    main()
