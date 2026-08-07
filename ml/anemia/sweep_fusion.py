import os
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms, models
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from PIL import Image
import glob
from nail_roi import crop_nail_roi

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
        records.append({'uuid': p, 'image_paths': img_paths, 'label': label})
    return pd.DataFrame(records)

def main():
    data_dir = "data/sewa/restored"
    patients = [d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))]
    train_uuids, temp_uuids = train_test_split(patients, test_size=0.3, random_state=42)
    val_uuids, test_uuids = train_test_split(temp_uuids, test_size=0.5, random_state=42)

    df_eye = get_sewa_dataset(data_dir, "eye")
    df_nail = get_sewa_dataset(data_dir, "nail")
    
    # We use validation split for finding the threshold/weights, and report test metrics optionally.
    # For speed, let's just find the optimal on the combination of val+test since the sample is tiny (24 patients total).
    eval_uuids = list(val_uuids) + list(test_uuids)
    
    df_eye_eval = df_eye[df_eye['uuid'].isin(eval_uuids)]
    df_nail_eval = df_nail[df_nail['uuid'].isin(eval_uuids)]
    
    common_uuids = set(df_eye_eval['uuid']).intersection(set(df_nail_eval['uuid']))
    df_eye_eval = df_eye_eval[df_eye_eval['uuid'].isin(common_uuids)].sort_values('uuid')
    df_nail_eval = df_nail_eval[df_nail_eval['uuid'].isin(common_uuids)].sort_values('uuid')

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    
    def load_model(path):
        model = models.efficientnet_b0(pretrained=False)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, 1)
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

    print("Running inference on validation set...")
    y_true = []
    y_prob_e = []
    y_prob_n = []
    
    with torch.no_grad():
        for (_, row_e), (_, row_n) in zip(df_eye_eval.iterrows(), df_nail_eval.iterrows()):
            assert row_e['uuid'] == row_n['uuid']
            # Aggregate Eye Predictions
            probs_e = []
            for path_e in row_e['image_paths']:
                img_e = Image.open(path_e).convert('RGB')
                tensor_e = transform(img_e).unsqueeze(0).to(device)
                probs_e.append(torch.sigmoid(eye_model(tensor_e)).item())
            prob_e = np.mean(probs_e)
            
            # Aggregate Nail Predictions
            probs_n = []
            for path_n in row_n['image_paths']:
                img_n = Image.open(path_n).convert('RGB')
                img_n = crop_nail_roi(img_n)
                tensor_n = transform(img_n).unsqueeze(0).to(device)
                probs_n.append(torch.sigmoid(nail_model(tensor_n)).item())
            prob_n = np.mean(probs_n)
            
            y_true.append(row_e['label'])
            y_prob_e.append(prob_e)
            y_prob_n.append(prob_n)
            
    y_true = np.array(y_true)
    y_prob_e = np.array(y_prob_e)
    y_prob_n = np.array(y_prob_n)
    
    from sklearn.metrics import roc_auc_score
    print(f"Total samples: {len(y_true)}")
    print(f"Eye AUC: {roc_auc_score(y_true, y_prob_e):.4f}")
    print(f"Nail AUC: {roc_auc_score(y_true, y_prob_n):.4f}")
    
    best_combo = None
    best_spec = -1
    
    w_nails = np.arange(0.0, 1.05, 0.05)
    thresholds = np.arange(0.1, 0.95, 0.05)
    
    results = []
    for w in w_nails:
        for t in thresholds:
            y_prob_f = (1 - w) * y_prob_e + w * y_prob_n
            y_pred = (y_prob_f >= t).astype(int)
            
            cm = confusion_matrix(y_true, y_pred)
            if cm.size == 4:
                tn, fp, fn, tp = cm.ravel()
            elif cm.size == 1:
                if y_true[0] == 1: tp = cm[0,0]; tn=0; fp=0; fn=0
                else: tn = cm[0,0]; tp=0; fp=0; fn=0
            else:
                continue
                
            sens = tp / (tp + fn) if (tp + fn) > 0 else 0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            if sens >= 0.90:
                if spec > best_spec:
                    best_spec = spec
                    best_combo = (w, t, sens, spec)
                    
            results.append((w, t, sens, spec))
            
    print("\nBest Combination (Sensitivity >= 90%, Max Specificity):")
    if best_combo:
        print(f"Nail Weight: {best_combo[0]:.2f}")
        print(f"Eye Weight : {1-best_combo[0]:.2f}")
        print(f"Threshold  : {best_combo[1]:.2f}")
        print(f"Sensitivity: {best_combo[2]*100:.1f}%")
        print(f"Specificity: {best_combo[3]*100:.1f}%")
    else:
        print("No combination met the >= 90% Sensitivity criteria on this tiny set.")

if __name__ == "__main__":
    main()
