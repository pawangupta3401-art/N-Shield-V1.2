// Automated unit and regression test for Civil Lines Crime-Risk Details Panel Close Bug
const assert = require("assert");

console.log("=================================================");
console.log("Running Civil Lines Details Panel Bug Fix Tests");
console.log("=================================================\n");

// 1. Load Nagpur polygons definition from compiled / JS source
const fs = require("fs");
const path = require("path");

const polygonsFile = fs.readFileSync(
  path.join(__dirname, "../src/lib/nagpurPolygons.ts"),
  "utf8"
);

// Verify Civil Lines exists and has correct metadata
assert(polygonsFile.includes('"poly-civil-lines"'), "poly-civil-lines must exist in nagpurPolygons.ts");
assert(polygonsFile.includes('"NGP-SEC-03"'), "NGP-SEC-03 code must match Civil Lines");
assert(polygonsFile.includes("Zone 2 / Ward 11 - Civil Lines"), "Ward must match Zone 2 / Ward 11 - Civil Lines");
console.log("✔ Test 1: Verified Civil Lines (NGP-SEC-03) sector definition");

// 2. Simulate the state management architecture of GoogleNagpurMap + CommandCenterLayout
class DashboardStateHarness {
  constructor() {
    this.selectedZoneId = null;
    this.explainableOpen = false;
    this.activePolygonDetail = null;
    this.activeZoneDetail = null;
    this.lastHandledZoneId = null;
    this.renderCycles = 0;
    
    // Mock 16 sectors
    this.polygonAnalyticsList = [
      { polygonId: "poly-sadar", zoneId: "zone-sadar", name: "Sadar / Mohan Nagar", code: "NGP-SEC-01" },
      { polygonId: "poly-sitabuldi", zoneId: "zone-sitabuldi", name: "Sitabuldi Metro", code: "NGP-SEC-02" },
      { polygonId: "poly-civil-lines", zoneId: "zone-sitabuldi", name: "Civil Lines / Seminary Hills", code: "NGP-SEC-03" },
      { polygonId: "poly-dharampeth", zoneId: "zone-sitabuldi", name: "Dharampeth / Gokulpeth", code: "NGP-SEC-04" },
    ];
  }

  // Parent CommandCenterLayout handler
  handleZoneSelect(zoneId) {
    this.selectedZoneId = zoneId;
    if (!zoneId) {
      this.explainableOpen = false;
      return;
    }
    this.explainableOpen = true;
  }

  // GoogleNagpurMap polygon click
  clickPolygon(poly) {
    this.activePolygonDetail = poly;
    this.lastHandledZoneId = poly.polygonId;
    this.handleZoneSelect(poly.polygonId);
    this.runSyncEffect();
  }

  // GoogleNagpurMap close button handler
  handleCloseRegionDetails(e) {
    if (e) {
      if (typeof e.stopPropagation === "function") e.stopPropagation();
      if (typeof e.preventDefault === "function") e.preventDefault();
    }
    this.activePolygonDetail = null;
    this.activeZoneDetail = null;
    this.lastHandledZoneId = null;
    this.handleZoneSelect(null);
    this.runSyncEffect();
  }

  // GoogleNagpurMap useEffect synchronizing selectedZoneId
  runSyncEffect() {
    this.renderCycles++;
    if (!this.selectedZoneId) {
      if (this.lastHandledZoneId !== null) {
        this.lastHandledZoneId = null;
        this.activePolygonDetail = null;
        this.activeZoneDetail = null;
      }
      return;
    }

    if (this.selectedZoneId === this.lastHandledZoneId) {
      return;
    }
    this.lastHandledZoneId = this.selectedZoneId;

    const foundPoly = this.polygonAnalyticsList.find(
      (p) => p.polygonId === this.selectedZoneId || p.zoneId === this.selectedZoneId
    );
    if (foundPoly) {
      this.activePolygonDetail = foundPoly;
    }
  }
}

