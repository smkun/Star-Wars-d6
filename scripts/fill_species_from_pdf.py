import json
import re
from pathlib import Path
from pdfminer.high_level import extract_text

ALIENS = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\ALIENS.json")
PDF = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\C4 Universe Section.pdf")

# Basic heuristics to find blocks like "Anzat" and a following paragraph or two.
# We'll keep it conservative: only fill if the field is empty and we find a reasonable snippet.

SPECIES_ORDER = [
    # Ids 20-47 often missing descriptions; include many known names to parse
    "Anzat","Aqualish","Barabel","Bith","Caamasi","Cathar","Cerean","Chadra-fan","Chiss",
    "Defel","Devaronian","Gand","Geonosian Worker","Geonosian Aristocrat","Givin","Gotal",
    "Gran","Herglic","Hutt","Jawa","Nautolan","Talz","Togruta","Trandoshan","Darkvision",
    "Verpine","Weequay","Yuuzhan Vong"
]

FIELDS = ["description","personality","physicalDescription","homeworld"]

HEADER_PATTERN = re.compile(r"^(?P<name>[A-Z][\w'\- ]{2,})\s*$")


def split_sections(text: str):
    lines = [l.strip() for l in text.splitlines()]
    sections = {}
    current = None
    buf = []
    for ln in lines:
        if HEADER_PATTERN.match(ln) and ln in SPECIES_ORDER:
            if current and buf:
                sections[current] = "\n".join(buf).strip()
            current = ln
            buf = []
        else:
            if current:
                buf.append(ln)
    if current and buf:
        sections[current] = "\n".join(buf).strip()
    return sections


def summarize_block(block: str):
    # crude splits to infer fields; just take first non-empty sentences
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", block) if s.strip()]
    desc = sentences[0] if sentences else ""
    # naive heuristics
    personality = next((s for s in sentences if re.search(r"temper|honor|pragmatic|curious|xenoph|peace|violent|creative|driven|reserved|gregarious|pleasant|focused", s, re.I)), "")
    physical = next((s for s in sentences if re.search(r"meters|tall|skin|horn|fur|tentacl|eyes|snout|exoskeleton|biped|amphibi|reptil|hairless|domed", s, re.I)), "")
    homeworld = ""
    m = re.search(r"homeworld(?:s)?\s*(?:of|:)\s*([A-Z][\w'\- ]+)", block, re.I)
    if m:
        homeworld = m.group(1).strip()
    return {
        "description": desc,
        "personality": personality,
        "physicalDescription": physical,
        "homeworld": homeworld,
    }


def main():
    if not PDF.exists():
        print("PDF not found; aborting.")
        return
    text = extract_text(str(PDF))
    sections = split_sections(text)

    data = json.loads(ALIENS.read_text(encoding="utf-8"))
    filled = 0
    for race in data.get("races", []):
        name = race.get("name")
        block = sections.get(name)
        if not block:
            continue
        summary = summarize_block(block)
        for f in FIELDS:
            if not race.get(f):
                val = summary.get(f, "").strip()
                if val:
                    race[f] = val
                    filled += 1
        # languages.native if empty and block mentions a language
        lang = race.get("languages", {})
        if isinstance(lang, dict) and not lang.get("native"):
            m = re.search(r"speak(?:s)?\s+([A-Z][\w'\-]+(?:ese|ian|ish|oor|ik|i|an)?)", block, re.I)
            if m:
                lang["native"] = m.group(1)
                race["languages"] = lang
                filled += 1
    ALIENS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Filled fields: {filled}")


if __name__ == "__main__":
    main()
