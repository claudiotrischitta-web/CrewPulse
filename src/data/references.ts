/** Every source the app relies on. Alerts and panels cite these by id; REFERENCES.md lists them in full. */
export interface Reference { short: string; url: string }

export const REFERENCES: Record<string, Reference> = {
  'std3001-co2': {
    short: 'NASA-STD-3001 Vol. 2 [V2 6004] · NASA OCHMO-TB-004 Rev D (2026)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-004-carbon-dioxide.pdf',
  },
  'std3001-rad': {
    short: 'NASA-STD-3001 Vol. 1 [V1 4030, V1 4031], Vol. 2 [V2 6100] · NASA OCHMO-TB-020 Rev E (2022)',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf',
  },
  'std3001-care': {
    short: 'NASA-STD-3001 Vol. 1 [V1 3003] In-Mission Preventive Health Care',
    url: 'https://www.nasa.gov/ochmo/human-spaceflight-and-aviation-standards/',
  },
  'hrp-sleep': {
    short: 'NASA Human Research Program — Risk of Inadequate Sleep and Irregular Schedules',
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  'hrp-behavior': {
    short: 'NASA Human Research Program — Risk of Behavioral Changes and Psychiatric Disorders',
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  'hrp-sans': {
    short: 'NASA Human Research Program — Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)',
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  'hrp-cardio': {
    short: 'NASA Human Research Program — Risk of Cardiovascular Adaptations',
    url: 'https://www.nasa.gov/hrp/risks/',
  },
  'hrp-hazards': {
    short: 'NASA Human Research Program — 5 Hazards of Human Spaceflight',
    url: 'https://www.nasa.gov/hrp/hazards/',
  },
  pvtb: {
    short: 'Basner, Mollicone & Dinges (2011), 3-minute PVT-B, Acta Astronautica 69',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786/',
  },
  law2014: {
    short: 'Law et al. (2014), CO₂ levels and reported headaches on the ISS, JOEM 56(5)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/24806559/',
  },
  'rad-msl': {
    short: 'MSL/RAD: Hassler et al. (2014) Science 343; Zeitlin et al. (2013) Science 340; NASA/JPL PIA26302',
    url: 'https://photojournal.jpl.nasa.gov/catalog/PIA26302',
  },
  horizons: {
    short: 'NASA/JPL Horizons API — one-way light-time',
    url: 'https://ssd.jpl.nasa.gov/api/horizons.api',
  },
  donki: {
    short: 'NASA DONKI — Space Weather Database Of Notifications, Knowledge, Information',
    url: 'https://api.nasa.gov',
  },
}
