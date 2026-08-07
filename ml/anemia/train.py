import os
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import models
from sklearn.metrics import accuracy_score, roc_auc_score, precision_recall_curve, f1_score
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"
WEIGHTS_DIR = ROOT / "ml" / "anemia" / "weights"

def train_model():
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Hyperparameters
    batch_size = 16
    epochs = 40
    learning_rate = 1e-4
    
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Datasets
    train_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_train.csv", ROOT, split="train")
    val_ds = GhanaConjunctivaDataset(PROCESSED_DIR / "ghana_val.csv", ROOT, split="val")
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2)
    
    # Model (EfficientNet-B0)
    # Using torchvision weights
    weights = models.EfficientNet_B0_Weights.DEFAULT
    model = models.efficientnet_b0(weights=weights)
    
    # Replace classifier head for binary classification
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 1)
    )
    
    model = model.to(device)
    
    # Class weights for imbalance (neg=157, pos=230)
    pos_weight = torch.tensor([157.0 / 230.0]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_val_auc = 0.0
    best_val_acc = 0.0
    patience = 10
    patience_counter = 0
    best_model_path = WEIGHTS_DIR / "efficientnet_b0_ghana.pt"
    
    print("Starting training...")
    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device).unsqueeze(1)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item() * images.size(0)
            
        scheduler.step()
        train_loss = train_loss / len(train_loader.dataset)
        
        # Validation
        model.eval()
        val_loss = 0.0
        all_labels = []
        all_preds = []
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device).unsqueeze(1)
                
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * images.size(0)
                
                preds = torch.sigmoid(outputs).cpu().numpy()
                all_preds.extend(preds)
                all_labels.extend(labels.cpu().numpy())
                
        val_loss = val_loss / len(val_loader.dataset)
        val_auc = roc_auc_score(all_labels, all_preds)
        
        # Calculate precision-recall to find optimal threshold
        precisions, recalls, thresholds = precision_recall_curve(all_labels, all_preds)
        f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-8)
        optimal_idx = f1_scores.argmax()
        optimal_threshold = thresholds[optimal_idx] if optimal_idx < len(thresholds) else 0.5
        
        binary_preds = [1 if p >= optimal_threshold else 0 for p in all_preds]
        val_acc = accuracy_score(all_labels, binary_preds)
        
        print(f"Epoch {epoch+1}/{epochs} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val AUC: {val_auc:.4f} | Val Acc: {val_acc:.4f} @ thr={optimal_threshold:.2f}")
        
        if val_auc > best_val_auc or (val_auc == best_val_auc and val_acc > best_val_acc):
            best_val_auc = val_auc
            best_val_acc = val_acc
            patience_counter = 0
            print(f"-> Saving new best model to {best_model_path}")
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_auc': val_auc,
                'val_acc': val_acc,
                'optimal_threshold': float(optimal_threshold)
            }, best_model_path)
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"Early stopping at epoch {epoch+1}")
                break
            
    print("Training complete!")

if __name__ == "__main__":
    train_model()
