# References

Everything CrewPulse uses: data, standards, papers, software. Kept up to date while we build.

## NASA and space agency data and resources

| # | Source | What we use it for |
|---|---|---|
| 1 | NASA Human Research Program, **Risks of Human Spaceflight** — https://www.nasa.gov/hrp/risks/ | Which risks to monitor and the plain-language "why it matters" texts (sleep, behavioural health, SANS, cardiovascular adaptation) |
| 2 | NASA Human Research Program, **5 Hazards of Human Spaceflight** — https://www.nasa.gov/hrp/hazards/ | Framing: radiation, isolation and confinement, distance from Earth, gravity, hostile closed environment |
| 3 | NASA OCHMO, **OCHMO-TB-004 Rev D, Carbon Dioxide (CO₂)**, 2026 — https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf | CO₂ limit of 3 mmHg (1-hour average) [V2 6004]; 7-day average below 2.5 mmHg for headache risk < 1 %; headache and vision changes as the most common in-flight symptoms; alerting requirements [V2 6021, V2 6022] |
| 4 | NASA OCHMO, **OCHMO-TB-020 Rev E, Design for Ionizing Radiation Protection**, 2022 — https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf | Career limit 600 mSv [V1 4030]; solar particle event limit 250 mSv [V1 4031]; ISS and lunar-surface mission doses; storm shelter and EVA-termination guidance; alerting and dose monitoring [V2 6100, V2 6101] |
| 5 | **NASA-STD-3001**, NASA Spaceflight Human-System Standard, Vol. 1 and 2 — https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/ | Requirement ids quoted in the app, including [V1 3003] in-mission monitoring of physiological and psychosocial well-being |
| 6 | **NASA/JPL Horizons API** — https://ssd.jpl.nasa.gov/api/horizons.api | One-way light-time Earth–Moon and Earth–Mars for 1–14 Nov 2026 (`scripts/fetch_horizons.py` → `src/data/lighttime.json`): the real communication delay |
| 7 | **NASA DONKI** (Space Weather Database Of Notifications, Knowledge, Information) — https://api.nasa.gov | Identification of the 20 May 2024 solar event replayed on scenario day 12: activity `2024-05-20T05:36:00-CME-001` (`scripts/fetch_donki.py` → `src/data/donki_may2024.json`). DONKI has no near-Earth SEP entry for it, because the eruption pointed away from Earth; the particle surge was measured at Mars (see 8) |
| 8 | NASA/JPL Photojournal **PIA26302**, Curiosity's RAD observes the 20 May 2024 solar storm — https://photojournal.jpl.nasa.gov/catalog/PIA26302 | About 8.1 mGy measured on the Mars surface during the event |
| 9 | Canadian Space Agency, **Monitoring radiation for astronaut health**, 2026 — https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp | Background on personal radiation monitoring (challenge partner resource) |

## Scientific papers

| # | Source | What we use it for |
|---|---|---|
| 10 | Hassler D.M. et al. (2014). Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover. *Science* 343. doi:10.1126/science.1244797 | Mars surface dose rate, 0.67 mSv/day |
| 11 | Zeitlin C. et al. (2013). Measurements of Energetic Particle Radiation in Transit to Mars on the Mars Science Laboratory. *Science* 340. doi:10.1126/science.1235989 | Cruise dose rate, 1.8 mSv/day |
| 12 | Basner M., Mollicone D., Dinges D.F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronautica* 69. https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786/ | 3-minute reaction test, 1–4 s inter-stimulus interval, lapse threshold 355 ms |
| 13 | Law J. et al. (2014). Relationship between carbon dioxide levels and reported headaches on the International Space Station. *J Occup Environ Med* 56(5). | Link between cabin CO₂ and headaches |

## Software (all open source)

| Library | Licence | Use |
|---|---|---|
| React, React DOM | MIT | User interface |
| Vite, @vitejs/plugin-react | MIT | Build tool |
| TypeScript | Apache-2.0 | Language |
| Tailwind CSS, @tailwindcss/vite | MIT | Styling |
| Recharts | MIT | Charts |
| lucide-react | ISC | Icons |
| Vitest | MIT | Tests |
| Python standard library | PSF | Scenario simulator and data scripts |

## Data honesty

- All crew data are **simulated** by `scripts/simulate.py`. No real astronaut data are used.
- Dose values for the Moon and the ISS during the replayed solar event are **illustrative scalings**, not measurements; only the Mars value is measured (MSL/RAD).
- Dose equivalent is treated as effective dose, and a quality factor of 1 is assumed for the solar event: stated approximations.
- Vital signs are judged against each crew member's own pre-flight baseline. The prototype uses no absolute clinical thresholds for heart rate, blood pressure or SpO₂.

## Images and media

No third-party images, audio or video are included in the app. The body map (male and female figures, front and back, in the muscle-map style) is an original SVG drawing made for this project, generated from control points by `scripts/body_shapes.py`; icons come from lucide-react (ISC licence).
