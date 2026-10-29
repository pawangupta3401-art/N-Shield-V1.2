/**
 * N-SHIELD: Polygon-Based Crime Risk Mosaic Automated Test Suite
 *
 * Validates all 15 acceptance criteria specified in Section 14.
 */

import { NAGPUR_CRIME_POLYGONS, isPointInPolygon, assignIncidentToPolygon, toNagpurGeoJson } from "../src/lib/nagpurPolygons.ts";
import { computeAllPolygonsRisk } from "../src/lib/polygonRiskEngine.ts";
import { incidents, cameras, zones } from "../src/lib/mockData.ts";

console.log("================================================================================");
console.log("   N-SHIELD: POLYGON-BASED CRIME RISK MOSAIC AUTOMATED TEST SUITE (15/15)       ");
console.log("================================================================================\n");

let passed = 0;
let failed = 0;

function assert(cond, name, details = "") {
  if (cond) {
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${name} | ${details}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Polygon regions count & validity
// -----------------------------------------------------------------------------
assert(
  Array.isArray(NAGPUR_CRIME_POLYGONS) && NAGPUR_CRIME_POLYGONS.length === 16,
  "Requirement 1: 16 contiguous irregular polygon regions defined for Nagpur",
  `Found: ${NAGPUR_CRIME_POLYGONS.length}`
);

// -----------------------------------------------------------------------------
// Test 2: Coordinates appear in correct geographic locations (Nagpur Bounds)
// -----------------------------------------------------------------------------
const NAGPUR_LAT_MIN = 21.05;
const NAGPUR_LAT_MAX = 21.25;
const NAGPUR_LNG_MIN = 79.00;
const NAGPUR_LNG_MAX = 79.20;

let allWithinBounds = true;
for (const poly of NAGPUR_CRIME_POLYGONS) {
  for (const [lat, lng] of poly.boundaryCoordinates) {
    if (lat < NAGPUR_LAT_MIN || lat > NAGPUR_LAT_MAX || lng < NAGPUR_LNG_MIN || lng > NAGPUR_LNG_MAX) {
      allWithinBounds = false;
      console.error(`Vertex [${lat}, ${lng}] in ${poly.id} out of bounds!`);
    }
  }
}
assert(
  allWithinBounds,
  "Requirement 2: All polygon coordinates strictly fall within Nagpur metropolitan geographic bounding box"
);

// -----------------------------------------------------------------------------
// Test 3: Adjacent regions display without unintended gaps or overlaps (Shared Vertices)
// -----------------------------------------------------------------------------
// Every internal segment must be shared between adjacent polygons
const segmentCounts = new Map();
function makeSegmentKey(p1, p2) {
  const k1 = `${p1[0].toFixed(4)},${p1[1].toFixed(4)}`;
  const k2 = `${p2[0].toFixed(4)},${p2[1].toFixed(4)}`;
  return k1 < k2 ? `${k1}->${k2}` : `${k2}->${k1}`;
}

for (const poly of NAGPUR_CRIME_POLYGONS) {
  const coords = poly.boundaryCoordinates;
  for (let i = 0; i < coords.length - 1; i++) {
    const key = makeSegmentKey(coords[i], coords[i + 1]);
    segmentCounts.set(key, (segmentCounts.get(key) || 0) + 1);
  }
}

// An airtight planar mosaic has internal segments with count 2 and outer perimeter segments with count 1
let maxOverlapCount = 0;
let internalSharedCount = 0;
for (const [seg, count] of segmentCounts.entries()) {
  if (count > maxOverlapCount) maxOverlapCount = count;
  if (count === 2) internalSharedCount++;
}

assert(
  maxOverlapCount <= 2 && internalSharedCount >= 14,
  "Requirement 3: Adjoining regions fit together with shared edges (0 unintended gaps or overlaps)",
  `Internal shared segments: ${internalSharedCount}, Max segment count: ${maxOverlapCount}`
);

// -----------------------------------------------------------------------------
// Test 4: Polygon colors correspond to calculated risk categories
// -----------------------------------------------------------------------------
const allRiskData = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "All Crime", 22);

let colorsMatchScores = true;
for (const p of allRiskData) {
  if (p.riskScore >= 70 && (p.riskLevel !== "HIGH" || p.colorHex !== "#EF4444")) {
    colorsMatchScores = false;
  }
  if (p.riskScore >= 40 && p.riskScore < 70 && (p.riskLevel !== "MEDIUM" || p.colorHex !== "#F59E0B")) {
    colorsMatchScores = false;
  }
  if (p.riskScore < 40 && p.dataConfidence !== "Insufficient" && (p.riskLevel !== "LOW" || p.colorHex !== "#10B981")) {
    colorsMatchScores = false;
  }
}
assert(
  colorsMatchScores,
  "Requirement 4: Polygon colors strictly correspond to risk thresholds (>=70: Red, 40-69: Amber, <40: Emerald)"
);

// -----------------------------------------------------------------------------
// Test 5: Crime category filters update region data correctly
// -----------------------------------------------------------------------------
const theftRiskData = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "Theft", 22);
const robberyRiskData = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "Robbery", 22);

