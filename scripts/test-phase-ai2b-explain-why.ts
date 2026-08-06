import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "../lib/ai/ai-insight-generator.service";
import { MockAiInsightProvider, buildAiPrompt } from "../lib/ai/ai-provider";
import { normalizeAiOutput, validateActionTarget } from "../lib/ai/ai-insight-schema";
import { generateDeterministicFallback } from "../lib/ai/ai-fallback-generator";
import { AiInsightCache } from "../lib/ai/ai-insight-cache";
import { prisma } from "../lib/prisma";

async function runAi2bExplainWhyTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-2B — EXPLAIN WHY TESTS");
  console.log("==================================================");

  // Clear cache and reset provider override
  AiInsightCache.clear();
  AiInsightGeneratorService.setCustomProvider(null);

  const sampleData = await getAiInsightData("2026-07-01", "2026-07-31");

  // --------------------------------------------------
  // TEST 1: Fallback Generator produces valid Explanation & Priority Action Why
  // --------------------------------------------------
  console.log("\n[Test 1] Fallback Explanation & Why test");
  const fallbackOutput = generateDeterministicFallback(sampleData);

  if (!fallbackOutput.explanation) {
    throw new Error("Test 1 Failed: Fallback output missing global explanation object!");
  }
  if (!fallbackOutput.explanation.title || !fallbackOutput.explanation.summary || !fallbackOutput.explanation.evidence) {
    throw new Error("Test 1 Failed: Fallback explanation structure incomplete!");
  }
  if (fallbackOutput.explanation.evidence.length > 5) {
    throw new Error(`Test 1 Failed: Fallback evidence count > 5 -> got ${fallbackOutput.explanation.evidence.length}`);
  }
  
  const actions = fallbackOutput.priorityActions || [];
  actions.forEach((act, idx) => {
    if (!act.why || !act.why.summary || !act.why.evidence || act.why.evidence.length === 0) {
      throw new Error(`Test 1 Failed: Priority action #${idx + 1} missing 'why' object or evidence!`);
    }
  });
  console.log(`✓ Test 1 Passed: Fallback generated global explanation with ${fallbackOutput.explanation.evidence.length} evidence items and 'why' for each priority action.`);

  // --------------------------------------------------
  // TEST 2: Evidence Cap (Maximum 5 items truncation)
  // --------------------------------------------------
  console.log("\n[Test 2] Evidence Truncation (Max 5 items) test");
  const excessEvidenceMock = {
    summary: "Mock summary text for testing.",
    highlights: [
      { type: "positive", title: "H1", description: "D1" },
    ],
    recommendation: {
      title: "Rec Title",
      description: "Rec Desc",
      actionLabel: "Lihat Reports",
      actionTarget: "/reports",
    },
    priorityActions: [
      {
        priority: 1,
        title: "Action 1",
        description: "Desc 1",
        impact: "HIGH",
        reason: "Reason 1",
        actionLabel: "Action 1",
        actionTarget: "/customers",
        why: {
          summary: "Why summary 1",
          evidence: ["Ev 1", "Ev 2"],
        },
      },
    ],
    explanation: {
      title: "Mengapa AI memberikan rekomendasi ini?",
      summary: "Excess evidence test summary",
      evidence: [
        { label: "L1", value: "V1", interpretation: "I1" },
        { label: "L2", value: "V2", interpretation: "I2" },
        { label: "L3", value: "V3", interpretation: "I3" },
        { label: "L4", value: "V4", interpretation: "I4" },
        { label: "L5", value: "V5", interpretation: "I5" },
        { label: "L6 (Excess)", value: "V6", interpretation: "I6" },
        { label: "L7 (Excess)", value: "V7", interpretation: "I7" },
      ],
    },
    confidence: "HIGH",
    dataQuality: { status: "SUFFICIENT", note: null },
  };

  const safeOutput = normalizeAiOutput(excessEvidenceMock);
  if (!safeOutput || !safeOutput.explanation) {
    throw new Error("Test 2 Failed: normalizeAiOutput returned null or missing explanation!");
  }
  if (safeOutput.explanation.evidence.length !== 5) {
    throw new Error(`Test 2 Failed: Expected evidence count 5, got ${safeOutput.explanation.evidence.length}`);
  }
  console.log("✓ Test 2 Passed: Excess evidence (>5 items) correctly capped at 5 items.");

  // --------------------------------------------------
  // TEST 3: Zero PII in Evidence & Prompt Payload
  // --------------------------------------------------
  console.log("\n[Test 3] Zero PII Audit");
  const promptPayload = buildAiPrompt(sampleData);
  const piiRegexes = [
    /081[0-9]{7,10}/,
    /628[0-9]{7,10}/,
    /"phone"/i,
    /"address"/i,
    /"customerName"/i,
    /"vehiclePlate"/i,
  ];

  for (const regex of piiRegexes) {
    if (regex.test(promptPayload)) {
      throw new Error(`Test 3 Failed: PII detected matching ${regex} in prompt payload!`);
    }
  }

  // Check evidence text in fallback
  for (const item of safeOutput.explanation.evidence) {
    for (const regex of piiRegexes) {
      if (regex.test(item.label) || regex.test(item.value) || regex.test(item.interpretation)) {
        throw new Error(`Test 3 Failed: PII detected matching ${regex} in explanation evidence!`);
      }
    }
  }
  console.log("✓ Test 3 Passed: ZERO PII found in prompt payload or explanation evidence.");

  // --------------------------------------------------
  // TEST 4: Full Service Integration with Mock Provider returning Explanation
  // --------------------------------------------------
  console.log("\n[Test 4] Full Service Integration test");
  const mockProvider = new MockAiInsightProvider({
    mockOutput: {
      summary: "AI Service Insight with Explanation and Why.",
      highlights: [
        { type: "positive", title: "Revenue Up", description: "10% increase" },
      ],
      recommendation: {
        title: "Focus on Services",
        description: "Promote tune up package.",
        actionLabel: "Lihat Reports",
        actionTarget: "/reports",
      },
      priorityActions: [
        {
          priority: 1,
          title: "Hubungi pelanggan inaktif",
          description: "7 pelanggan belum kembali selama 6 bulan.",
          impact: "HIGH",
          estimatedRevenue: 2100000,
          reason: "Repeat customer memiliki peluang konversi tertinggi.",
          actionLabel: "Lihat Pelanggan",
          actionTarget: "/customers",
          why: {
            summary: "Pelanggan inaktif merupakan sumber omzet terbaik.",
            evidence: ["7 pelanggan belum kembali"],
          },
        },
      ],
      explanation: {
        title: "Mengapa AI memberikan rekomendasi ini?",
        summary: "Penyebab utama adalah tren retensi pelanggan.",
        evidence: [
          { label: "Inactive", value: "7", interpretation: "Retensi dapat ditingkatkan." },
        ],
      },
      confidence: "HIGH",
      dataQuality: { status: "SUFFICIENT", note: null },
    },
  });

  AiInsightGeneratorService.setCustomProvider(mockProvider);

  const serviceRes = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "mock", model: "mock-v1" });

  if (serviceRes.meta.source !== "AI") {
    throw new Error(`Test 4 Failed: Expected source AI, got ${serviceRes.meta.source}`);
  }
  if (!serviceRes.output.explanation || serviceRes.output.explanation.evidence.length !== 1) {
    throw new Error("Test 4 Failed: Service response explanation missing or evidence mismatch");
  }
  const actWhy = serviceRes.output.priorityActions?.[0]?.why;
  if (!actWhy || actWhy.summary !== "Pelanggan inaktif merupakan sumber omzet terbaik.") {
    throw new Error(`Test 4 Failed: priorityAction.why mismatch -> got ${JSON.stringify(actWhy)}`);
  }
  console.log("✓ Test 4 Passed: Full service integration returns validated explanation & why structure.");

  // --------------------------------------------------
  // TEST 5: AI Disabled Mode returns Deterministic Fallback with Explanation
  // --------------------------------------------------
  console.log("\n[Test 5] AI Disabled Mode test");
  const disabledRes = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });

  if (disabledRes.meta.source !== "FALLBACK" || disabledRes.meta.fallbackReason !== "AI_DISABLED") {
    throw new Error(`Test 5 Failed: Expected FALLBACK / AI_DISABLED, got ${JSON.stringify(disabledRes.meta)}`);
  }
  if (!disabledRes.output.explanation) {
    throw new Error("Test 5 Failed: AI Disabled mode missing explanation object!");
  }
  console.log("✓ Test 5 Passed: AI Disabled mode returns deterministic explanation and evidence.");

  // --------------------------------------------------
  // TEST 6: Route Whitelist & Cache Verification
  // --------------------------------------------------
  console.log("\n[Test 6] Route Whitelist & Cache Verification");
  if (validateActionTarget("https://malicious.com") !== null) {
    throw new Error("Test 6 Failed: Malicious actionTarget was not rejected!");
  }
  const cachedRes = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "mock", model: "mock-v1" });
  if (cachedRes.meta.source !== "AI" || cachedRes.meta.providerCalled !== false) {
    throw new Error(`Test 6 Failed: Expected cache hit (providerCalled=false), got ${JSON.stringify(cachedRes.meta)}`);
  }
  console.log("✓ Test 6 Passed: Route whitelist and cache system continue operating flawlessly.");

  // Reset override & clear cache
  AiInsightGeneratorService.setCustomProvider(null);
  AiInsightCache.clear();

  console.log("\n==================================================");
  console.log("ALL FASE AI-2B EXPLAIN WHY TESTS PASSED!");
  console.log("==================================================");
}

runAi2bExplainWhyTests()
  .catch((err) => {
    console.error("\n❌ FASE AI-2B TESTING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
