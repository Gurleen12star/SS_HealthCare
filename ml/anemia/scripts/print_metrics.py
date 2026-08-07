import torch
from torchvision import transforms
import numpy as np
import sys
from ensemble_experiment import get_efficientnet, get_resnet18, ROOT, PROCESSED_DIR, WEIGHTS_DIR, DataLoader, GhanaConjunctivaDataset, roc_auc_score

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

effnet = get_efficientnet().to(device)
eff_ckpt = torch.load(WEIGHTS_DIR / "efficientnet_b0_optimized.pt", map_location=device)
effnet.load_state_dict(eff_ckpt['model_state_dict'])
effnet.eval()

resnet = get_resnet18().to(device)
res_ckpt = torch.load(WEIGHTS_DIR / "resnet18_roi_ghana.pt", map_location=device)
resnet.load_state_dict(res_ckpt['model_state_dict'])
resnet.eval()

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

with torch.no_grad():
    for images, labels in eff_loader:
        eff_probs.extend(torch.sigmoid(effnet(images.to(device))).cpu().numpy().flatten())
        all_labels.extend(labels.numpy().flatten())
        
    for images, labels in res_loader:
        res_probs.extend(torch.sigmoid(resnet(images.to(device))).cpu().numpy().flatten())

print("EffNet AUROC:", roc_auc_score(all_labels, eff_probs))
print("ResNet AUROC:", roc_auc_score(all_labels, res_probs))
