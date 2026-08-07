import os
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models
from torch.utils.data import DataLoader
from sklearn.metrics import confusion_matrix, recall_score, roc_auc_score, average_precision_score
import numpy as np
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
WEIGHTS_DIR = ROOT / "ml" / "anemia" / "weights"

def get_efficientnet():
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 1)
    )
    return model

def get_resnet18():
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, 1)
    return model

def run_ensemble_search():
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    
    # 1. Load EfficientNet (Full Image Model - Optimized)
    effnet = get_efficientnet().to(device)
    eff_ckpt = torch.load(WEIGHTS_DIR / "efficientnet_b0_optimized.pt", map_location=device)
    effnet.load_state_dict(eff_ckpt['model_state_dict'])
    effnet.eval()
    
    # 2. Load ResNet18 (ROI Model - Run E)
    resnet = get_resnet18().to(device)
    res_ckpt = torch.load(WEIGHTS_DIR / "resnet18_roi_ghana.pt", map_location=device)
    resnet.load_state_dict(res_ckpt['model_state_dict'])
    resnet.eval()
    
    from torchvision import transforms
    eff_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_val.csv", ROOT, split="val", use_roi=False)
    eff_ds.transform = transforms.Compose([
        transforms.Resize((300, 300)),
        transforms.CenterCrop((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    res_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "roi_ghana_val.csv", ROOT, split="val", use_roi=True)
    
    eff_loader = DataLoader(eff_ds, batch_size=16, shuffle=False)
    res_loader = DataLoader(res_ds, batch_size=16, shuffle=False)
    
    eff_probs = []
    res_probs = []
    all_labels = []
    
    print("Generating predictions from EfficientNet (Full Image)...")
    with torch.no_grad():
        for images, labels in eff_loader:
            images = images.to(device)
            outputs = effnet(images)
            probs = torch.sigmoid(outputs).cpu().numpy().flatten()
            eff_probs.extend(probs)
            all_labels.extend(labels.numpy().flatten())
            
    print("Generating predictions from ResNet18 (ROI Crop)...")
    with torch.no_grad():
        for images, labels in res_loader:
            images = images.to(device)
            outputs = resnet(images)
            probs = torch.sigmoid(outputs).cpu().numpy().flatten()
            res_probs.extend(probs)
            
    eff_probs = np.array(eff_probs)
    res_probs = np.array(res_probs)
    all_labels = np.array(all_labels)
    
    print("\nSearching for optimal ensemble weight and threshold...")
    best = None
    
    for w in np.arange(0, 1.05, 0.05):
        probs = (w * eff_probs) + ((1 - w) * res_probs)
        
        for threshold in np.arange(0.05, 0.96, 0.01):
            pred = (probs >= threshold).astype(int)
            sensitivity = recall_score(all_labels, pred)
            
            tn, fp, fn, tp = confusion_matrix(all_labels, pred).ravel()
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            if sensitivity >= 0.90:
                if best is None or specificity > best["specificity"]:
                    auroc = roc_auc_score(all_labels, probs)
                    auprc = average_precision_score(all_labels, probs)
                    best = {
                        "weight": w,
                        "threshold": threshold,
                        "sensitivity": sensitivity,
                        "specificity": specificity,
                        "tp": tp, "tn": tn, "fp": fp, "fn": fn,
                        "auroc": auroc, "auprc": auprc
                    }
                    
    print("\n--- OPTIMAL ENSEMBLE FOUND ---")
    print(f"Weight (w * EffNet + (1-w) * ResNet): w = {best['weight']:.2f}")
    print(f"Threshold: {best['threshold']:.2f}")
    print(f"Sensitivity: {best['sensitivity']:.4f} ({best['tp']}/{best['tp']+best['fn']})")
    print(f"Specificity: {best['specificity']:.4f} ({best['tn']}/{best['tn']+best['fp']})")
    print(f"False Positives: {best['fp']}")
    print(f"False Negatives: {best['fn']}")
    print(f"AUROC: {best['auroc']:.4f}")
    print(f"AUPRC: {best['auprc']:.4f}")

if __name__ == "__main__":
    run_ensemble_search()
