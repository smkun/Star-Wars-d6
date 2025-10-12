#!/usr/bin/env python3
import json
import subprocess
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import os

API_KEY = os.environ.get('FIRESTORE_API_KEY', '')
PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'star-wars-d6-species')
CREATE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/species"


def load_records():
    payload = json.loads(Path("ALIENS.json").read_text())
    records = payload if isinstance(payload, list) else payload.get("races", [])
    if not records:
        raise SystemExit("ALIENS.json must contain races array")
    return records


def slugify(name: str, fallback: str) -> str:
    base = unicodedata.normalize("NFKD", name or "")
    cleaned = "".join(ch.lower() if ch.isalnum() else "-" for ch in base)
    slug = "-".join(filter(None, cleaned.split('-')))
    return slug or fallback


def normalize_dice(value: str) -> str:
    return value.upper() if isinstance(value, str) else value


def normalize_attributes(attrs: dict) -> dict:
    result = {}
    for key, value in (attrs or {}).items():
        if not isinstance(value, dict):
            continue
        result[key] = {
            "min": normalize_dice(value.get("min", "")),
            "max": normalize_dice(value.get("max", "")),
        }
    return result


def tokenize(*parts) -> list[str]:
    tokens = set()
    for part in parts:
        if not part:
            continue
        as_string = " ".join(part) if isinstance(part, list) else str(part)
        for token in as_string.replace("/", " ").replace(",", " ").split():
            cleaned = token.lower().strip()
            if cleaned:
                tokens.add(cleaned)
    return sorted(tokens)


def to_value(value):
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, float):
        return {"doubleValue": value}
    if isinstance(value, str):
        return {"stringValue": value}
    if isinstance(value, list):
        return {"arrayValue": {"values": [to_value(item) for item in value]}}
    if isinstance(value, dict):
        fields = {k: to_value(v) for k, v in value.items() if v is not None}
        return {"mapValue": {"fields": fields}}
    raise TypeError(f"Unsupported value type: {type(value)}")


def build_payload(record: dict, index: int) -> tuple[str, bytes]:
    name = record.get("name", f"species-{index}")
    slug = slugify(name, f"species-{index}")

    stats = record.get("stats", {})
    normalized_stats = {
        **stats,
        "attributeDice": normalize_dice(stats.get("attributeDice", "")),
        "attributes": normalize_attributes(stats.get("attributes")),
    }

    doc = {
        **record,
        "stats": normalized_stats,
        "slug": slug,
        "searchName": name.strip().lower(),
        "searchTokens": tokenize(name, record.get("homeworld"), record.get("sources", [])),
        "sortName": name.strip().lower(),
        "hasImage": bool(record.get("imageUrl")),
        "imagePath": f"aliens/{slug}.webp" if record.get("imageUrl") else None,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    payload = json.dumps({"fields": to_value(doc)["mapValue"]["fields"]}).encode()
    return slug, payload


def import_record(slug: str, payload: bytes):
    url = f"{CREATE_URL}/{slug}?key={API_KEY}"
    result = subprocess.run(
        [
            "curl",
            "-sS",
            "-X",
            "PATCH",
            "-H",
            "Content-Type: application/json",
            url,
            "--data-binary",
            "@-",
        ],
        input=payload,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode().strip())


def main():
    records = load_records()
    for index, record in enumerate(records):
        slug, payload = build_payload(record, index)
        try:
            import_record(slug, payload)
            print(f"Imported {slug}")
        except Exception as exc:  # noqa: BLE001
            raise SystemExit(f"Import failed on {slug}: {exc}")
    print(f"✅ Imported {len(records)} species documents.")


if __name__ == "__main__":
    main()
