from collections import Counter

from datasets import load_dataset


REPO = "sewa-rural-care/anemia-survey-dataset"


def main():
    ds = load_dataset(
        REPO,
        split="train",
    )

    labels = []

    for row in ds:
        label = row.get("hemoglobin_category")

        if label is not None:
            labels.append(str(label))

    print("Total participants:", len(ds))

    print("\nHemoglobin categories:")

    counts = Counter(labels)

    for label, count in counts.items():
        print(f"{label}: {count}")


if __name__ == "__main__":
    main()
