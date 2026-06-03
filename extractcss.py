from pathlib import Path
import re

ROOT = Path(".")
OUTPUT = ROOT / "jsx_styles_extract.txt"

pattern = re.compile(
    r"<style\s+jsx(?:\s+global)?\s*>\s*\{`(.*?)`\}\s*</style>",
    re.DOTALL,
)

out = []
count = 0

for file in sorted(ROOT.rglob("*.tsx")):
    try:
        text = file.read_text(encoding="utf-8")
    except Exception:
        continue

    blocks = pattern.findall(text)

    if not blocks:
        continue

    out.append(f"\nFILE: {file}\n")

    for idx, css in enumerate(blocks, 1):
        count += 1
        out.append(f"BLOCK {idx}\n")
        out.append(css.strip())
        out.append("\n")

OUTPUT.write_text("\n".join(out), encoding="utf-8")

print(f"{count} style blocks extracted")
print(f"Output: {OUTPUT}")