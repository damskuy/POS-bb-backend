import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "../lib/ai/ai-insight-generator.service";
import { MockAiInsightProvider } from "../lib/ai/ai-provider";
import { validateActionTarget, AiInsightOutputSchema, normalizeAiOutput } from "../lib/ai/ai-insight-schema";
import { generateDeterministicFallback } from "../lib/ai/ai-fallback-generator";
import { AiInsightCache } from "../lib/ai/ai-insight-cache";
import { prisma } from "../lib/prisma";

async function runAi2aPriorityActionsTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-2A — PRIORITIZED ACTION LIST TESTS");
  console.log("==================================================");

  // Clear cache and reset provider override
  AiInsightCache.clear();
  AiInsightGeneratorService.setCustomProvider(null);

  const sampleData = await getAiInsightData("2026-07-01", "2026-07-31");

  // --------------------------------------------------
  // TEST 1: Fallback Generator produces valid Priority Actions (max 3, 1-based, sorted)
  // --------------------------------------------------
  console.log("\n[Test 1] Fallback Priority Actions Generation test");
  const fallbackOutput = generateDeterministicFallback(sampleData);
  
  if (!fallbackOutput.priorityActions || fallbackOutput.priorityActions.length === 0) {
    throw new Error("Test 1 Failed: Fallback output does not contain priorityActions!");
  }
  if (fallbackOutput.priorityActions.length > 3) {
    throw new Error(`Test 1 Failed: priorityActions count exceeds 3 -> got ${fallbackOutput.priorityActions.length}`);
  }
  fallbackOutput.priorityActions.forEach((act, idx) => {
    if (act.priority !== idx + 1) {
      throw new Error(`Test 1 Failed: Action priority expected ${idx + 1}, got ${act.priority}`);
    }
  });
  console.log(`✓ Test 1 Passed: Fallback generated ${fallbackOutput.priorityActions.length} valid priority actions.`);

  // --------------------------------------------------
  // TEST 2: Whitelisted actionTarget Routes & Settings Route Support
  // --------------------------------------------------
  console.log("\n[Test 2] Whitelisted actionTarget Routes test");
  const allowedRoutes = ["/customers", "/inventory", "/reports", "/work-orders", "/whatsapp", "/settings"];
  for (const route of allowedRoutes) {
    const validated = validateActionTarget(route);
    if (validated !== route) {
      throw new Error(`Test 2 Failed: Expected ${route} to be allowed, got ${validated}`);
    }
  }
  console.log("✓ Test 2 Passed: All required route targets including /settings are allowed.");

  // --------------------------------------------------
  // TEST 3: Rejection of Malicious / External URLs
  // --------------------------------------------------
  console.log("\n[Test 3] Rejection of Malicious External URLs test");
  const maliciousTargets = [
    "http://phishing.com/login",
    "https://malicious-site.org",
    "javascript:alert(1)",
    "data:text/html;base64,12345",
    "//external-domain.com",
    "/unauthorized-route-xyz",
  ];
  for (const target of maliciousTargets) {
    const validated = validateActionTarget(target);
    if (validated !== null) {
      throw new Error(`Test 3 Failed: Target '${target}' was NOT rejected! Got: ${validated}`);
    }
  }
  console.log("✓ Test 3 Passed: External URLs, javascript protocols, and unapproved routes are correctly rejected.");

  // --------------------------------------------------
  // TEST 4: AI Output Normalization (Truncates > 3 items, sanitizes actionTarget, re-indexes priority)
  // --------------------------------------------------
  console.log("\n[Test 4] AI Output Normalization test");
  const mockOverLimitOutput = {
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
        priority: 10,
        title: "Action 1",
        description: "Desc 1",
        impact: "HIGH",
        reason: "Reason 1",
        actionLabel: "Action 1",
        actionTarget: "https://evil.com/leak",
      },
      {
        priority: 20,
        title: "Action 2",
        description: "Desc 2",
        impact: "MEDIUM",
        estimatedRevenue: 1500000,
        reason: "Reason 2",
        actionLabel: "Action 2",
        actionTarget: "/customers",
      },
      {
        priority: 30,
        title: "Action 3",
        description: "Desc 3",
        impact: "LOW",
        reason: "Reason 3",
        actionLabel: "Action 3",
        actionTarget: "/inventory",
      },
      {
        priority: 40,
        title: "Action 4 (Exceeded)",
        description: "Desc 4",
        impact: "LOW",
        reason: "Reason 4",
        actionLabel: "Action 4",
        actionTarget: "/work-orders",
      },
    ],
    confidence: "HIGH",
    dataQuality: { status: "SUFFICIENT", note: null },
  };

  const safeOutput = normalizeAiOutput(mockOverLimitOutput);

  if (!safeOutput || !safeOutput.priorityActions) {
    throw new Error("Test 4 Failed: normalizeAiOutput returned null or missing priorityActions!");
  }
  const actions = safeOutput.priorityActions;
  if (actions.length !== 3) {
    throw new Error(`Test 4 Failed: Expected 3 priorityActions, got ${actions.length}`);
  }
  if (actions[0].priority !== 1 || actions[1].priority !== 2 || actions[2].priority !== 3) {
    throw new Error("Test 4 Failed: Priority numbers were not re-indexed to 1, 2, 3!");
  }
  if (actions[0].actionTarget !== null) {
    throw new Error(`Test 4 Failed: Malicious actionTarget on Action 1 was not sanitized to null! Got: ${actions[0].actionTarget}`);
  }
  if (actions[1].actionTarget !== "/customers") {
    throw new Error(`Test 4 Failed: Valid actionTarget /customers was changed! Got: ${actions[1].actionTarget}`);
  }
  console.log("✓ Test 4 Passed: AI Output correctly truncated to max 3 items, priorities re-indexed 1..3, and actionTargets sanitized.");

  // --------------------------------------------------
  // TEST 5: Full Service Integration with Mock Provider returning priorityActions
  // --------------------------------------------------
  console.log("\n[Test 5] Full Service Integration test");
  const mockProvider = new MockAiInsightProvider({
    mockOutput: {
      summary: "AI Service Insight with Priority Actions.",
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
        },
      ],
      confidence: "HIGH",
      dataQuality: { status: "SUFFICIENT", note: null },
    },
  });

  AiInsightGeneratorService.setCustomProvider(mockProvider);

  const serviceRes = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "mock", model: "mock-v1" });

  if (serviceRes.meta.source !== "AI") {
    throw new Error(`Test 5 Failed: Expected source AI, got ${serviceRes.meta.source}`);
  }
  const sActions = serviceRes.output.priorityActions;
  if (!sActions || sActions.length !== 1) {
    throw new Error("Test 5 Failed: priorityActions missing or count mismatch in service response");
  }
  if (sActions[0].estimatedRevenue !== 2100000) {
    throw new Error(`Test 5 Failed: estimatedRevenue mismatch -> got ${sActions[0].estimatedRevenue}`);
  }
  console.log("✓ Test 5 Passed: Service integration returns validated priorityActions structure.");

  // --------------------------------------------------
  // TEST 6: AI Disabled Mode returns Deterministic Fallback with priorityActions
  // --------------------------------------------------
  console.log("\n[Test 6] AI Disabled Mode test");
  const disabledRes = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });

  if (disabledRes.meta.source !== "FALLBACK" || disabledRes.meta.fallbackReason !== "AI_DISABLED") {
    throw new Error(`Test 6 Failed: Expected FALLBACK / AI_DISABLED, got ${JSON.stringify(disabledRes.meta)}`);
  }
  if (!disabledRes.output.priorityActions || disabledRes.output.priorityActions.length === 0) {
    throw new Error("Test 6 Failed: Disabled mode fallback missing priorityActions!");
  }
  console.log("✓ Test 6 Passed: AI Disabled mode returns deterministic priority actions.");

  // --------------------------------------------------
  // TEST 7: Backward Compatibility (Summary, Highlights, Recommendation unchanged)
  // --------------------------------------------------
  console.log("\n[Test 7] Backward Compatibility test");
  if (!disabledRes.output.summary || !disabledRes.output.highlights || !disabledRes.output.recommendation) {
    throw new Error("Test 7 Failed: Existing fields (summary, highlights, recommendation) are missing!");
  }
  console.log("✓ Test 7 Passed: Summary, Highlights, and Recommendation structures remain 100% intact.");

  // Reset override & clear cache
  AiInsightGeneratorService.setCustomProvider(null);
  AiInsightCache.clear();

  console.log("\n==================================================");
  console.log("ALL FASE AI-2A PRIORITY ACTIONS TESTS PASSED!");
  console.log("==================================================");
}

runAi2aPriorityActionsTests()
  .catch((err) => {
    console.error("\n❌ FASE AI-2A TESTING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
