import json
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[3]
INPUT_MANIFEST = ROOT / "datasets" / "processed" / "anemia" / "ghana_original_manifest.csv"
OUTPUT_DIR = ROOT / "datasets" / "processed" / "anemia"

RANDOM_STATE = 42

def main():
    if not INPUT_MANIFEST.exists():
        raise FileNotFoundError(f"Manifest not found: {INPUT_MANIFEST}")
        
    df = pd.read_csv(INPUT_MANIFEST)
    
    # We split patients to avoid leakage. df already has one row per patient_id (base)
    # 70/15/15 split
    
    train_df, temp_df = train_test_split(
        df, test_size=0.30, random_state=RANDOM_STATE, stratify=df['label']
    )
    
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, random_state=RANDOM_STATE, stratify=temp_df['label']
    )
    
    # Assert no overlap
    train_ids = set(train_df['patient_id'])
    val_ids = set(val_df['patient_id'])
    test_ids = set(test_df['patient_id'])
    
    assert train_ids.isdisjoint(val_ids)
    assert train_ids.isdisjoint(test_ids)
    assert val_ids.isdisjoint(test_ids)
    
    train_df = train_df.copy()
    val_df = val_df.copy()
    test_df = test_df.copy()
    
    train_df['split'] = 'train'
    val_df['split'] = 'val'
    test_df['split'] = 'test'
    
    train_df.to_csv(OUTPUT_DIR / "ghana_train.csv", index=False)
    val_df.to_csv(OUTPUT_DIR / "ghana_val.csv", index=False)
    test_df.to_csv(OUTPUT_DIR / "ghana_test.csv", index=False)
    
    summary = {
        "dataset": "Ghana Conjunctiva",
        "random_state": RANDOM_STATE,
        "train_patients": len(train_df),
        "val_patients": len(val_df),
        "test_patients": len(test_df),
        "train_positive": int(train_df['label'].sum()),
        "val_positive": int(val_df['label'].sum()),
        "test_positive": int(test_df['label'].sum()),
    }
    
    with open(OUTPUT_DIR / "ghana_split_summary.json", "w") as f:
        json.dump(summary, f, indent=2)
        
    print(json.dumps(summary, indent=2))
    print("\n✓ 70/15/15 Leakage-safe split complete.")

if __name__ == "__main__":
    main()
