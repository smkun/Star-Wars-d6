from pdfminer.high_level import extract_text
from pathlib import Path
pdf = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\C4 Universe Section.pdf")
out = Path(r"c:\\Users\\skunian\\OneDrive\\MyCode\\Star Wars Races\\C4_Universe_Section.txt")
text = extract_text(str(pdf))
out.write_text(text, encoding='utf-8')
print(f"Wrote {out}")
