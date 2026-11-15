#!/usr/bin/env python3
"""Fetch the one-way light-time Earth -> Moon and Earth -> Mars from NASA/JPL Horizons.

Writes src/data/lighttime.json (seconds, one value per scenario day).
The app uses it as the real communication delay between the crew and the ground.

Python standard library only.
Run:  python scripts/fetch_horizons.py
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import urllib.parse
import urllib.request

API = "https://ssd.jpl.nasa.gov/api/horizons.api"
START, STOP = "2026-11-01", "2026-11-14"
BODIES = {"moon": "301", "mars": "499"}  # Horizons body ids, seen from the geocentre (500@399)
MONTHS = {m: i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], 1)}
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "lighttime.json"


def fetch(body: str) -> str:
    params = {
        "format": "text",
        "COMMAND": f"'{body}'",
        "CENTER": "'500@399'",
        "EPHEM_TYPE": "'OBSERVER'",
        "QUANTITIES": "'21'",  # one-way down-leg light-time, minutes
        "START_TIME": f"'{START}'",
        "STOP_TIME": f"'{STOP}'",
        "STEP_SIZE": "'1d'",
    }
    with urllib.request.urlopen(API + "?" + urllib.parse.urlencode(params), timeout=30) as r:
        return r.read().decode("utf-8")


def parse(text: str) -> dict[str, float]:
    """Rows between $$SOE and $$EOE look like: ' 2026-Nov-14 00:00       11.01438304'."""
    out, inside = {}, False
    for line in text.splitlines():
        if line.startswith("$$SOE"):
            inside = True
        elif line.startswith("$$EOE"):
            break
        elif inside and line.strip():
            parts = line.split()
            year, mon, day = parts[0].split("-")
            out[f"{year}-{MONTHS[mon]:02d}-{int(day):02d}"] = round(float(parts[-1]) * 60, 2)
    if not out:
        raise SystemExit("Horizons returned no ephemeris rows:\n" + text[:800])
    return out


def main() -> None:
    data = {
        "source": "NASA/JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api), "
                  "observer quantity 21 (one-way light-time), geocentric, 00:00 UTC each day",
        "fetched": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "unit": "seconds",
    }
    for name, body in BODIES.items():
        data[name] = parse(fetch(body))
        print(name, {k: v for k, v in list(data[name].items())[-2:]})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
