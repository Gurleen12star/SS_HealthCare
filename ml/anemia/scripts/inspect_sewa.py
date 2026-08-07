from datasets import load_dataset


REPO = "sewa-rural-care/anemia-survey-dataset"


def main():
    print("Loading SEWA Rural dataset...")

    ds = load_dataset(
        REPO,
        split="train",
    )

    print("\nDataset:")
    print(ds)

    print("\nNumber of rows:")
    print(len(ds))

    print("\nColumns:")
    for column in ds.column_names:
        print("-", column)

    print("\nFirst participant:")

    row = ds[0]

    for key in [
        "patient_uuid",
        "hemoglobin_category",
        "cbc_hgb_g_dl",
    ]:
        if key in row:
            print(f"{key}: {row[key]}")


if __name__ == "__main__":
    main()
