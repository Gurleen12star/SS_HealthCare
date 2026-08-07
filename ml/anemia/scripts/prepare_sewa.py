from pathlib import Path
import io

import pandas as pd
from PIL import Image
from datasets import load_dataset
from tqdm import tqdm


REPO = "sewa-rural-care/anemia-survey-dataset"

ROOT = Path(__file__).resolve().parents[3]

OUTPUT_DIR = (
    ROOT
    / "datasets"
    / "raw"
    / "anemia"
    / "sewa"
    / "conjunctiva"
)

MANIFEST = (
    ROOT
    / "datasets"
    / "interim"
    / "anemia"
    / "sewa_manifest.csv"
)


def normalize_label(row):
    if "anemia_label" in row:
        value = row["anemia_label"]

        if value is not None:
            value = str(value).strip().upper()

            if value == "ANEMIC":
                return 1

            if value in {
                "NON-ANEMIC",
                "NON_ANEMIC",
                "NON ANEMIC",
            }:
                return 0

    category = row.get("hemoglobin_category")

    if category is None:
        return None

    category = str(category).strip().lower()

    if category in {
        "normal",
        "none",
        "non_anemic",
        "non-anemic",
        "no_anemia",
    }:
        return 0

    if "anemia" in category:
        return 1

    return None


def get_hb(row):
    for column in [
        "cbc_hgb_g_dl",
        "haemoglobin_gdl",
        "survey_haemoglobin",
    ]:
        if column in row:
            value = pd.to_numeric(
                row[column],
                errors="coerce",
            )

            if pd.notna(value):
                return float(value)

    return None


def save_image(image_data, path):
    if image_data is None:
        return False

    try:
        if isinstance(image_data, Image.Image):
            image = image_data

        elif isinstance(image_data, dict):
            if image_data.get("bytes") is not None:
                image = Image.open(
                    io.BytesIO(image_data["bytes"])
                )

            elif image_data.get("path"):
                image = Image.open(
                    image_data["path"]
                )

            else:
                return False

        else:
            return False

        image = image.convert("RGB")
        image.save(path, quality=95)

        return True

    except Exception as exc:
        print(f"Image error: {exc}")
        return False


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    MANIFEST.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    ds = load_dataset(
        REPO,
        split="train",
    )

    rows = []

    for row in tqdm(ds):
        patient_id = str(
            row["patient_uuid"]
        )

        label = normalize_label(row)

        if label is None:
            continue

        image_data = row.get(
            "image_conjunctiva"
        )

        output_path = (
            OUTPUT_DIR
            / f"{patient_id}.jpg"
        )

        success = save_image(
            image_data,
            output_path,
        )

        if not success:
            continue

        rows.append(
            {
                "image_path": str(
                    output_path.relative_to(ROOT)
                ),
                "patient_id": patient_id,
                "label": label,
                "hb_gdl": get_hb(row),
                "source": "sewa_india",
            }
        )

    df = pd.DataFrame(rows)

    df.to_csv(
        MANIFEST,
        index=False,
    )

    print("\nSaved images:", len(df))

    print("\nLabel distribution:")
    print(df["label"].value_counts())

    print("\nManifest:")
    print(MANIFEST)


if __name__ == "__main__":
    main()
