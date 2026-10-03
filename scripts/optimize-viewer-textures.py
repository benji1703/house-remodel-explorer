"""Encode web albedo textures at their original resolution.

Run after changing the source JPG textures. Requires Pillow with WebP support.
Source files remain the inputs to the material authoring pipeline. Normal and
roughness JPG maps are served unchanged to avoid another lossy encoding pass.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import json

root = Path(__file__).resolve().parents[1] / "public" / "textures"
names = ["door-oak-albedo", "lime-plaster-albedo", "linen-washed-albedo", "chair-rush-albedo"]
names += [f"herringbone-parquet-{channel}-{resolution}" for resolution in ["1k", "2k"] for channel in ["diff", "normal", "rough"]]
report = []
for name in names:
    source = root / f"{name}.jpg"
    target = root / f"{name}.webp"
    lossless = "-normal-" in name or "-rough-" in name
    with Image.open(source) as original:
        image = original.convert("RGB")
        if lossless:
            target = source
        else:
            image.save(target, "WEBP", quality=90, method=6)
        with Image.open(target) as encoded:
            assert encoded.size == image.size
            difference = ImageChops.difference(image, encoded.convert("RGB"))
            if lossless:
                assert difference.getbbox() is None, f"Data map changed: {name}"
            error = sum(ImageStat.Stat(difference).mean) / 3
        report.append({"texture": name, "resolution": image.size, "dataMapUnchanged": lossless,
                       "sourceBytes": source.stat().st_size, "webBytes": target.stat().st_size,
                       "meanChannelError": round(error, 3)})
print(json.dumps({"textures": report, "sourceBytes": sum(r["sourceBytes"] for r in report),
                  "webBytes": sum(r["webBytes"] for r in report)}, indent=2))