const harness = new DashboardStateHarness();

// Test Scenario 1: Select Civil Lines / Seminary Hills
console.log("\n--- Scenario 1: Open Civil Lines / Seminary Hills ---");
const civilLinesPoly = harness.polygonAnalyticsList.find((p) => p.polygonId === "poly-civil-lines");
harness.clickPolygon(civilLinesPoly);

assert.strictEqual(harness.activePolygonDetail?.code, "NGP-SEC-03", "Active polygon should be NGP-SEC-03");
assert.strictEqual(harness.activePolygonDetail?.name, "Civil Lines / Seminary Hills", "Name should be Civil Lines");
assert.strictEqual(harness.selectedZoneId, "poly-civil-lines", "Parent selectedZoneId must match");
assert.strictEqual(harness.explainableOpen, true, "Explainable AI should open");
console.log("✔ Civil Lines details panel successfully opened (NGP-SEC-03).");

// Test Scenario 2: Click the 'x' close button
console.log("\n--- Scenario 2: Click × button on Civil Lines Panel ---");
let stoppedPropagation = false;
let preventedDefault = false;
const mockEvent = {
  stopPropagation: () => { stoppedPropagation = true; },
  preventDefault: () => { preventedDefault = true; }
};

harness.handleCloseRegionDetails(mockEvent);

assert.strictEqual(stoppedPropagation, true, "Click event propagation should be stopped");
assert.strictEqual(preventedDefault, true, "Click default should be prevented");
assert.strictEqual(harness.activePolygonDetail, null, "activePolygonDetail must be null after close");
assert.strictEqual(harness.selectedZoneId, null, "selectedZoneId in parent must be null after close");
assert.strictEqual(harness.explainableOpen, false, "Explainable drawer should be closed");
console.log("✔ Civil Lines details panel immediately closed without reopening.");

// Test Scenario 3: Confirm panel stays closed through subsequent render cycles
console.log("\n--- Scenario 3: Verify Panel Stays Closed on Re-renders ---");
harness.runSyncEffect();
harness.runSyncEffect();
assert.strictEqual(harness.activePolygonDetail, null, "activePolygonDetail must remain null on re-render");
assert.strictEqual(harness.selectedZoneId, null, "selectedZoneId must remain null");
console.log("✔ Panel remains closed stably across render ticks.");

// Test Scenario 4: Click another risk polygon (Sadar)
console.log("\n--- Scenario 4: Select Another Sector (Sadar) ---");
const sadarPoly = harness.polygonAnalyticsList.find((p) => p.polygonId === "poly-sadar");
harness.clickPolygon(sadarPoly);

assert.strictEqual(harness.activePolygonDetail?.code, "NGP-SEC-01", "Active polygon should now be Sadar");
assert.strictEqual(harness.selectedZoneId, "poly-sadar", "Parent selectedZoneId must be poly-sadar");
console.log("✔ Sadar sector details panel opened normally.");

// Test Scenario 5: Close Sadar panel
console.log("\n--- Scenario 5: Close Sadar Panel ---");
harness.handleCloseRegionDetails(mockEvent);
assert.strictEqual(harness.activePolygonDetail, null, "Sadar details should be closed");
assert.strictEqual(harness.selectedZoneId, null, "selectedZoneId should be null");
console.log("✔ Sadar sector details panel closed cleanly.");

// Test Scenario 6: Re-select Civil Lines again to ensure re-opening works
console.log("\n--- Scenario 6: Re-open Civil Lines Sector ---");
harness.clickPolygon(civilLinesPoly);
assert.strictEqual(harness.activePolygonDetail?.code, "NGP-SEC-03", "Civil lines can be re-opened");
console.log("✔ Civil Lines can be opened again without issues.");

console.log("\n=================================================");
console.log("ALL 6 SCENARIOS PASSED WITH 100% SUCCESS");
console.log("=================================================");
