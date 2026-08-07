import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from sklearn.model_selection import train_test_split
from PIL import Image
import glob

def get_sewa_dataset(data_dir, modality):
    patients = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    records = []
    for p in patients:
        cbc_path = os.path.join(data_dir, p, "Survey_Data", "CBC_Report.csv")
        if not os.path.exists(cbc_path): continue
        try:
            df = pd.read_csv(cbc_path)
            hgb = float(df['HGB (g/dL)'].iloc[0])
            label = 1 if hgb < 12.0 else 0
        except Exception: continue
        
        img_dir = os.path.join(data_dir, p, "Media", "Anemia_Conjunctiva" if modality == 'eye' else "Anemia_Fingernails_Open")
        if not os.path.exists(img_dir): continue
        img_paths = glob.glob(os.path.join(img_dir, "*.jpeg")) + glob.glob(os.path.join(img_dir, "*.jpg"))
        if not img_paths: continue
        
        records.append({'uuid': p, 'image_path': img_paths[0], 'label': label, 'hgb': hgb})
    return pd.DataFrame(records)

data_dir = "data/sewa/restored"
patients = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
train_uuids, temp_uuids = train_test_split(patients, test_size=0.3, random_state=42)
val_uuids, test_uuids = train_test_split(temp_uuids, test_size=0.5, random_state=42)

df_nail = get_sewa_dataset(data_dir, "nail")
df_nail_test = df_nail[df_nail['uuid'].isin(test_uuids)]

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

model = models.efficientnet_b0(pretrained=False)
model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
model.load_state_dict(torch.load("weights/sewa_nail_best.pt", map_location=device, weights_only=True))
model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

anemic_probs = []
non_anemic_probs = []

with torch.no_grad():
    for _, row in df_nail_test.iterrows():
        img = Image.open(row['image_path']).convert('RGB')
        tensor = transform(img).unsqueeze(0).to(device)
        prob = torch.sigmoid(model(tensor)).item()
        if row['label'] == 1:
            anemic_probs.append(prob)
        else:
            non_anemic_probs.append(prob)

print("Nail Model Probabilities:")
print(f"Anemic ({len(anemic_probs)}):", [round(p, 4) for p in anemic_probs])
print(f"Non-anemic ({len(non_anemic_probs)}):", [round(p, 4) for p in non_anemic_probs])
