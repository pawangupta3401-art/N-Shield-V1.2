import type {
  ApiMeta,
  BlindSpot,
  CCTVCamera,
  CrimeType,
  Incident,
  IncidentStatus,
  PolicePatrolUnit,
  Severity,
  Zone,
} from "./types";

/** Seeded PRNG for reproducible mock datasets across server restarts. */
function createRng(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20260817);

function pick<T>(items: T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function randomInRange(min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function randomCoord(centerLat: number, centerLng: number, spread = 0.035) {
  return {
    lat: centerLat + randomInRange(-spread, spread),
    lng: centerLng + randomInRange(-spread, spread),
  };
}

export function getMockMeta(total: number): ApiMeta {
  return {
    total,
    generatedAt: new Date().toISOString(),
    source: "mock",
  };
}

export const zones: Zone[] = [
  {
    id: "zone-sitabuldi",
    name: "Sitabuldi",
    code: "NGP-SIT",
    lat: 21.1489,
    lng: 79.0876,
    radiusKm: 3.4,
    officerInCharge: "DCP Pravin Padole",
    activePatrols: 8,
    populationEstimate: 96000,
  },
  {
    id: "zone-pardi",
    name: "Pardi / Bhandara Corridor",
    code: "NGP-PAR",
    lat: 21.1186,
    lng: 79.0954,
    radiusKm: 4.2,
    officerInCharge: "ACP Rajesh Wankhede",
    activePatrols: 6,
    populationEstimate: 142000,
  },
  {
    id: "zone-hudkeshwar",
    name: "Hudkeshwar / Manewada",
    code: "NGP-HUD",
    lat: 21.0982,
    lng: 79.0741,
    radiusKm: 5.1,
    officerInCharge: "ACP Smita Deshmukh",
    activePatrols: 5,
    populationEstimate: 178000,
  },
  {
    id: "zone-sadar",
    name: "Sadar",
    code: "NGP-SAD",
    lat: 21.1612,
    lng: 79.0788,
    radiusKm: 4.8,
    officerInCharge: "ACP Vikram Jadhav",
    activePatrols: 7,
    populationEstimate: 134000,
  },
  {
    id: "zone-dhantoli",
    name: "Dhantoli / Ramdaspeth",
    code: "NGP-DHA",
    lat: 21.1384,
    lng: 79.0623,
    radiusKm: 3.9,
    officerInCharge: "ACP Anjali Kulkarni",
    activePatrols: 6,
    populationEstimate: 118000,
  },
  {
    id: "zone-dharampeth",
    name: "Dharampeth",
    code: "NGP-DHP",
    lat: 21.1415,
    lng: 79.0535,
    radiusKm: 3.2,
    officerInCharge: "PI Sunil Patil",
    activePatrols: 6,
    populationEstimate: 92000,
  },
  {
    id: "zone-mahal",
    name: "Mahal / Gandhibagh",
    code: "NGP-MHL",
    lat: 21.144,
    lng: 79.111,
    radiusKm: 3.6,
    officerInCharge: "ACP Nitin Bagade",
    activePatrols: 5,
    populationEstimate: 165000,
  },
  {
    id: "zone-itpark",
    name: "IT Park (Gayatri Nagar)",
    code: "NGP-ITP",
    lat: 21.1235,
    lng: 79.052,
    radiusKm: 3.0,
    officerInCharge: "PI Maya Shinde",
    activePatrols: 5,
    populationEstimate: 78000,
  },
  {
    id: "zone-mankapur",
    name: "Mankapur / Koradi Road",
    code: "NGP-MNK",
    lat: 21.189,
    lng: 79.076,
    radiusKm: 4.5,
    officerInCharge: "ACP Ajay Rathod",
    activePatrols: 4,
    populationEstimate: 125000,
  },
  {
    id: "zone-medical",
    name: "Medical Square / Ajni",
    code: "NGP-MED",
    lat: 21.127,
    lng: 79.096,
    radiusKm: 3.8,
    officerInCharge: "PI Suresh Meshram",
    activePatrols: 6,
    populationEstimate: 110000,
  },
];

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];
const CRIME_TYPES: CrimeType[] = [
  "Theft",
  "Robbery",
  "Assault",
  "Vehicle Theft",
  "Burglary",
  "Murder",
  "Chain-snatching",
  "Accident",
  "Cybercrime",
  "Harassment",
  "Other",
];

const INCIDENT_STATUSES: IncidentStatus[] = ["open", "investigating", "resolved"];

const INCIDENT_DESCRIPTIONS: Record<CrimeType, string[]> = {
  Theft: [
    "Mobile snatching outside Metro station",
    "Pickpocketing in crowded bazaar corridor",
    "Luggage theft reported at bus concourse",
    "Shoplifting reported at retail shopping lane",
  ],
  Robbery: [
    "Armed robbery at cash deposit outlet",
    "Cash and jewellery taken under threat of weapon",
    "Night-time robbery on bypass road",
    "Break-in robbery at commercial premise",
  ],
  Assault: [
    "Physical brawl reported outside late-night restaurant",
    "Assault incident during parking altercation",
    "Group clash reported near public square",
    "Physical confrontation at market corner",
  ],
  "Vehicle Theft": [
    "Two-wheeler stolen from station parking lot",
    "Four-wheeler vehicle stolen overnight from residential street",
    "Motorcycle theft reported outside hospital gate",
    "Commercial delivery vehicle stolen from loading dock",
  ],
  Burglary: [
    "House burglary in locked apartment during holiday",
    "Shop shutter broken open overnight in main bazaar",
    "Office break-in and electronics stolen",
    "Warehouse security breached and equipment taken",
  ],
  Murder: [
    "Homicide investigation launched near isolated plot",
    "Fatal altercation reported following personal dispute",
    "Victim found with fatal injuries in suburban lane",
  ],
  "Chain-snatching": [
    "Two-wheeler riders grabbed gold chain from pedestrian",
    "Chain-snatching reported on morning walk lane",
    "Snatching incident outside temple entrance",
  ],
  Accident: [
    "Multi-vehicle crash on Wardha Road flyover",
    "Speeding collision at Ring Road junction",
    "Pedestrian hit-and-run incident",
  ],
  Cybercrime: [
    "Online financial phishing fraud reported",
    "Unauthorized banking transaction complaint",
  ],
  Harassment: [
    "Eve-teasing complaint lodged near college avenue",
    "Public nuisance and harassment reported at bus stop",
  ],
  Smuggling: [
    "Contraband goods intercepted near rail freight sidings",
    "Unlicensed consignment seized at checkpoint",
  ],
  Other: [
    "Public property vandalism reported",
    "Noise violation and public dispute reported",
  ],
};

function severityForType(type: CrimeType): Severity {
  if (type === "Murder" || type === "Robbery") return pick(["high", "critical"]);
  if (type === "Assault" || type === "Burglary" || type === "Vehicle Theft")
    return pick(["medium", "high", "critical"]);
  return pick(["low", "medium", "high"]);
}

function generateIncidents(): Incident[] {
  const incidents: Incident[] = [];
  const now = new Date();

  for (let i = 0; i < 120; i++) {
    const zone = pick(zones);
    const type = pick(CRIME_TYPES);
    const severity = severityForType(type);
    const { lat, lng } = randomCoord(zone.lat, zone.lng, zone.radiusKm * 0.007);

    const ageDays = i < 15 ? randomInRange(0, 1) : i < 45 ? randomInRange(1, 7) : i < 85 ? randomInRange(7, 30) : randomInRange(30, 180);
    const incidentDate = new Date(now.getTime() - ageDays * 24 * 60 * 60 * 1000);
    incidentDate.setHours(randomInt(0, 23), randomInt(0, 59));

    const descriptions = INCIDENT_DESCRIPTIONS[type] || ["Incident reported to police dispatch"];
    const description = pick(descriptions);

    incidents.push({
      id: `INC-${String(i + 1).padStart(4, "0")}`,
      type,
      lat,
      lng,
      timestamp: incidentDate.toISOString(),
      severity,
      zoneId: zone.id,
      description: `${description} (${zone.name})`,
      status: pick(INCIDENT_STATUSES),
    });
  }

  return incidents;
}

export const incidents: Incident[] = generateIncidents();

export const cameras: CCTVCamera[] = [
  // Sitabuldi
  { id: "cam-sit-01", name: "Sitabuldi Interchange PTZ-01", lat: 21.1465, lng: 79.0835, isOperational: true, zoneId: "zone-sitabuldi", installDate: "2024-01-10", lastMaintenance: "2026-06-15", coverageRadiusM: 150 },
  { id: "cam-sit-02", name: "Munje Square North 4K-02", lat: 21.148, lng: 79.086, isOperational: true, zoneId: "zone-sitabuldi", installDate: "2024-03-22", lastMaintenance: "2026-07-01", coverageRadiusM: 120 },
  { id: "cam-sit-03", name: "Variety Square East Pole", lat: 21.15, lng: 79.082, isOperational: false, zoneId: "zone-sitabuldi", installDate: "2023-11-05", lastMaintenance: null, coverageRadiusM: 100 },

  // Pardi (Low CCTV)
  { id: "cam-par-01", name: "Pardi Flyover Toll Gate-01", lat: 21.119, lng: 79.096, isOperational: true, zoneId: "zone-pardi", installDate: "2023-08-12", lastMaintenance: "2026-04-10", coverageRadiusM: 140 },
  { id: "cam-par-02", name: "Bhandara Road Freight Post", lat: 21.115, lng: 79.091, isOperational: false, zoneId: "zone-pardi", installDate: "2023-09-18", lastMaintenance: null, coverageRadiusM: 80 },

  // Sadar
  { id: "cam-sad-01", name: "Sadar Mount Road Junction", lat: 21.163, lng: 79.081, isOperational: true, zoneId: "zone-sadar", installDate: "2024-02-14", lastMaintenance: "2026-07-20", coverageRadiusM: 160 },
  { id: "cam-sad-02", name: "Residency Road Market PTZ", lat: 21.165, lng: 79.084, isOperational: true, zoneId: "zone-sadar", installDate: "2024-05-11", lastMaintenance: "2026-06-25", coverageRadiusM: 130 },

  // Dharampeth
  { id: "cam-dhp-01", name: "WHC Road Zenda Chowk 4K", lat: 21.142, lng: 79.055, isOperational: true, zoneId: "zone-dharampeth", installDate: "2024-04-19", lastMaintenance: "2026-08-01", coverageRadiusM: 180 },
  { id: "cam-dhp-02", name: "Gokulpeth Market Square", lat: 21.144, lng: 79.051, isOperational: true, zoneId: "zone-dharampeth", installDate: "2024-04-20", lastMaintenance: "2026-08-01", coverageRadiusM: 150 },

  // Mahal (Low CCTV)
  { id: "cam-mhl-01", name: "Mahal Town Hall Square", lat: 21.145, lng: 79.112, isOperational: true, zoneId: "zone-mahal", installDate: "2023-05-10", lastMaintenance: "2026-03-12", coverageRadiusM: 100 },
  { id: "cam-mhl-02", name: "Gandhi Gate Alley North", lat: 21.148, lng: 79.108, isOperational: false, zoneId: "zone-mahal", installDate: "2023-06-15", lastMaintenance: null, coverageRadiusM: 70 },

  // IT Park
  { id: "cam-itp-01", name: "IT Park Main Gate Smart Dome", lat: 21.124, lng: 79.053, isOperational: true, zoneId: "zone-itpark", installDate: "2025-01-10", lastMaintenance: "2026-08-10", coverageRadiusM: 200 },
  { id: "cam-itp-02", name: "VNIT Perimeter Boulevard", lat: 21.127, lng: 79.056, isOperational: true, zoneId: "zone-itpark", installDate: "2025-01-15", lastMaintenance: "2026-08-10", coverageRadiusM: 180 },

  // Hudkeshwar
  { id: "cam-hud-01", name: "Hudkeshwar Ring Road Post", lat: 21.099, lng: 79.075, isOperational: false, zoneId: "zone-hudkeshwar", installDate: "2023-10-01", lastMaintenance: null, coverageRadiusM: 90 },

  // Medical Square
  { id: "cam-med-01", name: "GMC Hospital Gate-1 4K", lat: 21.128, lng: 79.097, isOperational: true, zoneId: "zone-medical", installDate: "2024-06-05", lastMaintenance: "2026-07-30", coverageRadiusM: 170 },

  // Mankapur
  { id: "cam-mnk-01", name: "Mankapur Stadium Chowk", lat: 21.191, lng: 79.077, isOperational: true, zoneId: "zone-mankapur", installDate: "2024-07-15", lastMaintenance: "2026-05-18", coverageRadiusM: 140 },
];

export const cctvCameras = cameras;

export const blindSpots: BlindSpot[] = [
  { id: "bs-01", lat: 21.116, lng: 79.093, riskScore: 88, zoneId: "zone-pardi", reason: "Industrial warehouse corridor with zero CCTV & unlit alleys" },
  { id: "bs-02", lat: 21.149, lng: 79.114, riskScore: 84, zoneId: "zone-mahal", reason: "Dense antique market alleyway — cameras offline + low sightline" },
  { id: "bs-03", lat: 21.095, lng: 79.072, riskScore: 78, zoneId: "zone-hudkeshwar", reason: "Suburban ring road stretch with missing pole infrastructure" },
  { id: "bs-04", lat: 21.147, lng: 79.081, riskScore: 72, zoneId: "zone-sitabuldi", reason: "Variety Square back-lane network offline camera coverage" },
  { id: "bs-05", lat: 21.187, lng: 79.073, riskScore: 68, zoneId: "zone-mankapur", reason: "Railway underpass junction with poor illumination" },
];

export const policePatrolUnits: PolicePatrolUnit[] = [
  { id: "patrol-01", unitCode: "PCR-101", zoneId: "zone-sitabuldi", lat: 21.1475, lng: 79.085, status: "patrolling", officerCount: 3, vehicleType: "PCR Van", lastPing: "1 min ago" },
  { id: "patrol-02", unitCode: "QRB-204", zoneId: "zone-sitabuldi", lat: 21.151, lng: 79.089, status: "responding", officerCount: 2, vehicleType: "Quick Response Bike", lastPing: "Just now" },
  { id: "patrol-03", unitCode: "PCR-105", zoneId: "zone-pardi", lat: 21.117, lng: 79.094, status: "patrolling", officerCount: 3, vehicleType: "PCR Van", lastPing: "2 mins ago" },
  { id: "patrol-04", unitCode: "PCR-108", zoneId: "zone-sadar", lat: 21.162, lng: 79.08, status: "patrolling", officerCount: 3, vehicleType: "PCR Van", lastPing: "1 min ago" },
  { id: "patrol-05", unitCode: "QRB-212", zoneId: "zone-dharampeth", lat: 21.143, lng: 79.054, status: "standby", officerCount: 2, vehicleType: "Quick Response Bike", lastPing: "3 mins ago" },
  { id: "patrol-06", unitCode: "PCR-114", zoneId: "zone-mahal", lat: 21.146, lng: 79.109, status: "patrolling", officerCount: 3, vehicleType: "PCR Van", lastPing: "Just now" },
  { id: "patrol-07", unitCode: "PCR-119", zoneId: "zone-itpark", lat: 21.125, lng: 79.054, status: "patrolling", officerCount: 3, vehicleType: "Interceptor", lastPing: "4 mins ago" },
  { id: "patrol-08", unitCode: "QRB-220", zoneId: "zone-medical", lat: 21.129, lng: 79.095, status: "patrolling", officerCount: 2, vehicleType: "Quick Response Bike", lastPing: "1 min ago" },
];
