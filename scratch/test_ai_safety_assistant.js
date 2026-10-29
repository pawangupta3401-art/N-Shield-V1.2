const assert = require('assert');

async function runTestSuite() {
  console.log("=================================================");
  console.log("  N-SHIELD AI Safety Assistant Verification Suite");
  console.log("=================================================\n");

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

  const BASE_URL = "http://localhost:3000";

  // --- API TEST 1: /api/emergency ---
  await test("GET /api/emergency returns 200 and verified directory including 112", async () => {
    const res = await fetch(`${BASE_URL}/api/emergency`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Expected data to be an array");
    assert(json.total >= 10, "Expected at least 10 helplines");
    const h112 = json.data.find(h => h.number === "112");
    assert(h112, "Helpline 112 must be present");
    assert.strictEqual(h112.activeStatus, "verified_active");
    assert(h112.sourceUrl, "Source URL must exist");
  });

  // --- API TEST 2: /api/places ---
  await test("GET /api/places returns valid hospitals sorted by distance", async () => {
    const res = await fetch(`${BASE_URL}/api/places?lat=21.1458&lng=79.0882&type=hospital&limit=5`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.data), "Expected places array");
    assert(json.data.length > 0, "Expected at least 1 hospital");
    // Verify distance sorting
    for (let i = 1; i < json.data.length; i++) {
      assert(json.data[i].distanceMeters >= json.data[i - 1].distanceMeters, "Places must be sorted by distance");
    }
  });

  // --- API TEST 3: /api/places coordinate validation ---
  await test("GET /api/places rejects invalid coordinates with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/places?lat=999&lng=79.0882&type=hospital`);
    assert.strictEqual(res.status, 400, "Expected 400 for out-of-bounds latitude");
  });

  // --- API TEST 4: /api/places service type validation ---
  await test("GET /api/places rejects invalid service type with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/places?lat=21.1458&lng=79.0882&type=nightclub`);
    assert.strictEqual(res.status, 400, "Expected 400 for invalid service type");
  });

  // --- API TEST 5: /api/routes ---
  await test("POST /api/routes calculates route corridor with distance and duration", async () => {
    const res = await fetch(`${BASE_URL}/api/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: "Sitabuldi", destination: "Dharampeth" }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json.routes) && json.routes.length >= 2, "Expected at least 2 alternative routes");
    const r1 = json.routes[0];
    assert(r1.distanceMeters > 0, "Distance must be > 0");
    assert(r1.durationSeconds > 0, "Duration must be > 0");
    assert(r1.safetyAssessment, "Route must contain safety assessment");
    // Check mandatory disclaimer
    assert(r1.safetyAssessment.disclaimer.includes("does not guarantee safety"), "Must contain mandatory safety disclaimer");
  });

  // --- API TEST 6: /api/safety ---
  await test("POST /api/safety evaluates incident evidence and enforces safety disclaimer", async () => {
    const geom = [[21.1489, 79.0876], [21.1415, 79.0535]];
    const res = await fetch(`${BASE_URL}/api/safety`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ geometry: geom, distanceMeters: 4500 }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.assessment, "Expected assessment in response");
    assert(json.assessment.coverage, "Coverage must be specified");
    assert(Array.isArray(json.assessment.limitations), "Limitations array must be present");
    assert(json.assessment.disclaimer, "Disclaimer must be present");
    // CRITICAL RULE CHECK: Never claim guaranteed safe
    const serialized = JSON.stringify(json).toLowerCase();
    assert(!serialized.includes("guaranteed safe"), "CRITICAL: Must NEVER claim guaranteed safe");
    assert(!serialized.includes("definitely safe"), "CRITICAL: Must NEVER claim definitely safe");
    assert(!serialized.includes("crime-free"), "CRITICAL: Must NEVER claim crime-free");
  });

  // --- API TEST 7: /api/assistant empty message validation ---
  await test("POST /api/assistant rejects empty message with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });
    assert.strictEqual(res.status, 400, "Expected 400 for empty message");
  });

  // --- API TEST 8: /api/assistant emergency query ---
  await test("POST /api/assistant returns verified helplines for emergency inquiry", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What emergency number should I call?" }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.answer.includes("112"), "Must highlight 112 in answer");
    assert(json.items?.helplines?.length > 0, "Must return helpline cards");
    assert(json.sourceMetadata.sourcesUsed.length > 0, "Must include source metadata");
  });

  // --- API TEST 9: /api/assistant nearby hospital query ---
  await test("POST /api/assistant returns structured places with verified phone numbers", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find a 24-hour hospital near me",
        userLocation: { lat: 21.1458, lng: 79.0882, isUserSet: true, source: "gps" },
      }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.items?.places?.length > 0, "Must return structured place items");
    const p1 = json.items.places[0];
    assert(p1.phone, "Phone number must be present");
    assert(p1.formattedDistance, "Distance must be present");
    assert.strictEqual(p1.type, "hospital");
  });

  // --- API TEST 10: /api/assistant route comparison query ---
  await test("POST /api/assistant compares routes with disclaimer and no false guarantees", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Calculate a route from Sitabuldi to Dharampeth" }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.items?.routes?.length >= 2, "Must return at least 2 routes for comparison");
    assert(json.answer.includes("does not guarantee safety"), "Answer must contain safety disclaimer");
    const serialized = JSON.stringify(json).toLowerCase();
    assert(!serialized.includes("guaranteed safe"), "CRITICAL: Must NEVER claim guaranteed safe");
    assert(!serialized.includes("crime-free"), "CRITICAL: Must NEVER claim crime-free");
  });

  // --- API TEST 11: /api/assistant news query ---
  await test("POST /api/assistant retrieves grounded Nagpur safety news", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What safety news is happening in Nagpur?" }),
    });
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(json.sourceMetadata.sourcesUsed.length > 0, "Must include sources");
    assert(json.items?.news?.length > 0 || json.answer.length > 20, "Must provide answer or news items");
  });

  console.log("\n=================================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
