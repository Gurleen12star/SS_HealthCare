import os
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import models, transforms
from sklearn.metrics import roc_auc_score
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
WEIGHTS_DIR = ROOT / "ml" / "anemia" / "weights"

def train_effnet_full():
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    best_model_path = WEIGHTS_DIR / "efficientnet_b0_optimized.pt"
    
    # Run A configuration: EfficientNet, 40 epochs, Mild Aug
    train_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_train.csv", ROOT, split="train", use_roi=False, mild_aug=True)
    val_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_val.csv", ROOT, split="val", use_roi=False)

    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False, num_workers=0)
    
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 1)
    )
    model = model.to(device)
    
    pos_weight = torch.tensor([157.0 / 230.0]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    # Single-stage training as per Run A
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=40)
    
    best_auroc = 0
    patience = 10
    patience_counter = 0
    
    print("Training full model (Run A config)...")
    for epoch in range(40):
        model.train()
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device).unsqueeze(1)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
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
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print("Early stopping triggered.")
                break
                
    print(f"Finished. Best AUROC: {best_auroc:.4f}")

if __name__ == "__main__":
    train_effnet_full()
