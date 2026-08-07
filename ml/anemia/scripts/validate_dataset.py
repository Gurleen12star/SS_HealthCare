from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[3]

DATA = (
    ROOT
    / "datasets"
    / "processed"
    / "anemia"
)


def main():
    train = pd.read_csv(
        DATA / "train.csv"
    )

    val = pd.read_csv(
        DATA / "val.csv"
    )

    test = pd.read_csv(
        DATA / "test.csv"
    )

    required = {
        "image_path",
        "patient_id",
        "label",
        "source",
        "split",
    }

    for name, df in [
        ("train", train),
        ("val", val),
        ("test", test),
    ]:
        missing = required - set(df.columns)

        assert not missing, (
            f"{name}: missing {missing}"
        )

        assert set(
            df["label"].unique()
        ).issubset({0, 1})

        for image_path in df["image_path"]:
            assert (
                ROOT / image_path
            ).exists(), image_path

    train_ids = set(train.patient_id)
    val_ids = set(val.patient_id)
    test_ids = set(test.patient_id)

    assert train_ids.isdisjoint(val_ids)
    assert train_ids.isdisjoint(test_ids)
    assert val_ids.isdisjoint(test_ids)

    print("✓ Columns valid")
    print("✓ Labels valid")
    print("✓ Images exist")
    print("✓ Train/val/test separated")
    print("✓ No patient leakage")
    print("\nDATASET READY FOR TRAINING")


if __name__ == "__main__":
    main()
