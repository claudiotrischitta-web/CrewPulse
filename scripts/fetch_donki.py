#!/usr/bin/env python3
"""Fetch the May 2024 solar energetic particle (SEP) events and CMEs from NASA DONKI.

Writes src/data/donki_may2024.json. The demo scenario replays the 20 May 2024 event,
the largest radiation surge measured on the Mars surface by MSL/RAD (NASA/JPL PIA26302).

Set NASA_API_KEY (free at https://api.nasa.gov); DEMO_KEY works but is rate-limited per IP.
DONKI accepts at most 60 days per request.

Python standard library only.
Run:  python scripts/fetch_donki.py
"""
from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import urllib.parse
import urllib.request

API = "https://api.nasa.gov/DONKI"
START, END = "2024-05-05", "2024-06-03"
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "donki_may2024.json"


def fetch(kind: str, key: str):
    query = urllib.parse.urlencode({"startDate": START, "endDate": END, "api_key": key})
    with urllib.request.urlopen(f"{API}/{kind}?{query}", timeout=60) as r:
        return json.loads(r.read().decode("utf-8") or "[]")


def main() -> None:
    key = os.environ.get("NASA_API_KEY", "DEMO_KEY")
    sep = [{"sepID": e.get("sepID"), "eventTime": e.get("eventTime"),
            "instruments": [i.get("displayName") for i in e.get("instruments") or []],
            "link": e.get("link")} for e in fetch("SEP", key)]
    cme = [{"activityID": e.get("activityID"), "startTime": e.get("startTime"),
            "sourceLocation": e.get("sourceLocation"), "link": e.get("link")}
           for e in fetch("CME", key) if (e.get("startTime") or "").startswith("2024-05-20")]
    data = {
        "source": "NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information), https://api.nasa.gov",
        "fetched": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "window": [START, END],
        "sep": sep,
        "cme_2024_05_20": cme,
    }
    OUT.write_text(json.dumps(data, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT}: {len(sep)} SEP events, {len(cme)} CMEs on 2024-05-20")


if __name__ == "__main__":
    main()
