import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, confusion_matrix
from PIL import Image
import glob
import json

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
        
        records.append({'uuid': p, 'image_path': img_paths[0], 'label': label})
    return pd.DataFrame(records)

def evaluate():
    data_dir = "data/sewa/restored"
    patients = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    train_uuids, temp_uuids = train_test_split(patients, test_size=0.3, random_state=42)
    val_uuids, test_uuids = train_test_split(temp_uuids, test_size=0.5, random_state=42)

    df_eye = get_sewa_dataset(data_dir, "eye")
    df_nail = get_sewa_dataset(data_dir, "nail")
    
    # We evaluate on the test split
    df_eye_test = df_eye[df_eye['uuid'].isin(test_uuids)]
    df_nail_test = df_nail[df_nail['uuid'].isin(test_uuids)]

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    
    def load_model(path):
        model = models.efficientnet_b0(pretrained=False)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
        if os.path.exists(path):
            model.load_state_dict(torch.load(path, map_location=device, weights_only=True))
        model.to(device)
        model.eval()
        return model

    eye_model = load_model("weights/sewa_eye_best.pt")
    nail_model = load_model("weights/sewa_nail_best.pt")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    def run_inference(df, model):
        y_true = []
        y_prob = []
        with torch.no_grad():
            for _, row in df.iterrows():
                img = Image.open(row['image_path']).convert('RGB')
                tensor = transform(img).unsqueeze(0).to(device)
                prob = torch.sigmoid(model(tensor)).item()
                y_true.append(row['label'])
                y_prob.append(prob)
        return np.array(y_true), np.array(y_prob)
        
    def get_metrics(y_true, y_prob):
        if len(set(y_true)) < 2:
            return {"sens": 0, "spec": 0, "auc": 0, "error": "Only one class in set"}
            
        auc = roc_auc_score(y_true, y_prob)
        y_pred = (y_prob >= 0.5).astype(int)
        
        # Handle cases where confusion matrix doesn't output 4 values
        cm = confusion_matrix(y_true, y_pred)
        if cm.size == 4:
            tn, fp, fn, tp = cm.ravel()
        elif cm.size == 1:
            # Only one class was predicted and existed
            if y_true[0] == 1: tp = cm[0,0]; tn=0; fp=0; fn=0
            else: tn = cm[0,0]; tp=0; fp=0; fn=0
        
        sens = tp / (tp + fn) if (tp + fn) > 0 else 0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        return {"sens": sens, "spec": spec, "auc": auc}

    results = {}
    print(f"Evaluating on Test Set ({len(test_uuids)} patients)...\n")
    
    y_true_e, y_prob_e = run_inference(df_eye_test, eye_model)
    results['Eye'] = get_metrics(y_true_e, y_prob_e)
    
    y_true_n, y_prob_n = run_inference(df_nail_test, nail_model)
    results['Nail'] = get_metrics(y_true_n, y_prob_n)
    
    common_uuids = set(df_eye_test['uuid']).intersection(set(df_nail_test['uuid']))
    df_eye_common = df_eye_test[df_eye_test['uuid'].isin(common_uuids)].sort_values('uuid')
    df_nail_common = df_nail_test[df_nail_test['uuid'].isin(common_uuids)].sort_values('uuid')
    
    if len(common_uuids) > 0:
        _, y_prob_e_c = run_inference(df_eye_common, eye_model)
        y_true_c, y_prob_n_c = run_inference(df_nail_common, nail_model)
        
        y_prob_fusion = (0.7 * y_prob_e_c) + (0.3 * y_prob_n_c)
        results['Fusion'] = get_metrics(y_true_c, y_prob_fusion)
        
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    evaluate()
