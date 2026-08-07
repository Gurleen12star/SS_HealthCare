import os
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import models
from sklearn.metrics import roc_auc_score, balanced_accuracy_score
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
WEIGHTS_DIR = ROOT / "ml" / "anemia" / "weights"

def train_resnet_roi():
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    best_model_path = WEIGHTS_DIR / "resnet18_roi_ghana.pt"
    
    # Run E configuration: ResNet18, Two-Stage, ROI, Mild Aug
    train_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "roi_ghana_train.csv", ROOT, split="train", use_roi=True, mild_aug=True)
    val_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "roi_ghana_val.csv", ROOT, split="val", use_roi=True)
    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False, num_workers=0)
    
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, 1)
    model = model.to(device)
    
    pos_weight = torch.tensor([157.0 / 230.0]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    # Stage 1: Freeze backbone, train FC
    for name, param in model.named_parameters():
        if 'fc' not in name:
            param.requires_grad = False
            
    opt1 = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-3)
    
    print("Stage 1: Training head for 5 epochs...")
    for epoch in range(5):
        model.train()
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device).unsqueeze(1)
            opt1.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            opt1.step()
            
    # Stage 2: Unfreeze all, train 35 epochs with CosineAnnealing and Early Stopping
    for param in model.parameters():
        param.requires_grad = True
        
    opt2 = optim.AdamW(model.parameters(), lr=3e-5, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(opt2, T_max=35)
    
    best_auroc = 0
    patience = 10
    patience_counter = 0
    
    print("Stage 2: Fine-tuning full model...")
    for epoch in range(35):
        model.train()
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device).unsqueeze(1)
            opt2.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            opt2.step()
            
        scheduler.step()
        
        # Eval
        model.eval()
        all_labels = []
        all_preds = []
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                outputs = model(images)
                preds = torch.sigmoid(outputs).cpu().numpy().flatten()
                all_preds.extend(preds)
                all_labels.extend(labels.numpy().flatten())
                
        auroc = roc_auc_score(all_labels, all_preds)
        print(f"Epoch {epoch+1} | Val AUROC: {auroc:.4f}")
        
        if auroc > best_auroc:
            best_auroc = auroc
            patience_counter = 0
            torch.save({
                'model_state_dict': model.state_dict(),
            }, best_model_path)
            print(f" -> Saved to {best_model_path}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping triggered.")
                break

if __name__ == "__main__":
    train_resnet_roi()
