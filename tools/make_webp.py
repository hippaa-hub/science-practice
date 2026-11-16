#!/usr/bin/env python3
"""Shrink tools/raw/*.png into public/img/*.webp (960px wide) so the app stays small and works offline."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
src, dst = root / "tools/raw", root / "public/img"
dst.mkdir(parents=True, exist_ok=True)
total = 0
for p in sorted(src.glob("*.png")):
    out = dst / (p.stem + ".webp")
    im = Image.open(p).convert("RGB")
    im.thumbnail((960, 960))
    im.save(out, "WEBP", quality=72, method=6)
    total += out.stat().st_size
    print(f"{out.name}  {out.stat().st_size // 1024} KB")
print(f"total {total // 1024} KB")
