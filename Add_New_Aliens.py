#!/usr/bin/env python3
"""Interactive helper to add a new species from Source Data into ALIENS.json and Firestore."""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = ROOT / "Source Data"
ALIENS_PATH = ROOT / "ALIENS.json"
import os

FIREBASE_API_KEY = os.environ.get('FIRESTORE_API_KEY', '')
PROJECT_ID = os.environ.get('FIREBASE_PROJECT_ID', 'star-wars-d6-species')


ATTRIBUTE_ALIAS = {
    "DEXTERITY": "dexterity",
    "KNOWLEDGE": "knowledge",
    "MECHANICAL": "mechanical",
    "PERCEPTION": "perception",
    "STRENGTH": "strength",
    "TECHNICAL": "technical",
}


@dataclass
class SpeciesRecord:
    name: str
    plural: str
    description: str
    personality: str
    physical_description: str
    homeworld: str
    languages_native: str
    languages_description: str
    example_names: List[str]
    adventurers: str
    move: str
    size: str
    attribute_dice: str
    attributes: Dict[str, Dict[str, str]]
    special_abilities: List[Dict[str, str]]
    story_factors: List[str]
    sources: List[str]


def prompt_file() -> Path:
    print("Available files in 'Source Data':")
    for path in sorted(SOURCE_ROOT.glob('**/*')):
        if path.is_file():
            print(f"  - {path.relative_to(SOURCE_ROOT)}")

    rel = input("\nEnter the path to the source text (relative to 'Source Data'): ").strip()
    if not rel:
        raise SystemExit("No file specified.")

    file_path = SOURCE_ROOT / rel
    if not file_path.is_file():
        raise SystemExit(f"File not found: {file_path}")
    return file_path


def load_source_text(file_path: Path) -> str:
    """
    Load source text from either plaintext, JSON produced by fetch-holocron, or structured JSON.
    """
    raw = file_path.read_text(encoding="utf-8")

    if file_path.suffix.lower() == ".json":
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return raw

        if isinstance(payload, dict):
            if "wikitext" in payload and isinstance(payload["wikitext"], str):
                return payload["wikitext"]
            if "species" in payload and isinstance(payload["species"], list):
                # If structured import JSON is provided, fall back to first species description
                first = payload["species"][0] if payload["species"] else {}
                if isinstance(first, dict) and "notes" in first:
                    print(
                        "⚠️ Structured JSON detected. Please review fields manually before upload."
                    )
                raise SystemExit(
                    "Structured import JSON detected. Use the import function instead of Add_New_Aliens.py."
                )

        return raw

    return raw


def normalize_text(text: str) -> str:
    return text.replace('\r\n', '\n').strip()


def extract_block(text: str, label: str, followers: List[str]) -> str:
    pattern = re.compile(rf"{label}:\s*(.*?)(?:\n(?:{'|'.join(map(re.escape, followers))}):|\Z)", re.S | re.I)
    match = pattern.search(text)
    if not match:
        return ""
    return match.group(1).strip()


def parse_attributes(block: str) -> Dict[str, Dict[str, str]]:
    attributes: Dict[str, Dict[str, str]] = {}
    for line in block.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        key = parts[0].upper()
        if key in ATTRIBUTE_ALIAS and len(parts) >= 2 and '/' in parts[-1]:
            min_val, max_val = parts[-1].split('/')
            attributes[ATTRIBUTE_ALIAS[key]] = {
                "min": min_val.strip(),
                "max": max_val.strip(),
            }
    return attributes


def parse_special_abilities(block: str) -> List[Dict[str, str]]:
    if not block:
        return []
    abilities: List[Dict[str, str]] = []
    current_name: Optional[str] = None
    current_desc: List[str] = []
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith("story factors"):
            break
        if ':' in line:
            name_part, rest = line.split(':', 1)
            if current_name:
                abilities.append({
                    "name": current_name.strip(),
                    "description": ' '.join(current_desc).strip(),
                })
            current_name = name_part.strip()
            current_desc = [rest.strip()]
        elif current_name:
            current_desc.append(line)
    if current_name:
        abilities.append({
            "name": current_name.strip(),
            "description": ' '.join(current_desc).strip(),
        })
    return [ability for ability in abilities if ability["name"]]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip('-')


def to_firestore_value(value):  # noqa: ANN001
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
        return {"arrayValue": {"values": [to_firestore_value(item) for item in value]}}
    if isinstance(value, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(v) for k, v in value.items()}}}
    raise TypeError(f"Unsupported value type: {type(value)}")


def upload_to_firestore(slug: str, doc: Dict) -> None:
    body = json.dumps({"fields": to_firestore_value(doc)["mapValue"]["fields"]}).encode()
    url = (
        f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)"
        f"/documents/species/{slug}?key={FIREBASE_API_KEY}"
    )
    request = urllib.request.Request(url, data=body, method="PATCH", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request) as response:  # noqa: S310
            if response.status not in (200, 201):
                raise RuntimeError(f"Firestore response: {response.status}")
    except urllib.error.HTTPError as exc:  # pragma: no cover - interactive feedback
        print(exc.read().decode(), file=sys.stderr)
        raise SystemExit(f"Firestore error: {exc}")


