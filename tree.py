from pathlib import Path

IGNORE_DIRS = {
    ".next",
    "node_modules",
    ".git",
    ".turbo",
    ".vercel",
    "dist",
    "build",
    "coverage",
    ".idea",
    ".vscode",
    "__pycache__",
}

IGNORE_FILES = {
    ".DS_Store",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
}

def build_tree(path: Path, prefix=""):
    entries = sorted(
        [
            p
            for p in path.iterdir()
            if not (
                (p.is_dir() and p.name in IGNORE_DIRS)
                or (p.is_file() and p.name in IGNORE_FILES)
            )
        ],
        key=lambda p: (p.is_file(), p.name.lower()),
    )

    lines = []

    for i, entry in enumerate(entries):
        last = i == len(entries) - 1
        connector = "└── " if last else "├── "
        lines.append(f"{prefix}{connector}{entry.name}")

        if entry.is_dir():
            extension = "    " if last else "│   "
            lines.extend(build_tree(entry, prefix + extension))

    return lines

root = Path(".").resolve()

tree = [root.name]
tree.extend(build_tree(root))

output_file = root / "tree.txt"
output_file.write_text("\n".join(tree), encoding="utf-8")

print(f"Tree exported to: {output_file}")