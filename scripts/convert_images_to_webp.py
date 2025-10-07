#!/usr/bin/env python3
"""Convert source alien images to optimized WebP assets and update ALIENS.json."""
from __future__ import annotations

import json
import re
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Pillow is required. Install with `python3 -m pip install pillow` and rerun."
    ) from exc

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "Source Data" / "Aliens"
TARGET_DIR = ROOT / "web" / "public" / "aliens"
ALIENS_PATH = ROOT / "ALIENS.json"
QUALITY = 85

ALIASES = {
    "gamorrean": "gamorean",
    "wookiee": "wookie",
    "sullustan": "sulustan",
    "geonosianworker": "geonosian",
    "geonosianaristocrat": "geonosian",
}


def sanitize(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "species"


def build_file_map() -> dict[str, Path]:
    if not SOURCE_DIR.exists():
        raise SystemExit(f"Missing source directory: {SOURCE_DIR}")
    mapping: dict[str, Path] = {}
    for file_path in SOURCE_DIR.glob("*.*"):
        key = sanitize(file_path.stem)
        mapping[key] = file_path
    return mapping


def convert_image(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as img:
        rgb = img.convert("RGB")
        rgb.save(destination, "WEBP", quality=QUALITY, method=6)


def main() -> None:
    file_map = build_file_map()
    data = json.loads(ALIENS_PATH.read_text(encoding="utf-8"))
    races = data["races"] if isinstance(data, dict) else data

    used_keys: dict[str, int] = {}
    missing_sources: list[str] = []

    for index, species in enumerate(races):
        name = species.get("name", f"species-{index}")
        base_key = sanitize(name)
        file_key = base_key if base_key in file_map else ALIASES.get(base_key)

        if not file_key or file_key not in file_map:
            missing_sources.append(name)
            continue

        source_path = file_map[file_key]

        slug = slugify(name)
        # Ensure uniqueness if duplicate slugs exist (e.g., Verpine variants)
        count = used_keys.get(slug, 0)
        used_keys[slug] = count + 1
        if count:
            slug = f"{slug}-{species.get('id', index)}"

        destination = TARGET_DIR / f"{slug}.webp"
        convert_image(source_path, destination)

        species["imageUrl"] = f"{slug}.webp"
        species["imagePath"] = f"aliens/{slug}.webp"
        species["hasImage"] = True

    if missing_sources:
        print("⚠️  Missing source images for:", ", ".join(missing_sources))

    ALIENS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"✅ Converted images written to {TARGET_DIR.relative_to(ROOT)} and dataset updated.")


if __name__ == "__main__":
    main()
