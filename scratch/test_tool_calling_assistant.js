const assert = require('assert');

async function testToolsAndAgent() {
  console.log("================================================================");
  console.log("  N-SHIELD AI Assistant: Tool Calling & Agentic Verification    ");
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

  // 1. Tool execution via /api/assistant: Nearest Hospital intent
  await test("1. Natural-language 'Find the nearest hospital' activates single-result tool selection", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find the nearest hospital",
        userLocation: {
          lat: 21.1489,
          lng: 79.0876,
          label: "Sitabuldi Metro Interchange",
          isUserSet: true,
          source: "gps",
        },
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.places, "Items.places must exist");
    assert.strictEqual(json.items.places.length, 1, "Must return exactly 1 facility for nearest query");
    assert.strictEqual(json.items.places[0].isNearest, true, "isNearest flag must be true");
    assert(json.items.places[0].phone, "Phone must be present");
    assert(json.items.places[0].address, "Address must be present");
    assert(json.items.places[0].roadDistanceMeters > 0, "Road distance must be calculated");
    assert(json.items.places[0].formattedDuration, "Transit ETA must be present");
  });

  // 2. Tool execution: Police station closest to Sitabuldi
  await test("2. 'Which police station is closest to Sitabuldi?' resolves locality & returns 1 nearest police station", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Which police station is closest to Sitabuldi?",
        userLocation: {
          lat: 21.1458,
          lng: 79.0882,
          isUserSet: false,
        },
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.places, "Places must be returned");
    assert.strictEqual(json.items.places.length, 1, "Must return single closest police station");
    assert.strictEqual(json.items.places[0].type, "police_station", "Service type must be police_station");
    assert(json.answer.toLowerCase().includes("sitabuldi"), "Answer must cite Sitabuldi");
  });

  // 3. Multi-turn conversation history forwarding
  await test("3. Conversational multi-turn context: 'What is its phone number?' resolves previous facility", async () => {
    // Step 1: Query hospital
    const res1 = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find the nearest hospital",
        userLocation: { lat: 21.1489, lng: 79.0876, isUserSet: true, source: "gps" },
      }),
    });
    const json1 = await res1.json();
    const hospital = json1.items.places[0];

    // Step 2: Query phone number with history & context
    const res2 = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is its phone number?",
        userLocation: { lat: 21.1489, lng: 79.0876, isUserSet: true, source: "gps" },
        context: json1.contextUpdate,
        history: [
          { role: "user", text: "Find the nearest hospital" },
          { role: "assistant", text: json1.answer },
        ],
      }),
    });

    assert.strictEqual(res2.status, 200);
    const json2 = await res2.json();
    assert(json2.answer.includes(hospital.name), "Answer must name the referenced hospital");
    if (hospital.phone) {
      assert(json2.answer.includes(hospital.phone), "Answer must include verified phone number");
    }
  });

  // 4. Tool execution: Route calculation with incident data
  await test("4. 'Compare these routes using available recent incident data' evaluates corridors with safety disclaimer", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Compare routes from Sitabuldi to Dharampeth using available incident data",
        userLocation: { lat: 21.1489, lng: 79.0876, isUserSet: true, source: "gps" },
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert(json.items?.routes?.length >= 2, "Must return at least 2 corridors");
    assert(json.items?.incidents, "Incident evidence must be attached");
    assert(json.answer.includes("does not guarantee safety"), "Must enforce safety disclaimer");
  });

  // 5. Tool execution: Unset location guard
  await test("5. Unset location triggers request_user_location without guessing Nagpur center", async () => {
    const res = await fetch(`${BASE_URL}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Find a pharmacy near me",
        userLocation: { lat: 21.1458, lng: 79.0882, isUserSet: false, source: "default" },
      }),
    });

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.requiresLocation, true, "requiresLocation flag must be true");
    assert(json.items?.helplines?.length > 0, "Emergency helplines must be returned for safety");
    assert(!json.items?.places, "Places must NOT be invented without valid location reference");
  });

  console.log("\n================================================================");
  console.log(`  Agentic Tests Complete: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================");

  if (failed > 0) process.exit(1);
}

testToolsAndAgent().catch(err => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});
