const assert = require('assert');

async function runTests() {
  console.log("================================================================");
  console.log("  N-SHIELD AI Safety Assistant NLU & Ranking Verification Suite ");
  console.log("================================================================\n");

  const BASE_URL = "http://localhost:3000";
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   ${err.message}`);
      failed++;
    }
  }

  // Location presets for testing
  const USER_LOC_SITABULDI = {
    lat: 21.1489,
    lng: 79.0876,
    label: "Sitabuldi Metro Interchange",
    isUserSet: true,
    source: "gps",
  };

  const USER_LOC_UNSET = {
    lat: 21.1458,
    lng: 79.0882,
    label: "Nagpur Center (Sitabuldi)",
    isUserSet: false,
    source: "default",
  };

  // --------------------------------------------------------------------------
  // TEST 1: "Find the nearest hospital" returns exactly 1 single closest hospital
  // --------------------------------------------------------------------------
  let firstHospital = null;
  let conversationContext = null;

  await test("1. 'Find the nearest hospital' returns single closest hospital with road distance & ETA", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find the nearest hospital",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();

    // Must return single place
    assert(json.items?.places, "Expected items.places to exist");
    assert.strictEqual(json.items.places.length, 1, `Expected exactly 1 hospital, got ${json.items.places.length}`);

    const hospital = json.items.places[0];
    firstHospital = hospital;
    conversationContext = json.contextUpdate;

    assert.strictEqual(hospital.isNearest, true, "isNearest flag must be true");
    assert(hospital.name, "Hospital name must be present");
    assert(hospital.address, "Hospital address must be present");
    assert(hospital.distanceMeters > 0, "Straight-line distance must be > 0");
    assert(hospital.formattedDistance, "Formatted straight-line distance must be present");
    assert(hospital.roadDistanceMeters > hospital.distanceMeters, "Road travel distance should exceed straight-line");
    assert(hospital.formattedRoadDistance.includes("road travel"), "Formatted road distance must specify road travel");
    assert(hospital.estimatedDurationSeconds > 0, "Estimated driving duration must be > 0");
    assert(hospital.formattedDuration, "Formatted duration must be present");

    // Check answer text mentions name and road travel
    assert(json.answer.includes(hospital.name), "Answer must mention hospital name");
    assert(json.contextUpdate?.lastReferencedPlace, "Context update must store lastReferencedPlace");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Conversational follow-up: "What is its phone number?"
  // --------------------------------------------------------------------------
  await test("2. Follow-up 'What is its phone number?' resolves previous hospital", async () => {
    assert(firstHospital, "Pre-requisite: firstHospital must exist from Test 1");

    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is its phone number?",
        userLocation: USER_LOC_SITABULDI,
        context: conversationContext,
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();

    assert(json.answer.includes(firstHospital.name), "Answer must refer to previously referenced hospital");
    if (firstHospital.phone) {
      assert(json.answer.includes(firstHospital.phone), "Answer must include verified phone number");
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3: Conversational follow-up: "Where is it located?"
  // --------------------------------------------------------------------------
  await test("3. Follow-up 'Where is it located?' returns address of previous hospital", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Where is it located?",
        userLocation: USER_LOC_SITABULDI,
        context: conversationContext,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.answer.includes(firstHospital.name), "Must name the hospital");
    assert(json.answer.includes(firstHospital.address), "Must provide the address");
  });

  // --------------------------------------------------------------------------
  // TEST 4: "Show me the 5 nearest hospitals" returns up to 5, sorted ascending
  // --------------------------------------------------------------------------
  await test("4. 'Show me the 5 nearest hospitals' returns at most 5, sorted strictly nearest first", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Show me the 5 nearest hospitals",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const places = json.items?.places;
    assert(Array.isArray(places), "Places array must be returned");
    assert(places.length > 1 && places.length <= 5, `Expected 2-5 hospitals, got ${places.length}`);

    // Verify ascending distance ordering
    for (let i = 1; i < places.length; i++) {
      assert(
        places[i].distanceMeters >= places[i - 1].distanceMeters,
        `Places must be sorted in ascending distance: place[${i}] (${places[i].distanceMeters}m) < place[${i-1}] (${places[i-1].distanceMeters}m)`
      );
    }
    assert.strictEqual(places[0].isNearest, true, "First place must have isNearest: true");
    assert.strictEqual(places[1].isNearest, false, "Subsequent places must not have isNearest: true");
  });

  // --------------------------------------------------------------------------
  // TEST 5: "Find hospitals near me" returns small list (3 items)
  // --------------------------------------------------------------------------
  await test("5. 'Find hospitals near me' returns a small relevant list of 3 hospitals", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find hospitals near me",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const places = json.items?.places;
    assert.strictEqual(places.length, 3, `Expected small list of 3, got ${places.length}`);
  });

  // --------------------------------------------------------------------------
  // TEST 6: "Find hospitals in Dharampeth" searches within specified area
  // --------------------------------------------------------------------------
  await test("6. 'Find hospitals in Dharampeth' resolves locality without requiring GPS", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find hospitals in Dharampeth",
        // even if userLocation is unset, explicit locality should succeed!
        userLocation: USER_LOC_UNSET,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(!json.requiresLocation, "Should not require location because Dharampeth was specified");
    assert(json.items?.places?.length > 0, "Must return hospitals in Dharampeth");
    assert(json.answer.toLowerCase().includes("dharampeth"), "Answer must cite Dharampeth");
  });

  // --------------------------------------------------------------------------
  // TEST 7: Spelling tolerance: "hopital in Dharmapeth"
  // --------------------------------------------------------------------------
  await test("7. Spelling tolerance handles 'hopital in Dharmapeth'", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "hopital in Dharmapeth",
        userLocation: USER_LOC_UNSET,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.places?.length > 0, "Should successfully handle typo in hospital and Dharampeth");
  });

  // --------------------------------------------------------------------------
  // TEST 8: Location Guard: Unset location + no locality prompt for location
  // --------------------------------------------------------------------------
  await test("8. Unset user location with 'Find the nearest hospital' asks user for location without guessing", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find the nearest hospital",
        userLocation: USER_LOC_UNSET, // isUserSet: false
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.strictEqual(json.requiresLocation, true, "Must flag requiresLocation: true");
    assert(json.answer.toLowerCase().includes("location"), "Must prompt for location");
    assert(json.items?.helplines?.length > 0, "Must provide emergency ambulance numbers for immediate safety");
    // Ensure it didn't silently guess Sitabuldi as user location
    assert(!json.items?.places, "Must NOT return a hospital claiming it is nearest when location is unset");
  });

  // --------------------------------------------------------------------------
  // TEST 9: "Which hospitals are open now?" verified opening hours data
  // --------------------------------------------------------------------------
  await test("9. 'Which hospitals are open now?' uses verified 24/7 or schedule data", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Which hospitals are open now?",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.places?.length > 0, "Must return open facilities");
    for (const p of json.items.places) {
      assert(p.is24x7 || p.isOpenNow === true, "Every hospital returned must be 24/7 or verified open");
    }
  });

  // --------------------------------------------------------------------------
  // TEST 10: "Find the closest pharmacy" returns 1 single closest pharmacy
  // --------------------------------------------------------------------------
  await test("10. 'Find the closest pharmacy' returns 1 single closest pharmacy", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find the closest pharmacy",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.places, "Places must be present");
    assert.strictEqual(json.items.places.length, 1, "Must return exactly 1 closest pharmacy");
    assert.strictEqual(json.items.places[0].type, "pharmacy", "Place must be pharmacy");
    assert.strictEqual(json.items.places[0].isNearest, true, "Must have isNearest: true");
  });

  // --------------------------------------------------------------------------
  // TEST 11: Safety Check: No "guaranteed safe" or fabricated claims
  // --------------------------------------------------------------------------
  await test("11. Strict Safety Assertions: No 'guaranteed safe' or 'crime-free' claims", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Is the route to Dharampeth guaranteed safe?",
        userLocation: USER_LOC_SITABULDI,
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const serialized = JSON.stringify(json).toLowerCase();
    assert(!serialized.includes("guaranteed safe"), "CRITICAL: Must NEVER claim guaranteed safe");
    assert(!serialized.includes("definitely safe"), "CRITICAL: Must NEVER claim definitely safe");
    assert(!serialized.includes("crime-free"), "CRITICAL: Must NEVER claim crime-free");
  });

  console.log("\n================================================================");
  console.log(`  Test Run Complete: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});
