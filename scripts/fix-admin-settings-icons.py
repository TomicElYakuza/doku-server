from pathlib import Path

path = Path("src/app/admin/settings/page.tsx")
text = path.read_text(encoding="utf-8")

replacements = {
    'icon: "â–¦",': 'icon: "\\\\u25A6",',
    'icon: "â–£",': 'icon: "\\\\u25A3",',
    'icon: "â– ",': 'icon: "\\\\u25A6",',
    'icon: "â–¡",': 'icon: "\\\\u25A3",',
    'icon="â–¦"': 'icon="▦"',
    'icon="â–£"': 'icon="▣"',
    'icon="â– "': 'icon="▦"',
    'icon="â–¡"': 'icon="▣"',
    'â–¦': '▦',
    'â–£': '▣',
    'â– ': '▦',
    'â–¡': '▣',
}

for old, new in replacements.items():
    text = text.replace(old, new)

path.write_text(text, encoding="utf-8")
print("admin/settings icons cleaned")
