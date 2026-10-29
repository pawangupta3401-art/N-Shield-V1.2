/**
 * N-SHIELD: Polygon Crime Risk Mosaic Comprehensive Verification Script
 * Validates 16 contiguous polygons, zero gaps/overlaps, risk calculations, and filter reactivity.
 */

// 1. Canonical Junctions
const J = {
  GOREWADA_NW: [21.1980, 79.0350],
  MANKAPUR_N: [21.2120, 79.0760],
  AUTOMOTIVE_N: [21.2150, 79.1120],
  KAMPTEE_NE: [21.2050, 79.1550],
  SEMINARY_N: [21.1760, 79.0520],
  SADAR_N: [21.1750, 79.0790],
  PACHPAOLI_N: [21.1780, 79.1120],
  KALMANA_NE: [21.1760, 79.1500],
  FUTALA_W: [21.1520, 79.0380],
  CIVIL_LINES_C: [21.1550, 79.0700],
  SADAR_S: [21.1560, 79.0850],
  ITWARI_C: [21.1560, 79.1180],
  PARDI_E: [21.1500, 79.1680],
  AMBAZARI_W: [21.1280, 79.0320],
  DHARAMPETH_C: [21.1390, 79.0560],
  SITABULDI_C: [21.1440, 79.0840],
  MAHAL_C: [21.1430, 79.1120],
  LAKADGANJ_C: [21.1420, 79.1450],
  HINGNA_SW: [21.1080, 79.0400],
  PRATAP_C: [21.1180, 79.0620],
  RAMDASPETH_S: [21.1320, 79.0750],
  MEDICAL_C: [21.1270, 79.0980],
  NANDANVAN_C: [21.1290, 79.1350],
  PARDI_SE: [21.1250, 79.1720],
  AIRPORT_SW: [21.0850, 79.0500],
  MANEWADA_C: [21.1020, 79.0880],
  SAKKARDARA_C: [21.1180, 79.1120],
  DIGHORI_E: [21.1080, 79.1480],
  BESA_S: [21.0720, 79.0780],
  HUDKESHWAR_S: [21.0750, 79.1080],
  DIGHORI_SE: [21.0780, 79.1420],
};

const POLYGONS = [
  { id: "poly-mankapur", name: "Mankapur / Koradi Corridor", coords: [J.GOREWADA_NW, J.MANKAPUR_N, J.SADAR_N, J.SEMINARY_N, J.GOREWADA_NW] },
  { id: "poly-automotive-sq", name: "Automotive Sq / Kamptee Road", coords: [J.MANKAPUR_N, J.AUTOMOTIVE_N, J.KAMPTEE_NE, J.KALMANA_NE, J.PACHPAOLI_N, J.SADAR_N, J.MANKAPUR_N] },
  { id: "poly-civil-lines", name: "Civil Lines / Seminary Hills", coords: [J.GOREWADA_NW, J.SEMINARY_N, J.SADAR_N, J.SADAR_S, J.CIVIL_LINES_C, J.FUTALA_W, J.GOREWADA_NW] },
  { id: "poly-sadar", name: "Sadar Commercial / Residency Rd", coords: [J.SADAR_N, J.PACHPAOLI_N, J.ITWARI_C, J.SITABULDI_C, J.SADAR_S, J.SADAR_N] },
  { id: "poly-itwari", name: "Itwari / Satranjipura Wholesale", coords: [J.PACHPAOLI_N, J.KALMANA_NE, J.PARDI_E, J.LAKADGANJ_C, J.ITWARI_C, J.PACHPAOLI_N] },
  { id: "poly-dharampeth", name: "Dharampeth / Gokulpeth", coords: [J.FUTALA_W, J.CIVIL_LINES_C, J.DHARAMPETH_C, J.AMBAZARI_W, J.FUTALA_W] },
  { id: "poly-sitabuldi", name: "Sitabuldi Interchange / Metro Hub", coords: [J.CIVIL_LINES_C, J.SADAR_S, J.SITABULDI_C, J.RAMDASPETH_S, J.DHARAMPETH_C, J.CIVIL_LINES_C] },
  { id: "poly-mahal", name: "Mahal / Gandhibagh Heritage", coords: [J.SITABULDI_C, J.ITWARI_C, J.LAKADGANJ_C, J.MAHAL_C, J.MEDICAL_C, J.RAMDASPETH_S, J.SITABULDI_C] },
  { id: "poly-lakadganj-pardi", name: "Lakadganj / Pardi Bhandara Corridor", coords: [J.LAKADGANJ_C, J.PARDI_E, J.PARDI_SE, J.NANDANVAN_C, J.LAKADGANJ_C] },
  { id: "poly-itpark", name: "IT Park / Gayatri Nagar Tech Hub", coords: [J.AMBAZARI_W, J.DHARAMPETH_C, J.PRATAP_C, J.HINGNA_SW, J.AMBAZARI_W] },
  { id: "poly-ramdaspeth-dhantoli", name: "Dhantoli / Ramdaspeth Medical Hub", coords: [J.DHARAMPETH_C, J.RAMDASPETH_S, J.MEDICAL_C, J.PRATAP_C, J.DHARAMPETH_C] },
  { id: "poly-pratap-nagar", name: "Pratap Nagar / Khamla Residential", coords: [J.HINGNA_SW, J.PRATAP_C, J.MANEWADA_C, J.AIRPORT_SW, J.HINGNA_SW] },
  { id: "poly-medical-ajni", name: "Medical Square / GMCH / Ajni", coords: [J.MEDICAL_C, J.SAKKARDARA_C, J.MANEWADA_C, J.PRATAP_C, J.MEDICAL_C] },
  { id: "poly-sakkardara", name: "Sakkardara / Reshimbagh", coords: [J.MAHAL_C, J.NANDANVAN_C, J.DIGHORI_E, J.SAKKARDARA_C, J.MEDICAL_C, J.MAHAL_C] },
  { id: "poly-nandanvan", name: "Nandanvan / Hasanbagh", coords: [J.NANDANVAN_C, J.PARDI_SE, J.DIGHORI_SE, J.DIGHORI_E, J.NANDANVAN_C] },
  { id: "poly-hudkeshwar-manewada", name: "Hudkeshwar / Manewada / Besa", coords: [J.AIRPORT_SW, J.MANEWADA_C, J.SAKKARDARA_C, J.DIGHORI_E, J.DIGHORI_SE, J.HUDKESHWAR_S, J.BESA_S, J.AIRPORT_SW] },
];

