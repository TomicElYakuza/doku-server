from pathlib import Path

ROOT = Path("src")

EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".md",
}

# Nur echte kaputte Textmarker.
# Wichtig: kein "ï¸" prüfen, weil das bei Windows PowerShell/Emoji-Folgen false positives erzeugt.
MARKERS = [
    "Ã¤",
    "Ã¶",
    "Ã¼",
    "Ã„",
    "Ã–",
    "Ãœ",
    "ÃŸ",
    "ðŸ",
    "â€",
    "â€“",
    "â€”",
    "â†",
    "âœ",
    "âš",
    "Â·",
    "�",
]

matches = []

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    if path.suffix.lower() not in EXTENSIONS:
        continue

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        matches.append((path, 0, "FILE_NOT_UTF8"))
        continue

    for line_number, line in enumerate(text.splitlines(), start=1):
        if any(marker in line for marker in MARKERS):
            matches.append((path, line_number, line.strip()))

print(f"ENCODING_MATCHES={len(matches)}")

for path, line_number, line in matches[:80]:
    print(f"{path}:{line_number}: {line}")