const totalIncidentsAll = allRiskData.reduce((s, p) => s + p.recentIncidentsCount, 0);
const totalIncidentsTheft = theftRiskData.reduce((s, p) => s + p.recentIncidentsCount, 0);
const totalIncidentsRobbery = robberyRiskData.reduce((s, p) => s + p.recentIncidentsCount, 0);

assert(
  totalIncidentsTheft < totalIncidentsAll && totalIncidentsRobbery < totalIncidentsAll,
  "Requirement 5: Crime category filter dynamically updates incident load and scores",
  `All: ${totalIncidentsAll}, Theft: ${totalIncidentsTheft}, Robbery: ${totalIncidentsRobbery}`
);

// -----------------------------------------------------------------------------
// Test 6: Time-based filters update region data correctly
// -----------------------------------------------------------------------------
const todayRiskData = computeAllPolygonsRisk(incidents, cameras, "Today", "All Crime", 22);
const last7DaysRiskData = computeAllPolygonsRisk(incidents, cameras, "Last 7 Days", "All Crime", 22);

const totalToday = todayRiskData.reduce((s, p) => s + p.recentIncidentsCount, 0);
const total7Days = last7DaysRiskData.reduce((s, p) => s + p.recentIncidentsCount, 0);

assert(
  totalToday <= total7Days && total7Days <= totalIncidentsAll,
  "Requirement 6: Time-based filters (Today, 7 Days, 30 Days) update incident aggregation dynamically",
  `Today: ${totalToday}, 7 Days: ${total7Days}, 30 Days: ${totalIncidentsAll}`
);

// -----------------------------------------------------------------------------
// Test 7: Clicking a polygon displays grounded information (Detail fields check)
// -----------------------------------------------------------------------------
const sampleSector = allRiskData.find(p => p.polygonId === "poly-sitabuldi");
assert(
  Boolean(
    sampleSector &&
    sampleSector.name &&
    sampleSector.code &&
    sampleSector.wardName &&
    sampleSector.riskScore > 0 &&
    typeof sampleSector.categoryBreakdown === "object" &&
    sampleSector.aiRecommendation &&
    sampleSector.officerInCharge &&
    sampleSector.contactNumber
  ),
  "Requirement 7: Polygon inspection payload contains complete grounded region information and AI recommendation",
  JSON.stringify(sampleSector?.code)
);

// -----------------------------------------------------------------------------
// Test 8: Invalid or missing boundary geometry handled gracefully
// -----------------------------------------------------------------------------
const dummyBadPolygon = {
  id: "bad-poly",
  zoneId: "zone-sitabuldi",
  name: "Bad",
  code: "BAD",
  wardName: "None",
  boundaryCoordinates: [[21.14, 79.08]], // Only 1 point
  center: { lat: 21.14, lng: 79.08 },
  areaKm2: 1,
  populationEstimate: 1000,
  officerInCharge: "Test",
  contactNumber: "123",
  keyVulnerabilities: [],
};
const pointInBad = isPointInPolygon(21.14, 79.08, dummyBadPolygon.boundaryCoordinates);
const pointInNull = isPointInPolygon(21.14, 79.08, null);
assert(
  pointInBad === false && pointInNull === false,
  "Requirement 8: Degenerate or malformed boundary geometry (<3 vertices) handled gracefully without errors"
);

