# CrewPulse

**Daily health self-assessment for astronauts, built for the distance from Earth.**

Prototype for the NASA Space Apps Challenge 2026, challenge
[*Create Health Monitoring Software for Astronauts on Space Missions*](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

**Live demo: <https://claudiotrischitta-web.github.io/CrewPulse/>** (opens with a short guide for judges and a 30-second tour)

All crew data in this repository are **simulated**.

## What it does

Every morning the crew member spends a few minutes on a check-in: ring data, blood pressure, four 0–10 questions, a symptom questionnaire on a front-and-back body map (male or female figure), medication and a reaction test. CrewPulse compares each value with **that person's own pre-flight baseline** and answers four questions in plain language:

1. How am I today?
2. Why is this flagged, and on which data?
3. What can I do now?
4. When should I check again, and when should I call the medical officer or the ground?

### Three seats, one alert

The same data are shown to three roles, and a single policy function decides who sees what:

| | Astronaut (self) | Crew Medical Officer | Flight surgeon (ground medical team) |
|---|---|---|---|
| Vital signs, symptoms, medication | yes | yes | yes, delayed |
| Sleep, fatigue, reaction test | yes | yes | yes, delayed |
| Stress, mood, private conference | yes | **no**, unless shared | yes, delayed |
| Cabin CO₂, radiation | yes | yes | yes, delayed |
| Other crew members | no | yes | yes |

The medical officer is a crewmate, so psychological data are private by default. Far from Earth one exception keeps the crew safe: an urgent wellbeing alert reaches the medical officer as a bare "contact this crew member" flag, with no details.

### Explainable rules

| Alert | Fires when | Based on |
|---|---|---|
| Sleep debt | Sleep below baseline on 3 of the last 4 nights **and** fatigue ≥ 7/10 or a degraded 3-minute reaction test; raised to a medical-officer assessment when an EVA is planned within 24 h | NASA HRP sleep risk; PVT-B (Basner 2011) |
| Headache × cabin CO₂ | A reported headache, crossed with the CO₂ record; raised when vision changes are reported (SANS screening) | NASA-STD-3001 [V2 6004], OCHMO-TB-004 |
| Cabin CO₂ advisory | 1-hour CO₂ above 3 mmHg, for the whole crew | NASA-STD-3001 [V2 6004] |
| Solar particle event | Event in progress: shelter, EVA postponed, career dose updated | NASA-STD-3001 [V1 4030, V1 4031], MSL/RAD, DONKI |
| Stress and mood | Stress up and mood down against baseline for 3 days, or acute distress | NASA HRP behavioural risk, [V1 3003] |
| Baseline drift | Any other value ≥ 2 SD from baseline on two consecutive days | Personal baseline |

A deviation must persist for two days before it is flagged, and each personal standard deviation has a floor: without both, normal day-to-day variation floods the crew with false alarms.

CrewPulse supports the crew's own judgement. It does not diagnose and it never decides fitness for duty.

### Three destinations

| | ISS | Moon | Mars |
|---|---|---|---|
| Signal delay, one way | near real time | ≈ 1.3 s | 11–12 min (1–14 Nov 2026) |
| Nominal dose | ≈ 0.45 mSv/day | ≈ 0.93 mSv/day | 0.67 mSv/day |
| Gravity | microgravity | 0.17 g | 0.38 g |

Messages between the vehicle and Earth travel with the real light-time for the selected date. The demo clock runs 60× faster, so an 11-minute delay takes 11 seconds on screen.

## How NASA data are used

- **NASA/JPL Horizons API**: one-way light-time to the Moon and Mars for each scenario day, fetched by `scripts/fetch_horizons.py`.
- **NASA-STD-3001 and OCHMO technical briefs**: the CO₂ limit, the headache threshold, the 600 mSv career limit, the 250 mSv solar-event limit, mission doses for the ISS and the lunar surface.
- **MSL/RAD (Curiosity)**: dose rates in cruise and on the Mars surface, and the 20 May 2024 solar event replayed on scenario day 12.
- **NASA DONKI**: identification of that event (`scripts/fetch_donki.py`).
- **NASA Human Research Program**: the risks behind every indicator and alert.

Every alert and panel shows its source on screen. The full list is in [REFERENCES.md](REFERENCES.md).

## The demo scenario

Fourteen days (1–14 November 2026), four crew members, preceded by fourteen pre-flight days that define each baseline.

- **A01**: sleep debt builds from day 6; cabin CO₂ rises on days 10–11 and a headache appears on day 11, the day before a planned EVA; recovery on days 13–14 after acting on the advice.
- **A02**: physically fine all along, but stress rises and mood falls from day 8. The alert stays private (A02 and the ground) while it is a monitor; on day 13, after six strained days, it turns urgent and the CMO receives only "contact A02 today", with no details. Back near normal on day 14.
- **A03**: check-in not done on day 11, ready for a live check-in.
- **A04**: the commander and Crew Medical Officer; within baseline throughout, the control that shows the rules stay quiet.
- **Day 12**: solar particle event for the whole crew.

The first visit opens a short guide for judges (the ⓘ button reopens it). The **30-s tour** button plays the story for the submission video.

## Run it

Requires Node.js 22.12 or newer. Python 3.10 or newer is needed only to regenerate the data.

```bash
npm install
npm run dev        # development server
npm test           # engine tests
npm run build      # type-check and production build in dist/
```

Regenerate the data:

```bash
python scripts/simulate.py          # scenario (fixed seed)
python scripts/fetch_horizons.py    # light-time from JPL Horizons
python scripts/fetch_donki.py       # May 2024 events from DONKI (set NASA_API_KEY)
```

## How it is built

```
scripts/          Python standard library only: simulator, Horizons and DONKI fetchers
src/data/         scenario.json, lighttime.json, indicators, environments, references
src/engine/       pure logic, no UI: baseline, status, rules, policy, dose, sync
src/components/   React components shared by the three roles
src/state/        app state (role, environment, day, live check-ins, messages)
tests/            Vitest tests of the engine
```

React, TypeScript, Vite, Tailwind CSS, Recharts. No backend: the app is static and works offline once loaded, which suits a system meant to work far from Earth.

## Limits of the prototype

- Crew data are simulated; the ring is not a real device.
- Privacy by role is applied in the interface. A flight system would enforce it on the server, with encryption per role.
- Vital signs are judged against the personal baseline only; no absolute clinical thresholds are used.
- Physiology does not change with the selected destination; only delay, dose and gravity label do.
- Dose values for the Moon and ISS during the solar event are illustrative, not measured.
- The 30-second reaction check is not validated and never triggers an alert.

## Team

Built in Rome for the NASA Space Apps Challenge 2026 by:

- Daniele Carlomusto
- Federico Fazi
- Tommaso Mearelli
- Claudio Trischitta

## Use of AI tools

<!-- Team: keep this section truthful and complete before submitting. -->
Claude (Anthropic), through Claude Code, was used to research the NASA sources, to draft the architecture and to write most of the first version of the code, tests and documentation. The team chose the concept, the roles and the privacy model, reviewed the output and is responsible for it. No AI-generated images, audio or video are included.

## Licence

[MIT](LICENSE)
