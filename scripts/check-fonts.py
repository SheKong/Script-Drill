"""Maintenance check: requires fonttools and brotli, not used by the web app."""
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
font = TTFont(root / "src/assets/charis-sil.woff2")
cmap = font.getBestCmap()
samples = "t͡s t͜s t͡ɕ k̚ ◌̚ aː ˈ ˌ ˥˧˩ ʲ ʷ ʼ ɓ ǀ ɟ ɖ ʕ ɤ ɯ ŋ"
missing = sorted({ord(char) for char in samples if not char.isspace() and ord(char) not in cmap})
if missing:
    raise SystemExit("Missing IPA glyphs: " + ", ".join(f"U+{cp:04X}" for cp in missing))
print(f"IPA font: {len(cmap)} glyph mappings; all critical samples covered.")

for family in ("noto-sans-thai", "noto-sans-thai-looped"):
    for weight in (400, 500, 600):
        file = root / f"node_modules/@fontsource/{family}/files/{family}-thai-{weight}-normal.woff2"
        thai_cmap = TTFont(file).getBestCmap()
        expected = set(range(0x0E01, 0x0E3B)) | set(range(0x0E3F, 0x0E5C))
        missing = expected - thai_cmap.keys()
        if missing:
            raise SystemExit(f"{family} {weight}: missing {missing}")
print("Traditional/modern Thai fonts: all Thai letters, marks and digits covered.")