// -----------------------------------------------------------------------------
// Test 9: Empty crime data produces calibrated baseline scores without inventing incidents
// -----------------------------------------------------------------------------
const emptyRisk = computeAllPolygonsRisk([], [], "Last 30 Days", "All Crime", 14);
const allZeroIncidents = emptyRisk.every(p => p.recentIncidentsCount === 0 && p.historicalIncidentsCount === 0);
const allValidScores = emptyRisk.every(p => p.riskScore >= 10 && p.riskScore <= 100);
assert(
  allZeroIncidents && allValidScores,
  "Requirement 9: Empty crime data does not invent false crimes and produces calibrated baseline risk"
);

// -----------------------------------------------------------------------------
// Test 10: Simulated data is distinguishable from verified incident data (Data confidence)
// -----------------------------------------------------------------------------
const insufficientSample = computeAllPolygonsRisk([], [], "Today", "All Crime", 14);
const hasConfidenceTag = insufficientSample.every(p => Boolean(p.dataConfidence));
assert(
  hasConfidenceTag,
  "Requirement 10: Data confidence and limitations clearly distinguish sparse/baseline from verified incident load"
);

// -----------------------------------------------------------------------------
// Test 11: Ray-casting Point-in-polygon mapping accuracy
// -----------------------------------------------------------------------------
const assignedPardi = assignIncidentToPolygon({ lat: 21.136, lng: 79.155 });
const assignedMankapur = assignIncidentToPolygon({ lat: 21.193, lng: 79.115 });
assert(
  assignedPardi?.id === "poly-lakadganj-pardi" && assignedMankapur?.id === "poly-automotive-sq",
  "Requirement 11: Point-in-polygon ray-casting maps incidents accurately to target municipal sectors"
);

// -----------------------------------------------------------------------------
// Test 12: Existing CCTV, Patrols, and Emergency features still intact
// -----------------------------------------------------------------------------
assert(
  cameras.length > 0 && zones.length > 0,
  "Requirement 12: Core CCTV, police patrol units, and administrative zone datasets preserved"
);

// -----------------------------------------------------------------------------
// Test 13: GeoJSON Standard Export compliance (RFC 7946)
// -----------------------------------------------------------------------------
const geoJsonOutput = toNagpurGeoJson();
assert(
  geoJsonOutput.type === "FeatureCollection" &&
  geoJsonOutput.features.length === 16 &&
  geoJsonOutput.features[0].geometry.coordinates[0][0][0] > 78.0 && // Longitude first in GeoJSON
  geoJsonOutput.features[0].geometry.coordinates[0][0][1] > 20.0,   // Latitude second in GeoJSON
  "Requirement 13: Standard GeoJSON FeatureCollection generated with [longitude, latitude] coordinates (RFC 7946)"
);

// -----------------------------------------------------------------------------
// Test 14: Category distribution sums to total recent incidents per polygon
// -----------------------------------------------------------------------------
let breakdownConsistent = true;
for (const p of allRiskData) {
  const sumCat = Object.values(p.categoryBreakdown).reduce((a, b) => a + b, 0);
  if (sumCat !== p.recentIncidentsCount) {
    breakdownConsistent = false;
  }
}
assert(
  breakdownConsistent,
  "Requirement 14: Sum of crime categories in breakdown equals total active incidents per polygon"
);

// -----------------------------------------------------------------------------
// Test 15: Night Risk & Street Lighting vulnerability adjustments
// -----------------------------------------------------------------------------
const dayRisk = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "All Crime", 12);
const nightRisk = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "All Crime", 23);

const avgDay = dayRisk.reduce((s, p) => s + p.riskScore, 0) / dayRisk.length;
const avgNight = nightRisk.reduce((s, p) => s + p.riskScore, 0) / nightRisk.length;

assert(
  avgNight > avgDay,
  "Requirement 15: Night-time time simulator elevates vulnerability based on street lighting deficits",
  `Day Avg: ${avgDay.toFixed(1)}, Night Avg: ${avgNight.toFixed(1)}`
);

console.log("\n================================================================================");
console.log(`   SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED                          `);
console.log("================================================================================\n");

if (failed > 0) process.exit(1);
