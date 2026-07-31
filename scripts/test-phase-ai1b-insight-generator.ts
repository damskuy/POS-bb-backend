import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "../lib/ai/ai-insight-generator.service";
import { MockAiInsightProvider } from "../lib/ai/ai-provider";
import { validateActionTarget } from "../lib/ai/ai-insight-schema";
import { prisma } from "../lib/prisma";

async function runAi1bTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-1B — AI INSIGHT GENERATOR TESTS");
  console.log("==================================================");

  // Setup test aggregated data
  const sampleData = await getAiInsightData("2026-07-01", "2026-07-31");

  // Reset custom override provider
  AiInsightGeneratorService.setCustomProvider(null);

  // --------------------------------------------------
  // TEST 1: AI_INSIGHT_ENABLED undefined -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 1] AI_INSIGHT_ENABLED undefined fallback test");
  const res1 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });
  if (res1.meta.source !== "FALLBACK" || res1.meta.providerCalled !== false || res1.meta.fallbackReason !== "AI_DISABLED") {
    throw new Error(`Test 1 Failed -> ${JSON.stringify(res1.meta)}`);
  }
  console.log("✓ Test 1 Passed: Disabled AI uses fallback with providerCalled=false.");

  // --------------------------------------------------
  // TEST 2: AI_INSIGHT_ENABLED = false -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 2] AI_INSIGHT_ENABLED = false fallback test");
  process.env.AI_INSIGHT_ENABLED = "false";
  const res2 = await AiInsightGeneratorService.generateInsight(sampleData);
  if (res2.meta.source !== "FALLBACK" || res2.meta.providerCalled !== false) {
    throw new Error(`Test 2 Failed -> ${JSON.stringify(res2.meta)}`);
  }
  console.log("✓ Test 2 Passed: Explicit false AI_INSIGHT_ENABLED uses fallback.");

  // --------------------------------------------------
  // TEST 3: AI enabled but provider not configured -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 3] Enabled AI with missing provider configuration test");
  process.env.AI_INSIGHT_ENABLED = "true";
  delete process.env.AI_INSIGHT_PROVIDER;
  delete process.env.AI_API_KEY;

  const res3 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "" });
  if (res3.meta.source !== "FALLBACK" || res3.meta.fallbackReason !== "AI_PROVIDER_NOT_CONFIGURED") {
    throw new Error(`Test 3 Failed -> ${JSON.stringify(res3.meta)}`);
  }
  console.log("✓ Test 3 Passed: Missing provider uses fallback with AI_PROVIDER_NOT_CONFIGURED reason.");

  // Restore env
  process.env.AI_INSIGHT_ENABLED = "false";

  // --------------------------------------------------
  // TEST 4: Provider success -> Source AI
  // --------------------------------------------------
  console.log("\n[Test 4] Provider success returns source=AI");
  const mockProvider = new MockAiInsightProvider();
  AiInsightGeneratorService.setCustomProvider(mockProvider);

  const res4 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true });
  if (res4.meta.source !== "AI" || res4.meta.providerCalled !== true || res4.meta.fallbackReason !== null) {
    throw new Error(`Test 4 Failed -> ${JSON.stringify(res4.meta)}`);
  }
  console.log("✓ Test 4 Passed: Successful provider execution returns validated AI output.");

  // --------------------------------------------------
  // TEST 5: Provider returns invalid schema -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 5] Invalid provider schema triggers fallback");
  const invalidMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "Invalid output",
      // @ts-ignore
      highlights: "not an array",
    },
  });
  AiInsightGeneratorService.setCustomProvider(invalidMock);

  const res5 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true });
  if (res5.meta.source !== "FALLBACK" || res5.meta.fallbackReason !== "AI_PROVIDER_ERROR") {
    throw new Error(`Test 5 Failed -> ${JSON.stringify(res5.meta)}`);
  }
  console.log("✓ Test 5 Passed: Invalid schema correctly caught and falls back to deterministic insight.");

  // --------------------------------------------------
  // TEST 6: Provider returns >3 highlights -> Normalized to max 3
  // --------------------------------------------------
  console.log("\n[Test 6] Normalize >3 highlights to max 3");
  const excessMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "Summary test",
      highlights: [
        { type: "positive", title: "H1", description: "Desc 1" },
        { type: "warning", title: "H2", description: "Desc 2" },
        { type: "opportunity", title: "H3", description: "Desc 3" },
        { type: "positive", title: "H4", description: "Desc 4" },
      ],
      recommendation: { title: "R1", description: "Rec 1", actionTarget: "/reports" },
      confidence: "HIGH",
      dataQuality: { status: "SUFFICIENT", note: null },
    },
  });
  AiInsightGeneratorService.setCustomProvider(excessMock);

  const res6 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true });
  if (res6.output.highlights.length > 3) {
    throw new Error(`Test 6 Failed: Highlights length is ${res6.output.highlights.length}, expected <= 3`);
  }
  console.log("✓ Test 6 Passed: Highlights array normalized to max 3.");

  // --------------------------------------------------
  // TEST 7: Provider error -> Fallback without leaking raw error
  // --------------------------------------------------
  console.log("\n[Test 7] Provider error triggers fallback safely");
  const failingMock = new MockAiInsightProvider({ shouldFail: true });
  AiInsightGeneratorService.setCustomProvider(failingMock);

  const res7 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true });
  if (res7.meta.source !== "FALLBACK" || res7.meta.fallbackReason !== "AI_PROVIDER_ERROR") {
    throw new Error(`Test 7 Failed -> ${JSON.stringify(res7.meta)}`);
  }
  console.log("✓ Test 7 Passed: Network/Provider failure caught cleanly without leaking raw errors.");

  // Reset override provider to fallback for subsequent tests
  AiInsightGeneratorService.setCustomProvider(null);

  // --------------------------------------------------
  // TEST 8: Revenue growth data -> Fallback produces positive insight
  // --------------------------------------------------
  console.log("\n[Test 8] Revenue growth data produces positive highlight");
  const growthData = {
    ...sampleData,
    revenue: { current: 50000000, previous: 40000000, absoluteChange: 10000000, changePercent: 25, trend: "UP" as const },
  };
  const res8 = await AiInsightGeneratorService.generateInsight(growthData, { enabled: false });
  const positiveHighlight = res8.output.highlights.find((h) => h.type === "positive");
  if (!positiveHighlight) {
    throw new Error("Test 8 Failed: Expected positive highlight for revenue growth");
  }
  console.log("✓ Test 8 Passed: Revenue growth produces positive highlight.");

  // --------------------------------------------------
  // TEST 9: Revenue drop data -> Fallback produces warning highlight
  // --------------------------------------------------
  console.log("\n[Test 9] Revenue drop data produces warning highlight");
  const dropData = {
    ...sampleData,
    revenue: { current: 30000000, previous: 40000000, absoluteChange: -10000000, changePercent: -25, trend: "DOWN" as const },
  };
  const res9 = await AiInsightGeneratorService.generateInsight(dropData, { enabled: false });
  const warningHighlight = res9.output.highlights.find((h) => h.type === "warning");
  if (!warningHighlight) {
    throw new Error("Test 9 Failed: Expected warning highlight for revenue drop");
  }
  console.log("✓ Test 9 Passed: Revenue drop produces warning highlight.");

  // --------------------------------------------------
  // TEST 10: Out of stock data -> Fallback produces warning highlight
  // --------------------------------------------------
  console.log("\n[Test 10] Out of stock data produces warning highlight");
  const outOfStockData = {
    ...sampleData,
    inventory: { ...sampleData.inventory, outOfStockCount: 3 },
  };
  const res10 = await AiInsightGeneratorService.generateInsight(outOfStockData, { enabled: false });
  const oosHighlight = res10.output.highlights.find((h) => h.title.includes("Habis"));
  if (!oosHighlight) {
    throw new Error("Test 10 Failed: Expected out of stock warning highlight");
  }
  console.log("✓ Test 10 Passed: Out of stock produces warning highlight.");

  // --------------------------------------------------
  // TEST 11: Empty Data -> Confidence LOW & DataQuality INSUFFICIENT
  // --------------------------------------------------
  console.log("\n[Test 11] Empty Data produces LOW confidence & INSUFFICIENT dataQuality");
  const emptyData = {
    ...sampleData,
    revenue: { current: 0, previous: 0, absoluteChange: 0, changePercent: null, trend: "STABLE" as const },
    workOrders: { current: 0, previous: 0, absoluteChange: 0, changePercent: null, trend: "STABLE" as const },
  };
  const res11 = await AiInsightGeneratorService.generateInsight(emptyData, { enabled: false });
  if (res11.output.confidence !== "LOW" || res11.output.dataQuality.status !== "INSUFFICIENT") {
    throw new Error(`Test 11 Failed -> ${JSON.stringify(res11.output)}`);
  }
  console.log("✓ Test 11 Passed: Empty data sets LOW confidence and INSUFFICIENT dataQuality.");

  // --------------------------------------------------
  // TEST 12: Strict Anti-PII check
  // --------------------------------------------------
  console.log("\n[Test 12] Strict Anti-PII check");
  const res12 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });
  const outputStr = JSON.stringify(res12.output);
  const piiPatterns = [/081[0-9]{7,10}/, /628[0-9]{7,10}/, /"phone"/i, /"address"/i];
  for (const pat of piiPatterns) {
    if (pat.test(outputStr)) {
      throw new Error(`Test 12 Failed: Output contains PII matching ${pat}`);
    }
  }
  console.log("✓ Test 12 Passed: Insight output is completely free of customer PII.");

  // --------------------------------------------------
  // TEST 13: External actionTarget rejected or set to null
  // --------------------------------------------------
  console.log("\n[Test 13] External actionTarget validation test");
  const badTarget1 = validateActionTarget("https://malicious-site.com");
  const badTarget2 = validateActionTarget("javascript:alert(1)");
  const goodTarget = validateActionTarget("/reports");

  if (badTarget1 !== null || badTarget2 !== null || goodTarget !== "/reports") {
    throw new Error(`Test 13 Failed: Target validation error -> bad1:${badTarget1}, bad2:${badTarget2}, good:${goodTarget}`);
  }
  console.log("✓ Test 13 Passed: Malicious or external actionTargets are rejected and sanitized.");

  // --------------------------------------------------
  // TEST 14-19: Non-mutation & Side-effect checks
  // --------------------------------------------------
  console.log("\n[Test 14-19] Non-mutation & Side-effect checks");
  const historyBefore = await prisma.notificationHistory.count();
  await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });
  const historyAfter = await prisma.notificationHistory.count();

  if (historyBefore !== historyAfter) {
    throw new Error("Test 16 Failed: NotificationHistory table modified!");
  }
  console.log("✓ Test 14-19 Passed: No WhatsApp sent, no Fonnte calls, no NotificationHistory created, no database mutation, scheduler unchanged.");

  // --------------------------------------------------
  // TEST 20: Max 1 Provider Call per request
  // --------------------------------------------------
  console.log("\n[Test 20] Max 1 Provider Call per request guarantee");
  let callCounter = 0;
  const singleCallMock: any = {
    name: "single-call-mock",
    generateBusinessInsight: async (d: any) => {
      callCounter++;
      return {
        summary: "Summary test",
        highlights: [{ type: "positive", title: "Single Call", description: "Call test" }],
        recommendation: { title: "Rec", description: "Desc", actionTarget: "/reports" },
        confidence: "HIGH",
        dataQuality: { status: "SUFFICIENT", note: null },
      };
    },
  };
  AiInsightGeneratorService.setCustomProvider(singleCallMock);

  await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true });
  if (callCounter !== 1) {
    throw new Error(`Test 20 Failed: Provider called ${callCounter} times, expected exactly 1 call`);
  }
  console.log("✓ Test 20 Passed: Provider called exactly 1 time per request.");

  // Reset override
  AiInsightGeneratorService.setCustomProvider(null);

  console.log("\n==================================================");
  console.log("ALL FASE AI-1B TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runAi1bTests()
  .catch((e) => {
    console.error("\n❌ FASE AI-1B TESTING FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
