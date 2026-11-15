#!/usr/bin/env python3
"""CrewPulse scenario simulator - Python standard library only.

Writes src/data/scenario.json with:
  * 14 pre-flight days per crew member (the app derives each personal baseline from them)
  * a 14-day in-mission window (1-14 Nov 2026) for a crew of four

EVERYTHING HERE IS SIMULATED. No real astronaut data is used.

Run:  python scripts/simulate.py
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import random

SEED = 20261114
START = dt.date(2026, 11, 1)
DAYS = 14
PREFLIGHT_DAYS = 14
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "scenario.json"

# indicator: (day-to-day sd, decimals, min, max)
SPEC = {
    "hr": (2.2, 0, 38, 130),
    "hrv": (5.0, 0, 15, 150),
    "spo2": (0.5, 0, 85, 100),
    "skinTemp": (0.12, 2, -2.0, 2.0),
    "respRate": (0.6, 1, 8, 30),
    "sbp": (4.0, 0, 80, 190),
    "dbp": (3.0, 0, 45, 120),
    "sleepH": (0.4, 1, 2.0, 10.0),
    "sleepQuality": (0.8, 0, 0, 10),
    "fatigue": (0.8, 0, 0, 10),
    "pvtRt": (9.0, 0, 150, 700),
    "pvtLapses": (1.0, 0, 0, 60),
    "stress": (0.8, 0, 0, 10),
    "mood": (0.7, 0, 0, 10),
}
# measured automatically by the ring; everything else needs the crew member
RING = ("hr", "hrv", "spo2", "skinTemp", "respRate", "sleepH")

CREW = [
    {"id": "A01", "title": "Flight Engineer", "isCMO": False, "body": "male", "priorCareerDose_mSv": 86,
     "mean": {"hr": 58, "hrv": 62, "spo2": 97.4, "skinTemp": 0.0, "respRate": 14.0, "sbp": 118, "dbp": 76,
              "sleepH": 7.6, "sleepQuality": 8, "fatigue": 3, "pvtRt": 232, "pvtLapses": 2, "stress": 3, "mood": 8}},
    {"id": "A02", "title": "Mission Specialist", "isCMO": False, "body": "female", "priorCareerDose_mSv": 0,
     "mean": {"hr": 54, "hrv": 75, "spo2": 97.8, "skinTemp": 0.0, "respRate": 13.0, "sbp": 112, "dbp": 70,
              "sleepH": 7.2, "sleepQuality": 7, "fatigue": 3, "pvtRt": 245, "pvtLapses": 3, "stress": 2, "mood": 8}},
    {"id": "A03", "title": "Pilot", "isCMO": False, "body": "male", "priorCareerDose_mSv": 77,
     "mean": {"hr": 63, "hrv": 55, "spo2": 97.2, "skinTemp": 0.0, "respRate": 15.0, "sbp": 124, "dbp": 80,
              "sleepH": 6.9, "sleepQuality": 7, "fatigue": 4, "pvtRt": 251, "pvtLapses": 3, "stress": 4, "mood": 7}},
    {"id": "A04", "title": "Commander / Crew Medical Officer", "isCMO": True, "body": "female", "priorCareerDose_mSv": 86,
     "mean": {"hr": 60, "hrv": 58, "spo2": 97.3, "skinTemp": 0.0, "respRate": 14.0, "sbp": 121, "dbp": 78,
              "sleepH": 7.4, "sleepQuality": 8, "fatigue": 3, "pvtRt": 238, "pvtLapses": 2, "stress": 3, "mood": 7}},
]

# A01's story: sleep debt builds from day 6, cabin CO2 rises on days 10-11,
# a headache appears on day 11, a solar particle event hits on day 12,
# and A01 recovers on days 13-14 after acting on the advice.
STORY_A01 = {
    #                d1 d2 d3 d4 d5  d6    d7    d8    d9    d10   d11   d12   d13   d14
    "sleepH":       [0, 0, 0, 0, 0, -0.6, -1.0, -1.3, -1.6, -1.9, -2.3, -2.2, -1.0, -0.4],
    "sleepQuality": [0, 0, 0, 0, 0, -1, -2, -2, -3, -4, -4, -4, -2, -1],
    "fatigue":      [0, 0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 4, 2, 1],
    "pvtRt":        [0, 0, 0, 0, 0, 5, 12, 20, 28, 38, 50, 48, 22, 8],
    "pvtLapses":    [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 5, 2, 1],
    "hrv":          [0, 0, 0, 0, 0, 0, -3, -6, -9, -12, -14, -14, -8, -3],
    "hr":           [0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 6, 7, 3, 1],
    "stress":       [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 2, 1],
    "mood":         [0, 0, 0, 0, 0, 0, 0, -1, -2, -3, -4, -4, -2, -1],
}
# A02's story: physically fine all along, but stress rises and mood falls from day 8
# (isolation, a family problem at home). Private by default: the CMO sees nothing
# until day 13, when six strained days in a row turn the alert urgent and the CMO
# gets only "contact A02 today". After a conference with the ground psychologist,
# the day-14 ratings are back near A02's normal.
STORY_A02 = {
    #           d1 d2 d3 d4 d5 d6 d7 d8  d9  d10 d11 d12 d13 d14
    "stress":  [0, 0, 0, 0, 0, 0, 1, 3, 3, 3, 4, 4, 5, 1],
    "mood":    [0, 0, 0, 0, 0, 0, -1, -3, -3, -3, -4, -4, -5, -2],
}
STORIES = {"A01": STORY_A01, "A02": STORY_A02}

SYMPTOMS_A01 = {
    10: [{"id": "nausea", "intensity": 2, "onset": "new", "trend": "same"}],
    11: [{"id": "headache", "intensity": 4, "onset": "new", "trend": "same"},
         {"id": "nausea", "intensity": 1, "onset": "ongoing", "trend": "better"}],
    12: [{"id": "headache", "intensity": 3, "onset": "ongoing", "trend": "better"}],
}
MEDS_A01 = {12: ["analgesic"]}

# Cabin CO2 partial pressure (mmHg): a degraded scrubber on days 10-11, repaired on day 12.
CO2_AVG_24H = [2.0, 1.9, 2.1, 2.0, 2.2, 2.3, 2.3, 2.4, 2.5, 3.1, 3.4, 2.7, 2.1, 1.9]
CO2_MAX_1H = [2.3, 2.2, 2.4, 2.3, 2.5, 2.6, 2.6, 2.7, 2.9, 3.6, 3.9, 3.0, 2.4, 2.2]
# EVAs: two completed, one planned for the day the solar particle event arrives.
EVA = {3: ["A01", "A02"], 6: ["A01", "A02"], 12: ["A01", "A02"]}
SEP_DAY = 12


def sample(rng: random.Random, mean: float, key: str, scale: float = 1.0):
    sd, dec, lo, hi = SPEC[key]
    v = min(hi, max(lo, rng.gauss(mean, sd * scale)))
    return int(round(v)) if dec == 0 else round(v, dec)


def main() -> None:
    rng = random.Random(SEED)
    preflight, records = {}, {}

    for member in CREW:
        cid, mean = member["id"], member["mean"]
        preflight[cid] = [{k: sample(rng, mean[k], k) for k in SPEC} for _ in range(PREFLIGHT_DAYS)]

        rows = []
        for d in range(1, DAYS + 1):
            values = {}
            for k in SPEC:
                offset = STORIES.get(cid, {}).get(k, [0] * DAYS)[d - 1]
                # story-driven values get little noise so the narrative stays readable
                values[k] = sample(rng, mean[k] + offset, k, 0.3 if offset else 0.8)
            row = {"day": d, "complete": True, "values": values, "symptoms": [], "meds": []}
            if cid == "A01":
                row["symptoms"] = SYMPTOMS_A01.get(d, [])
                row["meds"] = MEDS_A01.get(d, [])
            if cid == "A03" and d == 11:
                # ring data synced overnight, but the crew member has not done the check-in yet
                row["complete"] = False
                row["values"] = {k: v for k, v in values.items() if k in RING}
            rows.append(row)
        records[cid] = rows

    days = []
    for d in range(1, DAYS + 1):
        days.append({
            "day": d,
            "date": (START + dt.timedelta(days=d - 1)).isoformat(),
            "co2Avg24h": CO2_AVG_24H[d - 1],
            "co2Max1h": CO2_MAX_1H[d - 1],
            "sep": d == SEP_DAY,
            "eva": {"crew": EVA[d], "hours": 6.5} if d in EVA else None,
        })

    scenario = {
        "meta": {
            "name": "CrewPulse demo scenario",
            "simulated": True,
            "note": "All crew data are simulated. No real astronaut data.",
            "seed": SEED,
            "startDate": START.isoformat(),
            "days": DAYS,
            "preflightDays": PREFLIGHT_DAYS,
            "generator": "scripts/simulate.py",
        },
        "crew": [{k: v for k, v in m.items() if k != "mean"} for m in CREW],
        "preflight": preflight,
        "days": days,
        "records": records,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(scenario, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
