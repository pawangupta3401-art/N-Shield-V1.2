const { NAGPUR_CRIME_POLYGONS, isPointInPolygon, assignIncidentToPolygon, toNagpurGeoJson } = require("../src/lib/nagpurPolygons.ts");
const { computeAllPolygonsRisk } = require("../src/lib/polygonRiskEngine.ts");
const { incidents, cameras, zones } = require("../src/lib/mockData.ts");

console.log("\n========================================================");
console.log("   N-SHIELD: Polygon Crime Risk Mosaic Verification     ");
console.log("========================================================\n");

let passed = 0;
let failed = 0;

function check(cond, name, details = "") {
  if (cond) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name} ${details}`);
    failed++;
  }
}

// 1. Verify polygon count and attributes
check(NAGPUR_CRIME_POLYGONS.length === 16, "16 contiguous sectors defined", `Found: ${NAGPUR_CRIME_POLYGONS.length}`);

// 2. Verify all polygons have closed boundaries
let allClosed = true;
for (const poly of NAGPUR_CRIME_POLYGONS) {
  const coords = poly.boundaryCoordinates;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    allClosed = false;
    console.error(`Polygon ${poly.id} is not closed!`);
  }
}
check(allClosed, "All 16 polygons have closed rings (first vertex == last vertex)");

// 3. Verify GeoJSON conversion
const geoJson = toNagpurGeoJson(NAGPUR_CRIME_POLYGONS);
check(geoJson.type === "FeatureCollection" && geoJson.features.length === 16, "Converts to valid GeoJSON FeatureCollection");
check(geoJson.features[0].geometry.type === "Polygon", "GeoJSON feature has Polygon geometry");
check(Array.isArray(geoJson.features[0].geometry.coordinates[0]), "GeoJSON coordinates array is properly structured");

// 4. Verify Point-in-polygon on known landmarks
const sitabuldiCenter = { lat: 21.147, lng: 79.073 };
const assignedSitabuldi = assignIncidentToPolygon(sitabuldiCenter);
check(assignedSitabuldi && assignedSitabuldi.id === "poly-sitabuldi", `Sitabuldi center mapped to poly-sitabuldi (Got: ${assignedSitabuldi?.id})`);

const dharampethCenter = { lat: 21.142, lng: 79.049 };
const assignedDharampeth = assignIncidentToPolygon(dharampethCenter);
check(assignedDharampeth && assignedDharampeth.id === "poly-dharampeth", `Dharampeth center mapped to poly-dharampeth (Got: ${assignedDharampeth?.id})`);

const itparkCenter = { lat: 21.124, lng: 79.048 };
const assignedItPark = assignIncidentToPolygon(itparkCenter);
check(assignedItPark && assignedItPark.id === "poly-itpark", `IT Park center mapped to poly-itpark (Got: ${assignedItPark?.id})`);

// 5. Test Polygon Risk Calculations with "All Crime" and "Last 30 Days"
const resultsAll = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "All Crime", 22);
check(resultsAll.length === 16, "Computed risk analytics for all 16 polygons");

const hasHighRisk = resultsAll.some(p => p.riskLevel === "HIGH" && p.colorHex === "#EF4444");
const hasMedRisk = resultsAll.some(p => p.riskLevel === "MEDIUM" && p.colorHex === "#F59E0B");
const hasLowRisk = resultsAll.some(p => p.riskLevel === "LOW" && p.colorHex === "#10B981");

check(hasHighRisk, "High risk polygons assigned Red (#EF4444)");
check(hasMedRisk, "Medium risk polygons assigned Amber (#F59E0B)");
check(hasLowRisk, "Low risk polygons assigned Emerald (#10B981)");

// 6. Test Category Filter updates risk calculations
const resultsTheft = computeAllPolygonsRisk(incidents, cameras, "Last 30 Days", "Theft", 22);
const totalIncidentsAll = resultsAll.reduce((sum, p) => sum + p.recentIncidentsCount, 0);
const totalIncidentsTheft = resultsTheft.reduce((sum, p) => sum + p.recentIncidentsCount, 0);
check(totalIncidentsTheft <= totalIncidentsAll, `Category filter dynamically reduces incident counts (All: ${totalIncidentsAll}, Theft: ${totalIncidentsTheft})`);

// 7. Test Time Filter updates
const resultsToday = computeAllPolygonsRisk(incidents, cameras, "Today", "All Crime", 22);
const totalIncidentsToday = resultsToday.reduce((sum, p) => sum + p.recentIncidentsCount, 0);
check(totalIncidentsToday <= totalIncidentsAll, `Time filter dynamically updates counts (30 Days: ${totalIncidentsAll}, Today: ${totalIncidentsToday})`);

// 8. Test Empty / Zero Data Handling
const resultsEmpty = computeAllPolygonsRisk([], [], "Today", "All Crime", 14);
const allEmptyHandled = resultsEmpty.every(p => p.recentIncidentsCount === 0 && p.riskScore >= 10);
check(allEmptyHandled, "Empty data produces calibrated baseline scores without crashing");

// 9. Inspect breakdown on poly-sitabuldi
const sitaAnalytics = resultsAll.find(p => p.polygonId === "poly-sitabuldi");
check(sitaAnalytics && typeof sitaAnalytics.categoryBreakdown === "object", "Category breakdown provided per polygon");
check(sitaAnalytics && sitaAnalytics.aiRecommendation.length > 10, "AI Recommendation generated per polygon");
check(sitaAnalytics && sitaAnalytics.highRiskReasons.length > 0, "Explainable high risk reasons generated per polygon");

console.log("\n========================================================");
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log("========================================================\n");

if (failed > 0) process.exit(1);
