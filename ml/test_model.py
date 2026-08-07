import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path

class MultiTaskEfficientNet(nn.Module):
    def __init__(self):
        super(MultiTaskEfficientNet, self).__init__()
        base_model = models.efficientnet_b2(weights=None)
        self.encoder = base_model.features
        self.pool = base_model.avgpool
        
        in_features = base_model.classifier[1].in_features
        self.classification_head = nn.Sequential(
            nn.Dropout(p=0.2, inplace=False),
            nn.Linear(in_features, 1)
        )
        self.regression_head = nn.Sequential(
            nn.Dropout(p=0.2, inplace=False),
            nn.Linear(in_features, 1)
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        clf_out = self.classification_head(x).squeeze()
        reg_out = self.regression_head(x).squeeze()
        return clf_out, reg_out

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
model = MultiTaskEfficientNet()
EYE_MODEL_PATH = Path("/Users/gurleenkaurbedi/Desktop/Cardiofy/ml/weights/sewa_eye_multitask_best.pt")
model.load_state_dict(torch.load(EYE_MODEL_PATH, map_location=device, weights_only=True))
model.to(device)
model.eval()

x = torch.randn(1, 3, 224, 224).to(device)
with torch.no_grad():
    clf, reg = model(x)
print(f"MPS Output: clf={clf.item():.4f}, reg={reg.item():.4f}")

model.to("cpu")
x_cpu = x.to("cpu")
with torch.no_grad():
    clf, reg = model(x_cpu)
print(f"CPU Output: clf={clf.item():.4f}, reg={reg.item():.4f}")

