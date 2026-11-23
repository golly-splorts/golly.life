#!/usr/bin/env python3
"""Render the golly.life landing page from cups.json into output/.

    python3 build.py            dry run: list cups, report which output files would change
    python3 build.py --write    write the files
"""
import argparse
import json
import sys
from html import escape
from itertools import zip_longest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SITE = HERE / "site"
OUTPUT = HERE / "output"

# Static files copied verbatim: source under site/ -> path under output/
STATIC = {
    "home.css": "theme/css/home.css",
    "home.js": "theme/js/home.js",
}


def expand(series, numeral):
    return {
        k: v.replace("{N}", numeral.upper()).replace("{n}", numeral.lower())
        for k, v in series.items()
        if isinstance(v, str)
    }


def cup_card(cup, size):
    """size is 'feature' or 'chip'."""
    url = f"https://{cup['host']}"
    return (
        f'<a class="cup cup-{size}" href="{escape(url)}" style="--accent: {escape(cup["accent"])}">'
        f'<img class="cup-logo" src="{escape(cup["logo"])}" alt="" loading="lazy">'
        f'<span class="cup-text">'
        f'<span class="cup-name">{escape(cup["name"])}</span>'
        f'<span class="cup-host">{escape(cup["host"])}</span>'
        f"</span></a>"
    )


def render(data):
    editions = data["editions"]
    series = data["series"]
    latest, earlier = editions[-1], list(reversed(editions[:-1]))

    latest_html = "\n".join(cup_card(expand(s, latest), "feature") for s in series)

    # One column per series, newest first: numbered editions, then the unnumbered cups before them.
    columns = [
        [(n, expand(s, n)) for n in earlier] + [("", c) for c in reversed(s.get("before", []))]
        for s in series
    ]
    rows = []
    for row in zip_longest(*columns):
        numeral = next(n for n, _ in filter(None, row))
        chips = "".join(
            cup_card(cell[1], "chip") if cell else '<span class="cup-empty"></span>' for cell in row
        )
        rows.append(
            f'<li class="edition"><span class="edition-numeral">{escape(numeral.upper())}</span>'
            f'<div class="edition-cups">{chips}</div></li>'
        )
    earlier_html = "\n".join(rows)

    page = (SITE / "index.html").read_text()
    for key, val in {
        "{{LATEST_NUMERAL}}": escape(latest.upper()),
        "{{LATEST}}": latest_html,
        "{{EARLIER}}": earlier_html,
    }.items():
        page = page.replace(key, val)
    return page


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--write", action="store_true", help="write files (default is a dry run)")
    args = ap.parse_args()

    if not OUTPUT.is_dir():
        sys.exit(
            "output/ is missing. Clone the gh-pages branch into it first, from this directory:\n"
            "  git clone -b gh-pages --single-branch "
            "git@ch4zm.github.com:golly-splorts/golly.life.git output"
        )

    data = json.loads((HERE / "cups.json").read_text())
    print(f"latest edition: {data['editions'][-1].upper()}")
    print(f"editions: {', '.join(n.upper() for n in data['editions'])}")
    for s in data["series"]:
        print(f"before {s['name'].replace('{N} ', '')}: {', '.join(c['name'] for c in s.get('before', []))}")

    outputs = {OUTPUT / "index.html": render(data)}
    for src, dst in STATIC.items():
        outputs[OUTPUT / dst] = (SITE / src).read_text()

    for path, content in outputs.items():
        current = path.read_text() if path.exists() else None
        state = "unchanged" if current == content else ("changed" if current is not None else "new")
        print(f"{state:>9}  {path.relative_to(HERE)}")
        if args.write and state != "unchanged":
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)

    logos = {s["logo"] for s in data["series"]} | {c["logo"] for s in data["series"] for c in s.get("before", [])}
    for src in sorted(logos):
        if not (OUTPUT / src).exists():
            print(f"  missing logo: output/{src}")

    if not args.write:
        print("dry run; pass --write to write files")


if __name__ == "__main__":
    main()
