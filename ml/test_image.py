import torch
import torch.nn as nn
from torchvision import models, transforms
from pathlib import Path
from PIL import Image

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

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

image = Image.open("/Users/gurleenkaurbedi/.gemini/antigravity-ide/brain/c4790e37-e158-43cf-9b86-70d212c8532f/eye_crop_test.jpeg").convert("RGB")
tensor = transform(image).unsqueeze(0).to(device)

with torch.no_grad():
    clf_out, reg_out = model(tensor)
    prob = torch.sigmoid(clf_out).item()
    hgb = reg_out.item()

print(f"Prob: {prob}, Hb: {hgb}")

