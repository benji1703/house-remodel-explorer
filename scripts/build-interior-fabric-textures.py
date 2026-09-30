"""Prepare high-resolution albedo maps from the authored interior material swatches."""
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "public" / "textures"


def build(source: str, target: str, *, saturation: float, brightness: float, contrast: float) -> None:
    image = Image.open(TEXTURES / source).convert("RGB")
    image = ImageOps.fit(image, (2048, 2048), method=Image.Resampling.LANCZOS)
    image = ImageEnhance.Color(image).enhance(saturation)
    image = ImageEnhance.Brightness(image).enhance(brightness)
    image = ImageEnhance.Contrast(image).enhance(contrast)
    image.save(TEXTURES / target, "JPEG", quality=94, subsampling=0, optimize=True)


build("door-oak-source.jpg", "door-oak-albedo.jpg", saturation=0.60, brightness=1.06, contrast=0.88)
build("linen-washed-source.jpg", "linen-washed-albedo.jpg", saturation=0.67, brightness=1.04, contrast=0.86)
build("chair-rush-source.jpg", "chair-rush-albedo.jpg", saturation=0.60, brightness=1.02, contrast=0.82)
build("lime-plaster-source.jpg", "lime-plaster-albedo.jpg", saturation=0.90, brightness=1.0, contrast=0.90)
