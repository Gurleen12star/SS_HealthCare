from pathlib import Path

import pandas as pd
from PIL import Image
from tqdm import tqdm


ROOT = Path(__file__).resolve().parents[3]

MANIFEST = (
    ROOT
    / "datasets"
    / "interim"
    / "anemia"
    / "sewa_manifest.csv"
)

OUTPUT = (
    ROOT
    / "datasets"
    / "interim"
    / "anemia"
    / "sewa_quality.csv"
)


def inspect_image(path):
    try:
        with Image.open(path) as image:
            image.verify()

        with Image.open(path) as image:
            width, height = image.size

        return {
            "valid": True,
            "width": width,
            "height": height,
            "error": "",
        }

    except Exception as exc:
        return {
            "valid": False,
            "width": None,
            "height": None,
            "error": str(exc),
        }


def main():
    df = pd.read_csv(MANIFEST)

    records = []

    for _, row in tqdm(
        df.iterrows(),
        total=len(df),
    ):
        path = ROOT / row["image_path"]

        info = inspect_image(path)

        records.append(
            {
                **row.to_dict(),
                **info,
            }
        )

    output = pd.DataFrame(records)

    output.to_csv(
        OUTPUT,
        index=False,
    )

    print(
        "\nValid:",
        output["valid"].sum(),
    )

    print(
        "Invalid:",
        (~output["valid"]).sum(),
    )


if __name__ == "__main__":
    main()
