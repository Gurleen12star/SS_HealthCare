import os
from pathlib import Path
from PIL import Image
import pandas as pd
import torch
from torch.utils.data import Dataset
from torchvision import transforms

class GhanaConjunctivaDataset(Dataset):
    def __init__(self, csv_file, root_dir, split="train", use_roi=False, mild_aug=False):
        """
        csv_path: path to ghana_train.csv, ghana_val.csv, or ghana_test.csv
        root_dir: Cardiofy root directory
        split: 'train', 'val', or 'test'
        """
        self.data = pd.read_csv(csv_file)
        self.data_frame = pd.read_csv(csv_file)
        self.root_dir = Path(root_dir)
        self.split = split
        self.use_roi = use_roi
        self.mild_aug = mild_aug
        
        # User explicitly requested controlled dynamic augmentation for train set only
        if self.split == "train":
            if self.mild_aug:
                self.transform = transforms.Compose([
                    transforms.Resize((256, 256)),
                    transforms.RandomCrop((224, 224)),
                    transforms.RandomRotation(7),
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ])
            else:
                self.transform = transforms.Compose([
                    transforms.Resize((256, 256)),
                    transforms.RandomCrop((224, 224)),
                    transforms.RandomRotation(15),
                    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
                    transforms.ColorJitter(
                        brightness=0.2,
                        contrast=0.2,
                        saturation=0.2,
                        hue=0.05,
                    ),
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                ])
        else:
            # Deterministic preprocessing only
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ])

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        
        if self.use_roi and 'roi_path' in self.data_frame.columns:
            img_path = self.root_dir / self.data_frame.iloc[idx]['roi_path']
        else:
            img_path = self.root_dir / self.data_frame.iloc[idx]['image_path']
        
        label = row['label']
        
        # Open image and convert to RGB (some might be RGBA)
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(label, dtype=torch.float32)

