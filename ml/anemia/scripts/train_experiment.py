import os
import argparse
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import models
from sklearn.metrics import confusion_matrix, roc_auc_score, average_precision_score, balanced_accuracy_score, precision_recall_curve
import sys

# Add parent directory to path to import dataset
sys.path.append(str(Path(__file__).resolve().parents[1]))
from dataset import GhanaConjunctivaDataset

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "anemia"

def get_model(arch):
    if arch == 'efficientnet_b0':
        weights = models.EfficientNet_B0_Weights.DEFAULT
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.4, inplace=True),
            nn.Linear(in_features, 1)
        )
    elif arch == 'mobilenet_v3_small':
        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        model = models.mobilenet_v3_small(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, 1)
    elif arch == 'resnet18':
        weights = models.ResNet18_Weights.DEFAULT
        model = models.resnet18(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, 1)
    else:
        raise ValueError(f"Unknown architecture {arch}")
    return model

def freeze_backbone(model, arch):
    if arch == 'efficientnet_b0':
        for param in model.features.parameters():
            param.requires_grad = False
    elif arch == 'mobilenet_v3_small':
        for param in model.features.parameters():
            param.requires_grad = False
    elif arch == 'resnet18':
        for name, param in model.named_parameters():
            if 'fc' not in name:
                param.requires_grad = False

def unfreeze_all(model):
    for param in model.parameters():
        param.requires_grad = True

def evaluate(model, loader, device):
    model.eval()
    all_labels = []
    all_preds = []
    
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            outputs = model(images)
            preds = torch.sigmoid(outputs).cpu().numpy().flatten()
            
            all_preds.extend(preds)
            all_labels.extend(labels.numpy().flatten())
            
    auroc = roc_auc_score(all_labels, all_preds)
    auprc = average_precision_score(all_labels, all_preds)
    
    # Find max specificity for sensitivity >= 0.90
    thresholds = [i/100.0 for i in range(1, 100)]
    best_thr = 0.5
    best_spec = -1
    best_sens = -1
    best_f1 = -1
    best_bal_acc = -1
    best_tp, best_tn, best_fp, best_fn = 0, 0, 0, 0
    
    for thr in thresholds:
        bin_preds = [1 if p >= thr else 0 for p in all_preds]
        tn, fp, fn, tp = confusion_matrix(all_labels, bin_preds).ravel()
        
        sens = tp / (tp + fn) if (tp + fn) > 0 else 0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (prec * sens) / (prec + sens) if (prec + sens) > 0 else 0
        bal_acc = balanced_accuracy_score(all_labels, bin_preds)
        
        if sens >= 0.90:
            if spec > best_spec:
                best_spec = spec
                best_sens = sens
                best_thr = thr
                best_f1 = f1
                best_bal_acc = bal_acc
                best_tp, best_tn, best_fp, best_fn = tp, tn, fp, fn
                
    if best_spec == -1:
        # Fallback if no threshold gives 90% sens
        best_spec = 0
        best_sens = 0
                
    return auroc, auprc, best_thr, best_sens, best_spec, best_f1, best_bal_acc, best_tp, best_tn, best_fp, best_fn

def run_experiment(run_id, arch, two_stage, use_roi, mild_aug):
    print(f"\n--- Starting RUN {run_id} ---")
    print(f"Model: {arch} | Two-Stage: {two_stage} | ROI: {use_roi} | Mild Aug: {mild_aug}")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
    
    csv_train = "roi_ghana_train.csv" if use_roi else "ghana_train.csv"
    csv_val = "roi_ghana_val.csv" if use_roi else "ghana_val.csv"
    
    train_ds = GhanaConjunctivaDataset(PROCESSED_DIR / csv_train, ROOT, split="train", use_roi=use_roi, mild_aug=mild_aug)
    val_ds = GhanaConjunctivaDataset(PROCESSED_DIR / csv_val, ROOT, split="val", use_roi=use_roi)
    
    train_loader = DataLoader(train_ds, batch_size=16, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=16, shuffle=False, num_workers=0)
    
    model = get_model(arch).to(device)
    pos_weight = torch.tensor([157.0 / 230.0]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    
    best_auroc = 0
    final_metrics = None
    
    if two_stage:
        # Stage 1
        freeze_backbone(model, arch)
        opt1 = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-3)
        
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
                
        # Stage 2
        unfreeze_all(model)
        opt2 = optim.AdamW(model.parameters(), lr=3e-5, weight_decay=1e-3)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(opt2, T_max=35)
        epochs = 35
        optimizer = opt2
    else:
        epochs = 40
        optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-3)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
        
    patience = 10
    patience_counter = 0
        
    for epoch in range(epochs):
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
        
        metrics = evaluate(model, val_loader, device)
        auroc = metrics[0]
        spec_at_90 = metrics[4]
        
        # Optimize early stopping primarily on specificty at 90% sens, fallback to auroc
        score = spec_at_90 if spec_at_90 > 0 else auroc
        
        if score > best_auroc:
            best_auroc = score
            final_metrics = metrics
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience:
                break
                
    if final_metrics is None:
        final_metrics = evaluate(model, val_loader, device)
        
    auroc, auprc, best_thr, best_sens, best_spec, best_f1, best_bal_acc, best_tp, best_tn, best_fp, best_fn = final_metrics
    
    print(f"RUN {run_id} Results:")
    print(f"AUROC: {auroc:.4f}")
    print(f"AUPRC: {auprc:.4f}")
    print(f"Max Specificity (at >=90% Sens): {best_spec:.4f} (Thr: {best_thr:.2f})")
    print(f"Sensitivity: {best_sens:.4f}")
    print(f"F1: {best_f1:.4f}")
    print(f"Balanced Acc: {best_bal_acc:.4f}")
    print(f"TP/TN/FP/FN: {best_tp}/{best_tn}/{best_fp}/{best_fn}")
    
    return [run_id, arch, two_stage, use_roi, mild_aug, auroc, auprc, best_sens, best_spec, best_f1, best_bal_acc, best_thr, best_tp, best_tn, best_fp, best_fn]

if __name__ == "__main__":
    import csv
    results = []
    
    # A EfficientNet-B0 current baseline current current (40 epochs full img mild aug - Wait run A didn't specify mild aug originally, but user's table said mild. Let's use mild for all)
    results.append(run_experiment("A", "efficientnet_b0", False, False, True))
    # B EfficientNet-B0 40 epochs + early stopping current mild
    results.append(run_experiment("B", "efficientnet_b0", True, False, True))
    # C EfficientNet-B0 two-stage fine-tuning current mild
    results.append(run_experiment("C", "efficientnet_b0", True, True, True))
    # D MobileNetV3-Small two-stage conjunctiva crop mild
    results.append(run_experiment("D", "mobilenet_v3_small", True, True, True))
    # E ResNet18 two-stage conjunctiva crop mild
    results.append(run_experiment("E", "resnet18", True, True, True))
    
    with open(ROOT / "experiment_results.csv", "w") as f:
        writer = csv.writer(f)
        writer.writerow(["Run", "Model", "TwoStage", "ROI", "MildAug", "AUROC", "AUPRC", "Sens", "Spec", "F1", "BalAcc", "Threshold", "TP", "TN", "FP", "FN"])
        writer.writerows(results)
    
    print("\nExperiments complete. Results saved to experiment_results.csv")
