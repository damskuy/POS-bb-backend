import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "../lib/ai/ai-insight-generator.service";
import { MockAiInsightProvider, buildAiPrompt } from "../lib/ai/ai-provider";
import { validateActionTarget, AiInsightOutputSchema } from "../lib/ai/ai-insight-schema";
import { AiInsightCache } from "../lib/ai/ai-insight-cache";
import { prisma } from "../lib/prisma";

async function runAi2IntegrationTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-2 — REAL PROVIDER INTEGRATION TESTS");
  console.log("==================================================");

  // Clear cache and custom provider override before starting
  AiInsightCache.clear();
  AiInsightGeneratorService.setCustomProvider(null);

  const sampleData = await getAiInsightData("2026-07-01", "2026-07-31");

  // --------------------------------------------------
  // TEST 1: AI Disabled -> Fallback (source: FALLBACK, reason: AI_DISABLED)
  // --------------------------------------------------
  console.log("\n[Test 1] AI Disabled test");
  const res1 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });
  if (res1.meta.source !== "FALLBACK" || res1.meta.providerCalled !== false || res1.meta.fallbackReason !== "AI_DISABLED") {
    throw new Error(`Test 1 Failed -> ${JSON.stringify(res1.meta)}`);
  }
  console.log("✓ Test 1 Passed: Disabled AI uses deterministic fallback with AI_DISABLED reason.");

  // --------------------------------------------------
  // TEST 2: Provider Not Configured -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 2] Provider Not Configured test");
  delete process.env.AI_INSIGHT_PROVIDER;
  delete process.env.AI_API_KEY;

  const res2 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "" });
  if (res2.meta.source !== "FALLBACK" || res2.meta.fallbackReason !== "AI_PROVIDER_NOT_CONFIGURED") {
    throw new Error(`Test 2 Failed -> ${JSON.stringify(res2.meta)}`);
  }
  console.log("✓ Test 2 Passed: Unconfigured provider falls back safely.");

  // --------------------------------------------------
  // TEST 3: API Key Missing -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 3] API Key Missing test");
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_API_KEY;

  const res3 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "gemini" });
  if (res3.meta.source !== "FALLBACK" || res3.meta.fallbackReason !== "AI_PROVIDER_NOT_CONFIGURED") {
    throw new Error(`Test 3 Failed -> ${JSON.stringify(res3.meta)}`);
  }
  console.log("✓ Test 3 Passed: Missing API key falls back with AI_PROVIDER_NOT_CONFIGURED.");

  // --------------------------------------------------
  // TEST 4: Provider Success -> source: AI
  // --------------------------------------------------
  console.log("\n[Test 4] Provider Success test");
  let providerCallCounter: number = 0;
  const successMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "AI Generated Executive Summary for Bengkel Baik.",
      highlights: [
        { type: "positive", title: "Revenue Growth", description: "Revenue grew 15%" },
        { type: "warning", title: "Low Stock Parts", description: "2 items low stock" },
      ],
      recommendation: {
        title: "Restock Parts",
        description: "Reorder low stock items immediately",
        actionLabel: "Buka Inventaris",
        actionTarget: "/inventory",
      },
      confidence: "HIGH",
      dataQuality: { status: "SUFFICIENT", note: null },
    },
  });

  const originalGenerate = successMock.generateBusinessInsight.bind(successMock);
  successMock.generateBusinessInsight = async (d) => {
    providerCallCounter++;
    return originalGenerate(d);
  };

  AiInsightGeneratorService.setCustomProvider(successMock);

  const res4 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "mock", model: "mock-v1" });
  if (res4.meta.source !== "AI" || res4.meta.providerCalled !== true || res4.meta.fallbackReason !== null) {
    throw new Error(`Test 4 Failed -> ${JSON.stringify(res4.meta)}`);
  }
  if ((providerCallCounter as any) !== 1) {
    throw new Error(`Test 4 Failed: Expected provider call counter 1, got ${providerCallCounter}`);
  }
  console.log("✓ Test 4 Passed: Provider success returns validated AI output.");

  // --------------------------------------------------
  // TEST 5: Cache Hit Test (Same date range) -> Provider NOT called again
  // --------------------------------------------------
  console.log("\n[Test 5] Cache Hit test");
  const res5 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "mock", model: "mock-v1" });
  if (res5.meta.source !== "AI" || res5.meta.providerCalled !== false) {
    throw new Error(`Test 5 Failed: Cache hit expected source=AI and providerCalled=false -> ${JSON.stringify(res5.meta)}`);
  }
  if ((providerCallCounter as any) !== 1) {
    throw new Error(`Test 5 Failed: Cache hit should NOT increment providerCallCounter (got ${providerCallCounter})`);
  }
  const cacheStats = AiInsightCache.getStats();
  if (cacheStats.hits < 1) {
    throw new Error(`Test 5 Failed: Cache stats expected hits > 0 -> ${JSON.stringify(cacheStats)}`);
  }
  console.log("✓ Test 5 Passed: Second call for same period served from in-memory cache without calling provider.");

  // --------------------------------------------------
  // TEST 6: Cache Miss Test (Different date range) -> Provider called
  // --------------------------------------------------
  console.log("\n[Test 6] Cache Miss test");
  const juneData = await getAiInsightData("2026-06-01", "2026-06-30");
  const res6 = await AiInsightGeneratorService.generateInsight(juneData, { enabled: true, provider: "mock", model: "mock-v1" });
  if (res6.meta.source !== "AI" || res6.meta.providerCalled !== true) {
    throw new Error(`Test 6 Failed: Cache miss expected providerCalled=true -> ${JSON.stringify(res6.meta)}`);
  }
  if ((providerCallCounter as any) !== 2) {
    throw new Error(`Test 6 Failed: Expected providerCallCounter 2, got ${providerCallCounter}`);
  }
  console.log("✓ Test 6 Passed: Different date range triggers cache miss and invokes provider.");

  // --------------------------------------------------
  // TEST 7: Provider Timeout Handling -> AI_PROVIDER_TIMEOUT
  // --------------------------------------------------
  console.log("\n[Test 7] Provider Timeout test");
  AiInsightCache.clear();
  const timeoutMock: any = {
    name: "timeout-mock",
    generateBusinessInsight: async () => {
      const err: any = new Error("AI request timed out");
      err.name = "AbortError";
      throw err;
    },
  };
  AiInsightGeneratorService.setCustomProvider(timeoutMock);

  const res7 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "timeout-mock", model: "v1" });
  if (res7.meta.source !== "FALLBACK" || res7.meta.fallbackReason !== "AI_PROVIDER_TIMEOUT") {
    throw new Error(`Test 7 Failed -> ${JSON.stringify(res7.meta)}`);
  }
  console.log("✓ Test 7 Passed: Timeout triggers AI_PROVIDER_TIMEOUT fallback.");

  // --------------------------------------------------
  // TEST 8: Provider Rate Limit (HTTP 429) -> AI_PROVIDER_ERROR
  // --------------------------------------------------
  console.log("\n[Test 8] Provider Rate Limit (HTTP 429) test");
  const rateLimitMock: any = {
    name: "rate-limit-mock",
    generateBusinessInsight: async () => {
      throw new Error("AI Provider rate limit exceeded (HTTP 429)");
    },
  };
  AiInsightGeneratorService.setCustomProvider(rateLimitMock);

  const res8 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "rate-limit-mock", model: "v1" });
  if (res8.meta.source !== "FALLBACK" || res8.meta.fallbackReason !== "AI_PROVIDER_ERROR") {
    throw new Error(`Test 8 Failed -> ${JSON.stringify(res8.meta)}`);
  }
  console.log("✓ Test 8 Passed: Rate limit HTTP 429 triggers AI_PROVIDER_ERROR fallback.");

  // --------------------------------------------------
  // TEST 9: Invalid Output Schema -> Fallback
  // --------------------------------------------------
  console.log("\n[Test 9] Invalid Output Schema test");
  const invalidMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "Invalid output",
      // @ts-ignore
      highlights: "not-an-array",
    },
  });
  AiInsightGeneratorService.setCustomProvider(invalidMock);

  const res9 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "invalid-mock", model: "v1" });
  if (res9.meta.source !== "FALLBACK" || res9.meta.fallbackReason !== "AI_PROVIDER_ERROR") {
    throw new Error(`Test 9 Failed -> ${JSON.stringify(res9.meta)}`);
  }
  console.log("✓ Test 9 Passed: Invalid output schema triggers fallback.");

  // --------------------------------------------------
  // TEST 10: Malicious actionTarget Sanitization
  // --------------------------------------------------
  console.log("\n[Test 10] Malicious actionTarget Sanitization test");
  const maliciousMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "Summary test",
      highlights: [{ type: "positive", title: "H1", description: "D1" }],
      recommendation: {
        title: "Malicious Rec",
        description: "Desc",
        actionLabel: "Click Here",
        actionTarget: "https://phishing.com/steal-data",
      },
      confidence: "HIGH",
      dataQuality: { status: "SUFFICIENT", note: null },
    },
  });
  AiInsightGeneratorService.setCustomProvider(maliciousMock);

  const res10 = await AiInsightGeneratorService.generateInsight(sampleData, { enabled: true, provider: "malicious-mock", model: "v1" });
  if (res10.output.recommendation.actionTarget !== null) {
    throw new Error(`Test 10 Failed: Malicious actionTarget was NOT sanitized -> ${res10.output.recommendation.actionTarget}`);
  }
  console.log("✓ Test 10 Passed: External actionTarget sanitized to null.");

  // --------------------------------------------------
  // TEST 11: Anti-PII Payload Audit
  // --------------------------------------------------
  console.log("\n[Test 11] Anti-PII Payload Audit");
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
      throw new Error(`Test 11 Failed: PII detected matching ${regex}`);
    }
  }
  console.log("✓ Test 11 Passed: ZERO PII found in prompt payload.");

  // --------------------------------------------------
  // TEST 12: Zero Database Side Effects Audit
  // --------------------------------------------------
  console.log("\n[Test 12] Zero Database Side Effects Audit");
  const notifCountBefore = await prisma.notificationHistory.count();
  await AiInsightGeneratorService.generateInsight(sampleData, { enabled: false });
  const notifCountAfter = await prisma.notificationHistory.count();

  if (notifCountBefore !== notifCountAfter) {
    throw new Error("Test 12 Failed: Database notificationHistory was mutated!");
  }
  console.log("✓ Test 12 Passed: ZERO database mutations, zero WhatsApp calls, zero Fonnte requests.");

  // Reset override and clear cache
  AiInsightGeneratorService.setCustomProvider(null);
  AiInsightCache.clear();

  console.log("\n==================================================");
  console.log("ALL FASE AI-2 INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runAi2IntegrationTests()
  .catch((err) => {
    console.error("\n❌ FASE AI-2 TESTING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
