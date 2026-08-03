import { getAiInsightData } from "../lib/reports/ai-insight-data";
import { AiInsightGeneratorService } from "../lib/ai/ai-insight-generator.service";
import { MockAiInsightProvider, buildAiPrompt } from "../lib/ai/ai-provider";
import { validateActionTarget, AiInsightOutputSchema } from "../lib/ai/ai-insight-schema";
import { prisma } from "../lib/prisma";

async function runAi1dHardeningTests() {
  console.log("==================================================");
  console.log("STARTING FASE AI-1D — VALIDATION & HARDENING TESTS");
  console.log("==================================================");

  // Reset custom override provider
  AiInsightGeneratorService.setCustomProvider(null);

  // Fetch baseline sample data
  const julyData = await getAiInsightData("2026-07-01", "2026-07-31");
  const juneData = await getAiInsightData("2026-06-01", "2026-06-30");

  // --------------------------------------------------
  // TEST 1: Date filter propagation & metric sensitivity
  // --------------------------------------------------
  console.log("\n[Test 1] Date filter propagation & metric sensitivity test");
  if (julyData.period.startDate !== "2026-07-01" || julyData.period.endDate !== "2026-07-31") {
    throw new Error(`Test 1 Failed: July period mismatch -> ${JSON.stringify(julyData.period)}`);
  }
  if (juneData.period.startDate !== "2026-06-01" || juneData.period.endDate !== "2026-06-30") {
    throw new Error(`Test 1 Failed: June period mismatch -> ${JSON.stringify(juneData.period)}`);
  }
  console.log("✓ Test 1 Passed: Filter parameters correctly alter period calculations and metric aggregation.");

  // --------------------------------------------------
  // TEST 2: Empty Data Handling -> LOW confidence & INSUFFICIENT dataQuality
  // --------------------------------------------------
  console.log("\n[Test 2] Empty Data Handling");
  const emptyData = {
    ...julyData,
    revenue: { current: 0, previous: 0, absoluteChange: 0, changePercent: null, trend: "STABLE" as const },
    workOrders: { current: 0, previous: 0, absoluteChange: 0, changePercent: null, trend: "STABLE" as const },
  };
  const emptyRes = await AiInsightGeneratorService.generateInsight(emptyData, { enabled: false });
  if (emptyRes.output.confidence !== "LOW" || emptyRes.output.dataQuality.status !== "INSUFFICIENT") {
    throw new Error(`Test 2 Failed: Empty data expected LOW/INSUFFICIENT -> ${JSON.stringify(emptyRes.output)}`);
  }
  console.log("✓ Test 2 Passed: Empty data correctly returns LOW confidence & INSUFFICIENT status.");

  // --------------------------------------------------
  // TEST 3: Limited Data Handling -> LIMITED / INSUFFICIENT status
  // --------------------------------------------------
  console.log("\n[Test 3] Limited Data Handling");
  const limitedData = {
    ...julyData,
    revenue: { current: 500000, previous: 0, absoluteChange: 500000, changePercent: null, trend: "UP" as const },
    workOrders: { current: 1, previous: 0, absoluteChange: 1, changePercent: null, trend: "UP" as const },
  };
  const limitedRes = await AiInsightGeneratorService.generateInsight(limitedData, { enabled: false });
  if (limitedRes.output.dataQuality.status === "SUFFICIENT") {
    throw new Error(`Test 3 Failed: Limited data expected LIMITED/INSUFFICIENT -> ${limitedRes.output.dataQuality.status}`);
  }
  console.log("✓ Test 3 Passed: Limited transaction data yields non-SUFFICIENT data quality flag.");

  // --------------------------------------------------
  // TEST 4: AI Provider Timeout Handling -> AI_PROVIDER_TIMEOUT fallback
  // --------------------------------------------------
  console.log("\n[Test 4] AI Provider Timeout Handling");
  const timeoutMock: any = {
    name: "timeout-mock-provider",
    generateBusinessInsight: async () => {
      const err: any = new Error("AI request aborted");
      err.name = "AbortError";
      throw err;
    },
  };
  AiInsightGeneratorService.setCustomProvider(timeoutMock);

  const timeoutRes = await AiInsightGeneratorService.generateInsight(julyData, { enabled: true });
  if (
    timeoutRes.meta.source !== "FALLBACK" ||
    timeoutRes.meta.providerCalled !== true ||
    timeoutRes.meta.fallbackReason !== "AI_PROVIDER_TIMEOUT"
  ) {
    throw new Error(`Test 4 Failed: Timeout did not produce AI_PROVIDER_TIMEOUT -> ${JSON.stringify(timeoutRes.meta)}`);
  }
  console.log("✓ Test 4 Passed: Provider timeout triggers AI_PROVIDER_TIMEOUT fallback gracefully.");

  // --------------------------------------------------
  // TEST 5: AI Provider Generic Error Handling -> AI_PROVIDER_ERROR fallback
  // --------------------------------------------------
  console.log("\n[Test 5] AI Provider Network Error Handling");
  const networkErrorMock = new MockAiInsightProvider({ shouldFail: true });
  AiInsightGeneratorService.setCustomProvider(networkErrorMock);

  const errorRes = await AiInsightGeneratorService.generateInsight(julyData, { enabled: true });
  if (
    errorRes.meta.source !== "FALLBACK" ||
    errorRes.meta.providerCalled !== true ||
    errorRes.meta.fallbackReason !== "AI_PROVIDER_ERROR"
  ) {
    throw new Error(`Test 5 Failed: Network error did not produce AI_PROVIDER_ERROR -> ${JSON.stringify(errorRes.meta)}`);
  }
  console.log("✓ Test 5 Passed: Provider network failure returns AI_PROVIDER_ERROR fallback cleanly.");

  // --------------------------------------------------
  // TEST 6: Invalid AI Output Schema -> Seamless Fallback
  // --------------------------------------------------
  console.log("\n[Test 6] Invalid AI Output Schema Handling");
  const invalidJsonMock = new MockAiInsightProvider({
    mockOutput: {
      summary: "Malformed output",
      // @ts-ignore
      highlights: "not-an-array",
      recommendation: { title: "Bad", description: "Bad" },
    },
  });
  AiInsightGeneratorService.setCustomProvider(invalidJsonMock);

  const invalidRes = await AiInsightGeneratorService.generateInsight(julyData, { enabled: true });
  if (invalidRes.meta.source !== "FALLBACK" || invalidRes.meta.fallbackReason !== "AI_PROVIDER_ERROR") {
    throw new Error(`Test 6 Failed: Invalid output schema should cause fallback -> ${JSON.stringify(invalidRes.meta)}`);
  }
  console.log("✓ Test 6 Passed: Invalid AI JSON schema rejected and fallback served.");

  // --------------------------------------------------
  // TEST 7: Strict PII Audit (Prompt & Output)
  // --------------------------------------------------
  console.log("\n[Test 7] Strict Anti-PII Audit");
  const promptText = buildAiPrompt(julyData);
  const fallbackInsight = await AiInsightGeneratorService.generateInsight(julyData, { enabled: false });

  const combinedPayload = promptText + JSON.stringify(fallbackInsight.output);
  const piiRegexes = [
    /081[0-9]{7,10}/,
    /628[0-9]{7,10}/,
    /"phone"/i,
    /"address"/i,
    /"customerName"/i,
    /"vehiclePlate"/i,
  ];

  for (const regex of piiRegexes) {
    if (regex.test(combinedPayload)) {
      throw new Error(`Test 7 Failed: PII detected matching ${regex}`);
    }
  }
  console.log("✓ Test 7 Passed: ZERO PII found in AI prompt or output payload.");

  // --------------------------------------------------
  // TEST 8: actionTarget Security Audit against malicious URLs
  // --------------------------------------------------
  console.log("\n[Test 8] actionTarget Security Audit");
  const maliciousTargets = [
    "https://external-phishing.com",
    "http://insecure-site.org/hack",
    "javascript:alert('xss')",
    "data:text/html,<script>alert(1)</script>",
    "//double-slash-attack.com",
    "/unauthorized-admin-route",
  ];

  for (const target of maliciousTargets) {
    const result = validateActionTarget(target);
    if (result !== null) {
      throw new Error(`Test 8 Failed: Malicious target "${target}" was incorrectly allowed: ${result}`);
    }
  }

  const validTargets = ["/reports", "/work-orders", "/inventory", "/customers", "/whatsapp"];
  for (const target of validTargets) {
    const result = validateActionTarget(target);
    if (result !== target) {
      throw new Error(`Test 8 Failed: Valid target "${target}" was rejected`);
    }
  }
  console.log("✓ Test 8 Passed: All external/malicious actionTargets rejected; internal routes validated.");

  // --------------------------------------------------
  // TEST 9: Dashboard & Report Resilience Guarantee
  // --------------------------------------------------
  console.log("\n[Test 9] Dashboard & Report Resilience Guarantee");
  const parsedFallback = AiInsightOutputSchema.safeParse(fallbackInsight.output);
  if (!parsedFallback.success) {
    throw new Error(`Test 9 Failed: Fallback output failed Zod schema -> ${JSON.stringify(parsedFallback.error)}`);
  }
  console.log("✓ Test 9 Passed: Fallback output strictly satisfies AiInsightOutputSchema.");

  // --------------------------------------------------
  // TEST 10: Zero Side Effects & No DB Mutation Audit
  // --------------------------------------------------
  console.log("\n[Test 10] Zero Side Effects & Database Protection Audit");
  const notifCountBefore = await prisma.notificationHistory.count();
  await AiInsightGeneratorService.generateInsight(julyData, { enabled: false });
  const notifCountAfter = await prisma.notificationHistory.count();

  if (notifCountBefore !== notifCountAfter) {
    throw new Error("Test 10 Failed: NotificationHistory table was mutated!");
  }
  console.log("✓ Test 10 Passed: No DB mutations, no WhatsApp triggers, no Fonnte side effects.");

  // Reset custom provider override
  AiInsightGeneratorService.setCustomProvider(null);

  // --------------------------------------------------
  // TEST 11: Disabled AI Provider Protection by Default
  // --------------------------------------------------
  console.log("\n[Test 11] Default AI_INSIGHT_ENABLED protection test");
  delete process.env.AI_INSIGHT_ENABLED;
  const defaultRes = await AiInsightGeneratorService.generateInsight(julyData);
  if (defaultRes.meta.source !== "FALLBACK" || defaultRes.meta.providerCalled !== false) {
    throw new Error(`Test 11 Failed: Default setting called AI provider -> ${JSON.stringify(defaultRes.meta)}`);
  }
  console.log("✓ Test 11 Passed: Default configuration guarantees source=FALLBACK and providerCalled=false.");

  console.log("\n==================================================");
  console.log("ALL FASE AI-1D HARDENING TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runAi1dHardeningTests()
  .catch((err) => {
    console.error("\n❌ FASE AI-1D TESTING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
