from pathlib import Path
import json

import pandas as pd
from sklearn.model_selection import train_test_split


RANDOM_STATE = 42

ROOT = Path(__file__).resolve().parents[3]

INPUT = (
    ROOT
    / "datasets"
    / "interim"
    / "anemia"
    / "sewa_manifest.csv"
)

OUTPUT_DIR = (
    ROOT
    / "datasets"
    / "processed"
    / "anemia"
)


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    df = pd.read_csv(INPUT)

    df = df.drop_duplicates(
        subset=["image_path"]
    ).copy()

    patients = (
        df[
            [
                "patient_id",
                "label",
            ]
        ]
        .drop_duplicates()
    )

    # Ensure one binary label per patient.
    patient_label_counts = (
        patients
        .groupby("patient_id")["label"]
        .nunique()
    )

    bad_patients = patient_label_counts[
        patient_label_counts > 1
    ]

    if len(bad_patients) > 0:
        raise ValueError(
            "Some patients have conflicting labels."
        )

    train_patients, temp_patients = (
        train_test_split(
            patients,
            test_size=0.30,
            random_state=RANDOM_STATE,
            stratify=patients["label"],
        )
    )

    val_patients, test_patients = (
        train_test_split(
            temp_patients,
            test_size=0.50,
            random_state=RANDOM_STATE,
            stratify=temp_patients["label"],
        )
    )

    train_ids = set(
        train_patients["patient_id"]
    )

    val_ids = set(
        val_patients["patient_id"]
    )

    test_ids = set(
        test_patients["patient_id"]
    )

    assert train_ids.isdisjoint(val_ids)
    assert train_ids.isdisjoint(test_ids)
    assert val_ids.isdisjoint(test_ids)

    train_df = df[
        df["patient_id"].isin(train_ids)
    ].copy()

    val_df = df[
        df["patient_id"].isin(val_ids)
    ].copy()

    test_df = df[
        df["patient_id"].isin(test_ids)
    ].copy()

    train_df["split"] = "train"
    val_df["split"] = "val"
    test_df["split"] = "test"

    train_df.to_csv(
        OUTPUT_DIR / "train.csv",
        index=False,
    )

    val_df.to_csv(
        OUTPUT_DIR / "val.csv",
        index=False,
    )

    test_df.to_csv(
        OUTPUT_DIR / "test.csv",
        index=False,
    )

    summary = {
        "random_state": RANDOM_STATE,
        "train_images": len(train_df),
        "val_images": len(val_df),
        "test_images": len(test_df),
        "train_patients": len(train_ids),
        "val_patients": len(val_ids),
        "test_patients": len(test_ids),
        "train_positive": int(
            train_df["label"].sum()
        ),
        "val_positive": int(
            val_df["label"].sum()
        ),
        "test_positive": int(
            test_df["label"].sum()
        ),
    }

    with open(
        OUTPUT_DIR / "dataset_summary.json",
        "w",
    ) as file:
        json.dump(
            summary,
            file,
            indent=2,
        )

    print(json.dumps(
        summary,
        indent=2,
    ))

    print(
        "\n✓ No patient leakage detected."
    )


if __name__ == "__main__":
    main()
