const assert = require("assert");
const path = require("path");
const jiti = require("jiti")(__filename, {
  alias: {
    "@": path.resolve(__dirname, "../src"),
  },
});

// Import the actual orchestrator / engine using jiti
const { processAssistantMessage } = jiti("../src/lib/assistant/orchestrator");
const { parseSearchIntent, getSortedNearbyServices, DEFAULT_NAGPUR_USER_LOCATION } = jiti("../src/lib/geoUtils");
const { NAGPUR_ESSENTIAL_SERVICES } = jiti("../src/lib/nearbyServicesData");
const { searchTinyFishWeb, fetchTinyFishUrls, isTinyFishConfigured } = jiti("../src/lib/tinyfish/client");

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`\x1b[32m✔ PASS\x1b[0m: ${name}`);
    passed++;
  } catch (err) {
    console.error(`\x1b[31m✖ FAIL\x1b[0m: ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log("==================================================================");
  console.log("      N-SHIELD AI Safety Assistant: 12-Scenario Test Suite        ");
  console.log("==================================================================\n");

  const SITABULDI_LOC = {
    lat: 21.1489,
    lng: 79.0876,
    label: "Sitabuldi Metro Interchange",
    isUserSet: true,
    source: "gps",
  };

  const DHARAMPETH_LOC = {
    lat: 21.1415,
    lng: 79.0535,
    label: "Dharampeth, Nagpur",
    isUserSet: true,
    source: "gps",
  };

  const UNSET_LOC = {
    lat: 21.1458,
    lng: 79.0882,
    label: "Nagpur Center (Sitabuldi)",
    isUserSet: false,
    source: "default",
  };

  // --------------------------------------------------------------------------
  // Scenario 1: "Find the nearest hospital."
  // --------------------------------------------------------------------------
  let lastPlaceFound = null;
  await runTest("1. 'Find the nearest hospital' returns single closest hospital with road distance & ETA", async () => {
    const res = await processAssistantMessage({
      message: "Find the nearest hospital",
      userLocation: DHARAMPETH_LOC,
    });

    assert(res.items && res.items.places, "Must return structured places");
    assert.strictEqual(res.items.places.length, 1, `Expected 1 closest hospital, got ${res.items.places.length}`);
    const top = res.items.places[0];
    assert.strictEqual(top.isNearest, true, "isNearest flag must be true");
    assert(top.name && top.address, "Must have verified name and address");
    assert(top.formattedDistance && top.formattedRoadDistance, "Must have road and straight-line distance");
    assert(res.answer.includes(top.name), "Answer must mention top hospital name");
    lastPlaceFound = top;
  });

  // --------------------------------------------------------------------------
  // Scenario 2: "Show all hospitals in Nagpur."
  // --------------------------------------------------------------------------
  await runTest("2. 'Show all hospitals in Nagpur' returns city-wide directory list", async () => {
    const res = await processAssistantMessage({
      message: "Show all hospitals in Nagpur",
      userLocation: UNSET_LOC, // Unset location should still return city-wide directory
    });

    assert(res.items && res.items.places, "Must return structured places");
    assert(res.items.places.length >= 8, `Expected at least 8 hospitals for 'all', got ${res.items.places.length}`);
    assert(res.answer.toLowerCase().includes("verified") || res.answer.toLowerCase().includes("hospitals"), "Answer summarizes verified hospitals");
  });

  // --------------------------------------------------------------------------
  // Scenario 3: "Which hospital is closest to Sitabuldi?"
  // --------------------------------------------------------------------------
  await runTest("3. 'Which hospital is closest to Sitabuldi?' resolves locality & returns single closest", async () => {
    const res = await processAssistantMessage({
      message: "Which hospital is closest to Sitabuldi?",
      userLocation: UNSET_LOC,
    });

    assert(res.items && res.items.places, "Must return structured places");
    assert.strictEqual(res.items.places.length, 1, `Expected 1 closest hospital to Sitabuldi, got ${res.items.places.length}`);
    const top = res.items.places[0];
    assert(top.name, "Must have name");
    assert(res.answer.includes(top.name), "Answer must name closest hospital");
  });

  // --------------------------------------------------------------------------
  // Scenario 4: "Find a police station near me."
  // --------------------------------------------------------------------------
  await runTest("4. 'Find a police station near me' returns 3 closest police stations", async () => {
    const res = await processAssistantMessage({
      message: "Find a police station near me",
      userLocation: DHARAMPETH_LOC,
    });

    assert(res.items && res.items.places, "Must return places");
    assert.strictEqual(res.items.places.length, 3, `Expected 3 police stations for 'near me', got ${res.items.places.length}`);
    assert(res.items.places.every((p) => p.type === "police_station"), "All items must be police stations");
  });

  // --------------------------------------------------------------------------
  // Scenario 5: "What is its phone number?" (Context resolution)
  // --------------------------------------------------------------------------
  await runTest("5. 'What is its phone number?' resolves 'its' from previous turn context", async () => {
    assert(lastPlaceFound, "Prerequisite: previous place exists");
    const res = await processAssistantMessage({
      message: "What is its phone number?",
      userLocation: DHARAMPETH_LOC,
      context: {
        lastReferencedPlace: lastPlaceFound,
      },
    });

    assert(res.answer.includes(lastPlaceFound.name), "Answer must reference previously selected place");
    if (lastPlaceFound.phone) {
      assert(res.answer.includes(lastPlaceFound.phone), "Answer must state phone number");
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 6: "What are the latest crime-related news reports in Nagpur?"
  // --------------------------------------------------------------------------
  await runTest("6. 'What are the latest crime-related news reports in Nagpur?' handles web research/fallback", async () => {
    const res = await processAssistantMessage({
      message: "What are the latest crime-related news reports in Nagpur?",
      userLocation: SITABULDI_LOC,
    });

    assert(res.answer && res.answer.length > 20, "Answer must be provided");
    assert(res.sourceMetadata && res.sourceMetadata.sourcesUsed, "Source metadata must be present");
    if (isTinyFishConfigured()) {
      assert(res.sourceMetadata.sourcesUsed.some((s) => s.includes("TinyFish")), "Uses TinyFish source");
    } else {
      assert(res.answer.includes("TINYFISH_API_KEY") || res.items?.incidents || res.items?.news, "Provides clear unconfigured notice or local police logs");
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 7: "Summarize this article" with valid URL
  // --------------------------------------------------------------------------
  await runTest("7. 'Summarize this article' with article URL fetches & provides clean summary", async () => {
    const testUrl = "https://nagpurpolice.gov.in";
    const res = await processAssistantMessage({
      message: `Summarize this article: ${testUrl}`,
      userLocation: SITABULDI_LOC,
    });

    assert(res.answer && res.answer.length > 20, "Answer must contain summary");
    assert(res.answer.includes(testUrl) || res.items?.research, "References the requested URL");
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Request without browser location permission
  // --------------------------------------------------------------------------
  await runTest("8. Unset location with 'Find the nearest hospital' triggers location guard & helplines", async () => {
    const res = await processAssistantMessage({
      message: "Find the nearest hospital",
      userLocation: UNSET_LOC, // isUserSet: false
    });

    assert.strictEqual(res.requiresLocation, true, "Must flag requiresLocation = true");
    assert(res.items && res.items.helplines && res.items.helplines.length > 0, "Must provide emergency ambulance helplines");
    assert(!res.items?.places, "Must NOT guess and return a hospital as 'nearest' without user location");
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Missing TinyFish API key handling
  // --------------------------------------------------------------------------
  await runTest("9. Missing TinyFish API key returns transparent status without crashing or secret leak", async () => {
    const originalKey = process.env.TINYFISH_API_KEY;
    try {
      delete process.env.TINYFISH_API_KEY;
      assert.strictEqual(isTinyFishConfigured(), false, "isTinyFishConfigured must be false");

      const researchOut = await searchTinyFishWeb("Sitabuldi theft incidents");
      assert.strictEqual(researchOut.success, false, "Must return success = false");
      assert.strictEqual(researchOut.isConfigured, false, "Must indicate not configured");
      assert(researchOut.error && researchOut.error.includes("TINYFISH_API_KEY"), "Clear error message");
      assert(!JSON.stringify(researchOut).includes("undefined="), "No secret leak");
    } finally {
      if (originalKey) process.env.TINYFISH_API_KEY = originalKey;
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 10: TinyFish API failure graceful fallback
  // --------------------------------------------------------------------------
  await runTest("10. TinyFish API network failure falls back gracefully without 500 error", async () => {
    // Test with invalid endpoint/key simulation
    const originalKey = process.env.TINYFISH_API_KEY;
    try {
      process.env.TINYFISH_API_KEY = "test_failing_key";
      const res = await processAssistantMessage({
        message: "What are the latest reported safety incidents in Nagpur?",
        userLocation: SITABULDI_LOC,
      });

      assert(res.answer && res.answer.length > 0, "Must return valid answer despite failure");
      assert(res.sourceMetadata, "Source metadata must be present");
    } finally {
      if (originalKey) process.env.TINYFISH_API_KEY = originalKey;
      else delete process.env.TINYFISH_API_KEY;
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Ambiguous question and follow-up question
  // --------------------------------------------------------------------------
  await runTest("11. Ambiguous question handles context gracefully with follow-up suggestions", async () => {
    const res = await processAssistantMessage({
      message: "What should I be careful about?",
      userLocation: SITABULDI_LOC,
    });

    assert(res.answer, "Must provide safety advice or clarification");
    assert(res.suggestedFollowUps && res.suggestedFollowUps.length > 0, "Must offer follow-ups");
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Emergency-related request
  // --------------------------------------------------------------------------
  await runTest("12. Emergency request 'What should I do in an emergency?' returns immediate guidance & 112/108", async () => {
    const res = await processAssistantMessage({
      message: "What should I do in an emergency?",
      userLocation: SITABULDI_LOC,
    });

    assert(res.answer.includes("112"), "Must prominently feature 112 emergency number");
    assert(res.items && res.items.helplines && res.items.helplines.length > 0, "Must attach emergency helplines");
    const has112 = res.items.helplines.some((h) => h.number.includes("112") || h.name.includes("112"));
    assert(has112, "Helplines must include 112");
  });

  // --------------------------------------------------------------------------
  // Extra: GlobalSearchBar nearest-hospital fix verification
  // --------------------------------------------------------------------------
  await runTest("13. GlobalSearchBar parseSearchIntent: 'Find the nearest hospital' yields limit=1", async () => {
    const intent = parseSearchIntent("Find the nearest hospital", DHARAMPETH_LOC);
    assert.strictEqual(intent.matchedCategory, "hospital", "Matches hospital category");
    assert.strictEqual(intent.isSuperlative, true, "isSuperlative must be true");
    assert.strictEqual(intent.requestedLimit, 1, "requestedLimit must be 1 for nearest hospital");

    const places = getSortedNearbyServices(NAGPUR_ESSENTIAL_SERVICES, DHARAMPETH_LOC, ["hospital"], intent.requestedLimit);
    assert.strictEqual(places.length, 1, `Expected exactly 1 hospital in search bar, got ${places.length}`);
  });

  await runTest("14. GlobalSearchBar parseSearchIntent: 'Show all hospitals' yields full list", async () => {
    const intent = parseSearchIntent("Show all hospitals in Nagpur", DHARAMPETH_LOC);
    assert.strictEqual(intent.matchedCategory, "hospital");
    assert.strictEqual(intent.isExplicitAll, true, "isExplicitAll must be true");

    const places = getSortedNearbyServices(NAGPUR_ESSENTIAL_SERVICES, DHARAMPETH_LOC, ["hospital"], intent.isExplicitAll ? undefined : intent.requestedLimit);
    assert(places.length >= 10, `Expected full list of hospitals, got ${places.length}`);
  });

  await runTest("15. GlobalSearchBar parseSearchIntent: Unset location flags requiresLocation", async () => {
    const intent = parseSearchIntent("Find the nearest hospital", UNSET_LOC);
    assert.strictEqual(intent.requiresLocation, true, "Must flag requiresLocation = true");
  });

  console.log("\n==================================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Suite execution error:", err);
  process.exit(1);
});
