from pathlib import Path
import hashlib

import pandas as pd


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
    / "processed"
    / "anemia"
    / "duplicate_report.csv"
)


def sha256_file(path):
    hasher = hashlib.sha256()

    with open(path, "rb") as file:
        while True:
            chunk = file.read(1024 * 1024)

            if not chunk:
                break

            hasher.update(chunk)

    return hasher.hexdigest()


def main():
    df = pd.read_csv(MANIFEST)

    hashes = []

    for image_path in df["image_path"]:
        path = ROOT / image_path

        hashes.append(
            sha256_file(path)
        )

    df["sha256"] = hashes

    duplicates = df[
        df.duplicated(
            subset=["sha256"],
            keep=False,
        )
    ].sort_values("sha256")

    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    duplicates.to_csv(
        OUTPUT,
        index=False,
    )

    print(
        "Duplicate rows:",
        len(duplicates),
    )

    print(
        "Unique images:",
        df["sha256"].nunique(),
    )


if __name__ == "__main__":
    main()
