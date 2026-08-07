from pathlib import Path
import random

import matplotlib.pyplot as plt
from PIL import Image


ROOT = Path(__file__).resolve().parents[3]

IMAGE_DIR = (
    ROOT
    / "datasets"
    / "raw"
    / "anemia"
    / "sewa"
    / "conjunctiva"
)


def main():
    images = list(
        IMAGE_DIR.glob("*.jpg")
    )

    sample_size = min(16, len(images))

    if sample_size == 0:
        print("No images found to preview.")
        return

    samples = random.sample(
        images,
        sample_size,
    )

    fig, axes = plt.subplots(
        4,
        4,
        figsize=(10, 10),
    )

    axes = axes.flatten()

    for ax in axes:
        ax.axis("off")

    for ax, path in zip(
        axes,
        samples,
    ):
        image = Image.open(path)

        ax.imshow(image)
        ax.set_title(
            path.stem[:8],
            fontsize=8,
        )

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
