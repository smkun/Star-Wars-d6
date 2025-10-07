import json
from pathlib import Path

ALIENS = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\ALIENS.json")
REPORT = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\ALIENS_missing_fields.md")

FIELDS = ["description","personality","physicalDescription","homeworld"]
LANG_FIELDS = ["native","description"]


def main():
    data = json.loads(ALIENS.read_text(encoding="utf-8"))
    lines = ["# Missing fields in ALIENS.json\n"]
    total_missing = 0
    for r in data.get("races", []):
        missing = []
        for f in FIELDS:
            if not r.get(f):
                missing.append(f)
        lang = r.get("languages", {}) if isinstance(r.get("languages"), dict) else {}
        for lf in LANG_FIELDS:
            if not lang.get(lf):
                missing.append(f"languages.{lf}")
        if missing:
            total_missing += len(missing)
            lines.append(f"- ID {r.get('id')}: {r.get('name')} → missing: {', '.join(missing)}")
    lines.append(f"\nTotal missing fields: {total_missing}")
    REPORT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote report to {REPORT}")

if __name__ == "__main__":
    main()
