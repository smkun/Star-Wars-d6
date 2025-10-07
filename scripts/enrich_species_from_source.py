#!/usr/bin/env python3
"""Fill missing species data in ALIENS.json using Source Data text."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
ALIENS_PATH = ROOT / "ALIENS.json"
SOURCE_PATH = ROOT / "Source Data" / "C4_Universe_Section.txt"
DEFAULT_SOURCE = "Star Wars REUP Section 16"

SECTION_HEADER = re.compile(r"\n([A-Z][A-Z\s\-']+)\n\n")
MOVE_RE = re.compile(r"Move:\s*([^\n]+)")
SIZE_RE = re.compile(r"Size:\s*([^\n]+)")
SPECIAL_BLOCK_RE = re.compile(
    r"Special Abilities:\s*(.*?)\n\s*Move:", re.DOTALL | re.IGNORECASE
)

ALIASES = {
    "CEREAN": "CEREANS",
    "CEREANS": "CEREANS",
    "GEONOSIAN WORKER": "GEONOSIAN",
    "GEONOSIAN ARISTOCRAT": "GEONOSIAN",
    "RODIAN": "RODIANS",
    "NAUTOLAN": "NAUTOLANS",
    "TRANDOSHAN": "TRANDOSHANS",
}


def normalize_key(name: str) -> str:
    return name.upper().replace("’", "'").replace("–", "-")


def load_sections() -> Dict[str, str]:
    text = SOURCE_PATH.read_text(encoding="utf-8").replace("\r\n", "\n")
    matches = list(SECTION_HEADER.finditer(text))
    sections: Dict[str, str] = {}
    for idx, match in enumerate(matches):
        key = normalize_key(match.group(1).strip())
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        sections[key] = text[start:end].strip()
    return sections


def clean_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def extract_move(section: str) -> Optional[str]:
    match = MOVE_RE.search(section)
    if match:
        return clean_whitespace(match.group(1))
    return None


def extract_size(section: str) -> Optional[str]:
    match = SIZE_RE.search(section)
    if match:
        return clean_whitespace(match.group(1))
    return None


def extract_special_abilities(section: str) -> Optional[List[Dict[str, str]]]:
    match = SPECIAL_BLOCK_RE.search(section)
    if not match:
        return None

    block = match.group(1)
    abilities: List[Dict[str, str]] = []
    current_name: Optional[str] = None
    current_desc: List[str] = []

    for raw_line in block.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.lower().startswith("story factors"):
            break
        if ":" in line:
            name_part, rest = line.split(":", 1)
            if name_part.lower().strip() == "special abilities":
                continue
            if current_name:
                abilities.append({
                    "name": clean_whitespace(current_name),
                    "description": clean_whitespace(" ".join(current_desc)),
                })
            current_name = name_part
            current_desc = [rest]
        elif current_name:
            current_desc.append(line)

    if current_name:
        abilities.append({
            "name": clean_whitespace(current_name),
            "description": clean_whitespace(" ".join(current_desc)),
        })

    return abilities or None


def should_replace_abilities(current: List[Dict[str, str]]) -> bool:
    if not current:
        return True
    if len(current) == 1 and current[0].get("name", "").lower() == "special":
        return True
    return False


def enrich() -> None:
    data = json.loads(ALIENS_PATH.read_text(encoding="utf-8"))
    races = data["races"] if isinstance(data, dict) else data

    sections = load_sections()
    updated = 0

    for species in races:
        name = species.get("name", "")
        key = normalize_key(name)
        section_key = key if key in sections else ALIASES.get(key, key)
        section = sections.get(section_key)
        if not section:
            continue

        stats = species.setdefault("stats", {})

        if not stats.get("move"):
            move = extract_move(section)
            if move:
                stats["move"] = move
        if not stats.get("size"):
            size = extract_size(section)
            if size:
                stats["size"] = size

        current_abilities = species.get("specialAbilities") or []
        if should_replace_abilities(current_abilities):
            new_abilities = extract_special_abilities(section)
            species["specialAbilities"] = new_abilities or []
        else:
            new_abilities = extract_special_abilities(section)
            if new_abilities:
                species["specialAbilities"] = new_abilities

        # Normalise sources
        species["sources"] = [DEFAULT_SOURCE]

        updated += 1

    ALIENS_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Processed {updated} species entries.")


if __name__ == "__main__":
    enrich()
ALIASES = {
    "CEREAN": "CEREANS",
    "CEREANS": "CEREANS",
    "GEONOSIAN WORKER": "GEONOSIAN",
    "GEONOSIAN ARISTOCRAT": "GEONOSIAN",
}
