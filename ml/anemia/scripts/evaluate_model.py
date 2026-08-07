import os
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix, roc_auc_score, precision_score, recall_score, f1_score
import pandas as pd
import sys

# Add parent directory to path to import dataset
sys.path.append(str(Path(__file__).resolve().parents[1]))
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
WEIGHTS_DIR = ROOT / "ml" / "anemia" / "weights"
MODEL_PATH = WEIGHTS_DIR / "efficientnet_b0_ghana.pt"

device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")

def evaluate_thresholds():
    print(f"Loading model on {device} from {MODEL_PATH}")
    
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 1)
    )
    
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()
    
    val_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_val.csv", ROOT, split="val")
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False)
    
    all_labels = []
    all_preds = []
    
    print("Evaluating Validation Set...")
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            preds = torch.sigmoid(outputs).cpu().numpy().flatten()
            
            all_preds.extend(preds)
            all_labels.extend(labels.numpy().flatten())
            
    auroc = roc_auc_score(all_labels, all_preds)
    print(f"\nAUROC: {auroc:.4f}\n")
    print(f"{'Threshold':<10} | {'Sensitivity (Recall)':<20} | {'Specificity':<15} | {'Precision':<10} | {'F1':<10}")
    print("-" * 75)
    
    thresholds = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60]
    best_thr = 0.5
    
    for thr in thresholds:
        bin_preds = [1 if p >= thr else 0 for p in all_preds]
        
        tn, fp, fn, tp = confusion_matrix(all_labels, bin_preds).ravel()
        
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (precision * sensitivity) / (precision + sensitivity) if (precision + sensitivity) > 0 else 0
        
        print(f"{thr:<10.2f} | {sensitivity:<20.4f} | {specificity:<15.4f} | {precision:<10.4f} | {f1:<10.4f}")
        
    # Test set evaluation will be done later after threshold selection
    
if __name__ == "__main__":
    evaluate_thresholds()