def parse_species(text: str) -> SpeciesRecord:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = lines[0]

    followers = [
        "Personality",
        "Physical Description",
        "Homeworld",
        "Languages",
        "Example Names",
        "Adventurers",
        "Attribute Dice",
        "Special Abilities",
        "Story Factors",
        "Move",
        "Size",
    ]

    # Description is the body preceding the Personality section
    description_section = text.split("Personality:", 1)[0]
    description = '\n'.join([line for line in description_section.splitlines()[1:] if line.strip()])
    personality = extract_block(text, "Personality", followers)
    physical_description = extract_block(text, "Physical Description", followers)
    homeworld_block = extract_block(text, "Home Planet", followers) or extract_block(text, "Homeworld", followers)
    homeworld = ""
    if homeworld_block:
        homeworld = homeworld_block.splitlines()[0]
    if not homeworld:
        homeworld = input("Homeworld not found in source. Please enter homeworld: ")
    languages_block = extract_block(text, "Languages", followers)
    example_block = extract_block(text, "Example Names", followers)
    adventurers = extract_block(text, "Adventurers", followers)
    attribute_block = extract_block(text, "Attribute Dice", followers)
    ability_block = extract_block(text, "Special Abilities", followers)
    story_block = extract_block(text, "Story Factors", followers)
    move_block = extract_block(text, "Move", followers)
    size_block = extract_block(text, "Size", followers)
    move = move_block.splitlines()[0] if move_block else input("Move value (e.g., '10/12'): ")
    size = size_block.splitlines()[0] if size_block else input("Size value (e.g., '1.6-1.8 meters'): ")

    attribute_lines = attribute_block.splitlines()
    attribute_dice = attribute_lines[0].split(":")[-1].strip() if attribute_lines else ""
    attributes = parse_attributes('\n'.join(attribute_lines[1:]))

    special_abilities = parse_special_abilities(ability_block)
    story_factors_raw = [line.strip() for line in story_block.splitlines() if line.strip()] if story_block else []
    story_factors: List[Dict[str, str]] = []
    for entry in story_factors_raw:
        if ':' in entry:
            name, desc = entry.split(':', 1)
        else:
            parts = entry.split(maxsplit=1)
            name, desc = (parts[0], parts[1] if len(parts) > 1 else entry)
        story_factors.append({"name": name.strip(), "description": desc.strip()})

    example_names = [name.strip().strip("'") for name in example_block.replace(';', ',').split(',') if name.strip()]

    languages_native = input("Native language (default from text if present): ") or (languages_block.split()[0] if languages_block else '')
    languages_desc = languages_block or input("Languages description: ")
    if not languages_native:
        languages_native = input("Please provide the native language: ")

    if not attribute_dice:
        attribute_dice = input("Attribute Dice (e.g., '12D'): ")

    return SpeciesRecord(
        name=name,
        plural=input(f"Plural form (default '{name}s'): ") or f"{name}s",
        description=description.strip(),
        personality=personality.strip(),
        physical_description=physical_description.strip(),
        homeworld=homeworld.strip(),
        languages_native=languages_native.strip(),
        languages_description=languages_desc.strip(),
        example_names=example_names,
        adventurers=adventurers.strip(),
        move=move.strip(),
        size=size.strip(),
        attribute_dice=attribute_dice.strip(),
        attributes=attributes,
        special_abilities=special_abilities,
        story_factors=story_factors,
        sources=[source.strip() for source in (input("Sources (comma separated, default 'Star Wars REUP Section 16'): ") or "Star Wars REUP Section 16").split(',') if source.strip()],
    )


def species_to_dict(record: SpeciesRecord, new_id: int, slug: str) -> Dict:
    return {
        "id": new_id,
        "name": record.name,
        "plural": record.plural,
        "description": record.description,
        "personality": record.personality,
        "physicalDescription": record.physical_description,
        "homeworld": record.homeworld,
        "languages": {
            "native": record.languages_native,
            "description": record.languages_description,
        },
        "exampleNames": record.example_names,
        "adventurers": record.adventurers,
        "imageUrl": "",
        "stats": {
            "attributeDice": record.attribute_dice,
            "attributes": record.attributes,
            "move": record.move,
            "size": record.size,
        },
        "specialAbilities": record.special_abilities,
        "storyFactors": record.story_factors,
        "notes": "",
        "sources": record.sources,
        "imagePath": "",
        "hasImage": False,
    }


def main() -> None:
    source_file = prompt_file()
    text = normalize_text(load_source_text(source_file))
    record = parse_species(text)

    data = json.loads(ALIENS_PATH.read_text(encoding="utf-8"))
    races = data["races"] if isinstance(data, dict) else data

    existing_names = {species["name"].lower(): species for species in races}
    if record.name.lower() in existing_names:
        print(f"Species '{record.name}' already exists in ALIENS.json.\nAborting.")
        return

    new_id = max((species.get("id", 0) for species in races), default=0) + 1
    slug = slugify(record.name)
    species_dict = species_to_dict(record, new_id, slug)
    races.append(species_dict)

    ALIENS_PATH.write_text(json.dumps({"races": races}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✅ Added '{record.name}' to ALIENS.json with id {new_id}.")

    print("Uploading to Firestore…")
    upload_to_firestore(slug, species_dict)
    print(f"✅ Firestore document 'species/{slug}' updated.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:  # pragma: no cover - user abort
        print("\nOperation cancelled by user.")
