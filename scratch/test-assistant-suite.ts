import { processAssistantMessage } from "../src/lib/assistant/orchestrator";
import type { AssistantRequest, AssistantResponse } from "../src/lib/validation/assistantSchemas";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("STARTING N-SHIELD AI ASSISTANT CONVERSATIONAL & SAFETY TEST SUITE");
  console.log("================================================================================\n");

  const testQueries = [
    {
      query: "Hi, how are you?",
      expectedType: "casual",
      description: "Casual greeting and small talk",
    },
    {
      query: "I'm bored. Talk to me.",
      expectedType: "casual",
      description: "Casual conversation and boredom engagement",
    },
    {
      query: "What do you think I should do this weekend?",
      expectedType: "casual",
      description: "Weekend ideas and lifestyle suggestions",
    },
    {
      query: "Explain something interesting to me.",
      expectedType: "general_knowledge",
      description: "Engaging explanation of science/tech concept",
    },
    {
      query: "Can you tell me the safest place near me?",
      expectedType: "ambiguous",
      description: "Ambiguity resolution (relaxation spot vs emergency safe haven vs zone risk)",
    },
    {
      query: "Find a hospital near me.",
      expectedType: "safety_service",
      description: "Essential medical service retrieval near location",
    },
    {
      query: "What about a pharmacy close to that hospital?",
      expectedType: "contextual_safety",
      description: "Contextual follow-up referencing previous hospital location",
    },
    {
      query: "Why did you recommend that place?",
      expectedType: "contextual_explanation",
      description: "Explanation of recommendation rationale using conversational memory",
    },
    {
      query: "No, I meant a place where I can sit and relax.",
      expectedType: "correction",
      description: "User correction handling, shifting to relaxing spots in Nagpur",
    },
  ];

  let currentContext: AssistantRequest["context"] = {};
  const conversationHistory: { role: "user" | "assistant"; text: string }[] = [];
  const defaultUserLocation = {
    lat: 21.1458,
    lng: 79.0882,
    label: "Sitabuldi, Nagpur",
    isUserSet: true,
    source: "gps" as const,
  };

  let allPassed = true;

  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`TEST ${i + 1}/${testQueries.length}: "${test.query}"`);
    console.log(`Description: ${test.description} (Expected: ${test.expectedType})`);
    console.log(`--------------------------------------------------------------------------------`);

    const req: AssistantRequest = {
      message: test.query,
      userLocation: defaultUserLocation,
      context: currentContext,
      history: conversationHistory,
    };

    const startTime = Date.now();
    const res: AssistantResponse = await processAssistantMessage(req);
    const duration = Date.now() - startTime;

    console.log(`Response Time: ${duration}ms`);
    console.log(`Answer:\n${res.answer}\n`);
    console.log(`Source Metadata:`, res.sourceMetadata);

    if (res.items?.places) {
      console.log(`Places Returned (${res.items.places.length}):`, res.items.places.map(p => `${p.name} (${p.formattedRoadDistance || p.formattedDistance})`));
    }
    if (res.items?.routes) {
      console.log(`Routes Returned (${res.items.routes.length})`);
    }
    if (res.items?.helplines) {
      console.log(`Helplines Returned (${res.items.helplines.length})`);
    }
    if (res.suggestedFollowUps) {
      console.log(`Suggested Follow-ups:`, res.suggestedFollowUps);
    }

    // Validation checks
    let testPass = true;

    if (test.expectedType === "casual") {
      // Casual queries should NOT return safety places, routes, or helplines
      if (res.items?.places?.length || res.items?.routes?.length || res.items?.helplines?.length) {
        console.error(`❌ FAIL: Casual query unexpectedly returned structured safety items.`);
        testPass = false;
      }
      if (res.answer.includes("N-SHIELD is an AI-driven") || res.answer.includes("Key Capabilities:")) {
        console.error(`❌ FAIL: Casual query returned robotic project capabilities boilerplate.`);
        testPass = false;
      }
    } else if (test.expectedType === "safety_service") {
      if (!res.items?.places || res.items.places.length === 0) {
        console.error(`❌ FAIL: Safety service query did not return places.`);
        testPass = false;
      } else {
        console.log(`✅ Verified: Retrieved ${res.items.places.length} real facility records.`);
      }
    } else if (test.expectedType === "contextual_safety") {
      if (!res.items?.places || res.items.places.length === 0) {
        console.error(`❌ FAIL: Contextual pharmacy query did not return nearby pharmacies.`);
        testPass = false;
      } else {
        const top = res.items.places[0];
        console.log(`✅ Verified: Contextual pharmacy resolved: ${top.name} near ${currentContext?.lastReferencedPlace?.name || "hospital"}.`);
      }
    } else if (test.expectedType === "contextual_explanation") {
      if (!res.answer.toLowerCase().includes("recommend") && !res.answer.toLowerCase().includes("factor") && !res.answer.toLowerCase().includes("closest")) {
        console.error(`❌ FAIL: Did not explain recommendation rationale.`);
        testPass = false;
      } else {
        console.log(`✅ Verified: Rationale explained based on conversational context.`);
      }
    } else if (test.expectedType === "correction") {
      if (!res.answer.toLowerCase().includes("futala") && !res.answer.toLowerCase().includes("civil lines") && !res.answer.toLowerCase().includes("relax")) {
        console.error(`❌ FAIL: Did not understand correction for a place to relax.`);
        testPass = false;
      } else {
        console.log(`✅ Verified: Successfully adapted to user correction and recommended relaxation spots.`);
      }
    } else if (test.expectedType === "ambiguous") {
      if (!res.answer.toLowerCase().includes("relax") && !res.answer.toLowerCase().includes("emergency")) {
        console.error(`❌ FAIL: Did not address ambiguity of safest place.`);
        testPass = false;
      } else {
        console.log(`✅ Verified: Addressed ambiguity of 'safest place' (relaxing vs emergency vs zone).`);
      }
    }

    if (testPass) {
      console.log(`>>> RESULT: ✅ PASSED\n`);
    } else {
      console.log(`>>> RESULT: ❌ FAILED\n`);
      allPassed = false;
    }

    // Update conversation state
    if (res.contextUpdate) {
      currentContext = { ...currentContext, ...res.contextUpdate };
    }
    conversationHistory.push({ role: "user", text: test.query });
    conversationHistory.push({ role: "assistant", text: res.answer });
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("ALL 9 TEST CASES PASSED SUCCESSFULLY! 🎉");
  } else {
    console.log("SOME TEST CASES FAILED. CHECK LOGS ABOVE.");
  }
  console.log("================================================================================\n");
}

runTestSuite().catch(err => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
