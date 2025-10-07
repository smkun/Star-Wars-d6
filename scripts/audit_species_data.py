#!/usr/bin/env python3
"""Audit ALIENS.json for missing or placeholder fields."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

ALIENS_PATH = Path(__file__).resolve().parent.parent / "ALIENS.json"

@dataclass
class Issue:
    name: str
    problems: List[str]

    def __bool__(self) -> bool:
        return bool(self.problems)


def load_species() -> Iterable[dict]:
    raw = json.loads(ALIENS_PATH.read_text(encoding="utf-8"))
    if isinstance(raw, dict) and "races" in raw:
        return raw["races"]
    if isinstance(raw, list):
        return raw
    raise RuntimeError("ALIENS.json must contain either top-level list or {\"races\": []}")


def audit_species(species: dict) -> Issue:
    name = species.get("name", "<unknown>")
    problems: List[str] = []

    stats = species.get("stats", {}) or {}
    if not stats.get("move"):
        problems.append("missing move")
    if not stats.get("size"):
        problems.append("missing size")

    abilities = species.get("specialAbilities")
    if abilities is None:
        problems.append("missing special abilities list")
    elif len(abilities) == 1 and abilities[0].get("name") == "Special":
        problems.append("placeholder special ability")

    sources = species.get("sources") or []
    if not sources:
        problems.append("missing sources")

    for field in ("description", "personality", "physicalDescription"):
        if not (species.get(field) or "").strip():
            problems.append(f"missing {field}")

    if isinstance(stats.get("attributes"), dict):
        for attr in ("dexterity", "knowledge", "mechanical", "perception", "strength", "technical"):
            rng = stats["attributes"].get(attr)
            if not rng or not rng.get("min") or not rng.get("max"):
                problems.append(f"incomplete {attr} range")

    return Issue(name=name, problems=problems)


def main() -> None:
    issues = [issue for species in load_species() if (issue := audit_species(species))]
    if not issues:
        print("✅ All species records look complete.")
        return

    print("⚠️  Incomplete species data detected:\n")
    for issue in issues:
        print(f"- {issue.name}:")
        for problem in issue.problems:
            print(f"  • {problem}")
        print()

    print(f"Total species with issues: {len(issues)}")


if __name__ == "__main__":
    main()
