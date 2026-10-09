
from pathlib import Path
from shutil import copy2

SOURCE = Path("src")
BACKUP = Path(".theme-backup/blue-theme")
GLOBALS = Path("src/app/globals.css")

# Najpierw sprawdzamy, czy globals.css ma nowy motyw.
css = GLOBALS.read_text(encoding="utf-8")

required = [
    "--color-club-bg:",
    "--color-club-surface:",
    "--color-club-elevated:",
    "--color-club-primary:",
    "--color-club-primary-hover:",
    "--color-club-accent:",
    "--color-club-on-primary:",
    "--color-club-success:",
]

missing = [name for name in required if name not in css]

if missing:
    raise SystemExit(
        "Brak nowych kolorów w globals.css:\n"
        + "\n".join(missing)
    )

# Kolejność jest istotna:
# najpierw szczególne przypadki, potem ogólne zamiany.
replacements = [
    # Status opłacenia ma pozostać zielony.
    (
        'paid ? "text-[#a3e635]"',
        'paid ? "text-club-success"',
    ),
    (
        "accent-[#a3e635] disabled:cursor-wait",
        "accent-club-success disabled:cursor-wait",
    ),

    # Granatowe tła.
    ("bg-[#09110e]", "bg-club-bg"),
    ("bg-[#112017]", "bg-club-surface"),
    ("bg-[#0b1710]", "bg-club-elevated"),
    ("bg-[#122319]", "bg-club-elevated"),
    ("bg-[#14251a]", "bg-club-surface"),

    # Niebieskie przyciski i akcenty.
    ("bg-[#a3e635]/", "bg-club-accent/"),
    ("bg-[#a3e635]", "bg-club-primary"),
    ("bg-[#bef264]", "bg-club-primary-hover"),

    # Tekst, również na przyciskach.
    ("text-[#09110e]", "text-club-on-primary"),
    ("text-[#a3e635]", "text-club-accent"),

    # Obramowania i interakcje.
    ("border-[#a3e635]", "border-club-accent"),
    ("ring-[#a3e635]", "ring-club-accent"),
    ("accent-[#a3e635]", "accent-club-accent"),
]

changes = []

# Tylko aktywne komponenty TSX.
# Pliki *.tsx.bak zostaną automatycznie pominięte.
for path in sorted(SOURCE.rglob("*.tsx")):
    original = path.read_text(encoding="utf-8")
    updated = original
    replacements_count = 0

    for old, new in replacements:
        count = updated.count(old)

        if count:
            updated = updated.replace(old, new)
            replacements_count += count

    if updated != original:
        changes.append(
            (path, original, updated, replacements_count)
        )

if not changes:
    print("Nie znaleziono kolorów do zmiany.")
elif BACKUP.exists():
    raise SystemExit(
        "Kopia zapasowa już istnieje: "
        + str(BACKUP)
        + "\nNie nadpisuję jej."
    )
else:
    # Zapisujemy kopie PRZED zmianą plików.
    for path, original, updated, count in changes:
        backup_path = BACKUP / path
        backup_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )
        copy2(path, backup_path)

    # Teraz zapisujemy nowy motyw.
    for path, original, updated, count in changes:
        path.write_text(updated, encoding="utf-8")
        print(f"OK: {path} ({count} zmian)")

    print()
    print(
        f"Zmieniono {len(changes)} plików, "
        f"{sum(item[3] for item in changes)} wystąpień kolorów."
    )
    print(f"Kopie zapasowe: {BACKUP}")
    print("Gotowe! Motyw niebieski jest zastosowany.")