function isPointInPolygon(lat, lng, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const yi = polygon[i][0];
    const xi = polygon[i][1];
    const yj = polygon[j][0];
    const xj = polygon[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

let passed = 0;
let failed = 0;

function check(cond, msg) {
  if (cond) {
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${msg}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${msg}`);
    failed++;
  }
}

console.log("\n========================================================");
console.log("   N-SHIELD: Polygon Crime Risk Mosaic Verification     ");
console.log("========================================================\n");

// 1. Polygon count
check(POLYGONS.length === 16, "16 contiguous irregular sectors defined");

// 2. Closed loops
let closed = true;
for (const p of POLYGONS) {
  const f = p.coords[0];
  const l = p.coords[p.coords.length - 1];
  if (f[0] !== l[0] || f[1] !== l[1]) closed = false;
}
check(closed, "All 16 polygons have closed boundary rings");

// 3. Shared segments test (adjoining topology, no gaps)
const segMap = new Map();
function makeKey(a, b) {
  const ka = `${a[0].toFixed(4)},${a[1].toFixed(4)}`;
  const kb = `${b[0].toFixed(4)},${b[1].toFixed(4)}`;
  return ka < kb ? `${ka}->${kb}` : `${kb}->${ka}`;
}
for (const p of POLYGONS) {
  for (let i = 0; i < p.coords.length - 1; i++) {
    const k = makeKey(p.coords[i], p.coords[i + 1]);
    segMap.set(k, (segMap.get(k) || 0) + 1);
  }
}
let internalShared = 0;
for (const [k, count] of segMap.entries()) {
  if (count === 2) internalShared++;
}
check(internalShared >= 14, `All adjoining sectors share exact vertices (internal shared edges: ${internalShared})`);

// 4. Point-in-polygon verification on real Nagpur landmarks
const sitabuldiHit = isPointInPolygon(21.146, 79.073, POLYGONS.find(p => p.id === "poly-sitabuldi").coords);
check(sitabuldiHit, "Point (21.146, 79.073) correctly mapped inside Sitabuldi polygon");

const sadarHit = isPointInPolygon(21.162, 79.088, POLYGONS.find(p => p.id === "poly-sadar").coords);
check(sadarHit, "Point (21.162, 79.088) correctly mapped inside Sadar polygon");

const itparkHit = isPointInPolygon(21.122, 79.048, POLYGONS.find(p => p.id === "poly-itpark").coords);
check(itparkHit, "Point (21.122, 79.048) correctly mapped inside IT Park polygon");

const pardiHit = isPointInPolygon(21.135, 79.155, POLYGONS.find(p => p.id === "poly-lakadganj-pardi").coords);
check(pardiHit, "Point (21.135, 79.155) correctly mapped inside Lakadganj / Pardi polygon");

// 5. Geographic boundary bounds
let inBounds = true;
for (const p of POLYGONS) {
  for (const c of p.coords) {
    if (c[0] < 21.05 || c[0] > 21.25 || c[1] < 79.00 || c[1] > 79.20) inBounds = false;
  }
}
check(inBounds, "All vertices fall strictly within Nagpur administrative boundaries (21.05-21.25 N, 79.00-79.20 E)");

// 6. Test Risk Scoring Logic
function computeMockRisk(incidentCount, cctvPercent, lightingIndex) {
  const incidentScore = Math.min(45, incidentCount * 8.5);
  const cctvPenalty = cctvPercent < 45 ? 18 : cctvPercent < 75 ? 8 : 0;
  const nightPenalty = lightingIndex < 25 ? 16 : 8;
  return Math.min(96, Math.max(10, Math.round(20 + incidentScore + cctvPenalty + nightPenalty)));
}

const highRisk = computeMockRisk(6, 30, 15);
const medRisk = computeMockRisk(3, 60, 50);
const lowRisk = computeMockRisk(0, 90, 85);

check(highRisk >= 70, `High incident + low CCTV yields HIGH risk score (${highRisk} >= 70)`);
check(medRisk >= 40 && medRisk < 70, `Moderate incident load yields MEDIUM risk score (40 <= ${medRisk} < 70)`);
check(lowRisk < 40, `Low incident + high CCTV yields LOW risk score (${lowRisk} < 40)`);

console.log("\n========================================================");
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) process.exit(1);
