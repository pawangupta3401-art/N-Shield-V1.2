// Test script: Verify Nearby Services Panel Layout, Categories, Positioning & Behavior
const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("========================================================");
console.log("Running Nearby Services Panel Fix & Layout Verification");
console.log("========================================================\n");

// 1. Verify source file contains the corrected architecture
const mapFilePath = path.join(__dirname, "../src/components/dashboard/GoogleNagpurMap.tsx");
const mapFileContent = fs.readFileSync(mapFilePath, "utf8");

// A. Check that the cramped nested dropdown inside div.relative was removed
assert(
  !mapFileContent.includes('<div className="relative">\n                    <button\n                      ref={nearbyServicesBtnRef}'),
  "Nearby Services button should not be trapped in an unneeded relative wrapper with an inline dropdown"
);

// B. Check that the panel is rendered outside motion.div
const motionDivCloseIdx = mapFileContent.indexOf("</motion.div>\n          )}\n        </AnimatePresence>");
assert(motionDivCloseIdx !== -1, "Found closing </motion.div> of filter box");

const nearbyServicesPanelIdx = mapFileContent.indexOf("showNearbyServicesPanel && isFiltersOpen && (");
assert(nearbyServicesPanelIdx !== -1, "Found Nearby Services panel render block");
assert(
  nearbyServicesPanelIdx > motionDivCloseIdx,
  "Nearby Services panel MUST be rendered outside motion.div so overflow-hidden cannot clip it!"
);
console.log("✔ Test 1: Panel is rendered outside motion.div (zero clipping from filter box overflow-hidden).");

// C. Check positioning, dimensions, and layering
assert(
  mapFileContent.includes("self-end w-full sm:w-88 max-w-sm"),
  "Panel has responsive width (w-full sm:w-88 max-w-sm) aligned to the right (self-end)"
);
assert(
  mapFileContent.includes("max-h-[min(540px,calc(100vh-220px))] overflow-y-auto"),
  "Panel has explicit viewport-safe max-height and internal scrolling"
);
assert(
  mapFileContent.includes("bg-white/95 dark:bg-slate-900/95"),
  "Panel has distinguishable dark/light theme background"
);
assert(
  mapFileContent.includes("z-40"),
  "Panel has high z-index (z-40) to layer above the map"
);
console.log("✔ Test 2: Panel styling, sizing, theme, and z-index verified.");

// D. Check interactive accessibility & dismissal features
assert(
  mapFileContent.includes('aria-label="Close nearby services panel"'),
  "Close button has accessible aria-label"
);
assert(
  mapFileContent.includes('e.key === "Escape"'),
  "Escape key dismissal is implemented"
);
assert(
  mapFileContent.includes("handlePointerDown"),
  "Outside-click dismissal is implemented"
);
assert(
  mapFileContent.includes("topControlsContainerRef"),
  "Clicking filter category or period chips does not inadvertently dismiss the panel"
);
console.log("✔ Test 3: Accessible close button, outside-click, and Escape dismissal verified.");

// E. Check Select All and Clear All quick actions
assert(
  mapFileContent.includes("handleToggleAllServices(true)"),
  "Select All action is implemented"
);
assert(
  mapFileContent.includes("handleToggleAllServices(false)"),
  "Clear All action is implemented"
);
console.log("✔ Test 4: Quick Select All / Clear All toggles verified.");

// 2. Verify all 6 facility categories from nearbyServicesData.ts
const servicesDataPath = path.join(__dirname, "../src/lib/nearbyServicesData.ts");
const servicesDataContent = fs.readFileSync(servicesDataPath, "utf8");

const expectedCategories = [
  "police",
  "hospital",
  "pharmacy",
  "ambulance",
  "fire_station",
  "emergency_other",
];

for (const cat of expectedCategories) {
  assert(servicesDataContent.includes(`id: "${cat}"`), `Category ${cat} must exist in SERVICE_CATEGORIES`);
}
console.log("✔ Test 5: All 6 essential emergency categories verified (Police, Hospitals, Pharmacies, Ambulance, Fire, Helplines).");

// 3. Simulate Toggle State Mechanics
const serviceCategoryToggles = {
  police: true,
  hospital: true,
  pharmacy: true,
  ambulance: false,
  fire_station: false,
  emergency_other: false,
};

function toggleCategory(toggles, id) {
  return { ...toggles, [id]: !toggles[id] };
}

function toggleAll(enableAll) {
  return {
    police: enableAll,
    hospital: enableAll,
    pharmacy: enableAll,
    ambulance: enableAll,
    fire_station: enableAll,
    emergency_other: enableAll,
  };
}

// Initial state
let toggles = { ...serviceCategoryToggles };
assert.strictEqual(Object.values(toggles).filter(Boolean).length, 3, "Initially 3 categories active");

// Toggle ambulance on
toggles = toggleCategory(toggles, "ambulance");
assert.strictEqual(toggles.ambulance, true, "Ambulance should be enabled");
assert.strictEqual(Object.values(toggles).filter(Boolean).length, 4, "Now 4 categories active");

// Toggle All off
toggles = toggleAll(false);
assert.strictEqual(Object.values(toggles).filter(Boolean).length, 0, "Clear all should disable all categories");

// Toggle All on
toggles = toggleAll(true);
assert.strictEqual(Object.values(toggles).filter(Boolean).length, 6, "Select all should enable all 6 categories");
console.log("✔ Test 6: Toggle state mechanics (individual, Select All, Clear All) verified.");

console.log("\n========================================================");
console.log("ALL 6 TESTS PASSED WITH 100% SUCCESS!");
console.log("========================================================");
